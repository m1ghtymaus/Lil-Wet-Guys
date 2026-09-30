"""Tests for setting up Lil Wet Guys and adding or editing plants."""

from __future__ import annotations

from contextlib import contextmanager
from pathlib import Path
from unittest.mock import patch

import pytest
from PIL import Image

from custom_components.lil_wet_guys.const import DOMAIN, PHOTO_DIR, SUBENTRY_PLANT
from homeassistant.config_entries import SOURCE_USER
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.util.unit_system import US_CUSTOMARY_SYSTEM

from .conftest import PLANT_ID, make_entry, plant_data, setup_entry


async def test_user_flow_creates_the_entry(hass: HomeAssistant) -> None:
    """Setup is a single confirmation."""
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    assert result["type"] is FlowResultType.FORM
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {})
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "Lil Wet Guys"


async def test_only_one_entry(hass: HomeAssistant) -> None:
    """A second Lil Wet Guys entry is refused."""
    make_entry({}).add_to_hass(hass)
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "single_instance_allowed"


async def _start_add(hass: HomeAssistant, entry, name: str, species: str):
    result = await hass.config_entries.subentries.async_init(
        (entry.entry_id, SUBENTRY_PLANT), context={"source": SOURCE_USER}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "user"
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"], {"name": name, "species": species}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "details"
    return result


DETAILS = {
    "light": "medium",
    "base_days": 8,
    "temp_min": 16,
    "temp_max": 29,
    "pot_color": [30, 60, 90],
    "last_watered": "2026-09-01 08:00:00",
    "sensors": {"moisture_jump": 12},
}


async def test_add_plant_from_preset(hass: HomeAssistant) -> None:
    """The details page is prefilled from the preset and stored as entered."""
    entry = await setup_entry(hass, make_entry({}))
    result = await _start_add(hass, entry, "Pothos", "golden_pothos")
    suggested = {str(k): k.description.get("suggested_value") for k in result["data_schema"].schema if k.description}
    assert suggested["light"] == "medium"
    assert suggested["base_days"] == 8
    assert "shape" not in suggested  # presets bring their own drawing

    result = await hass.config_entries.subentries.async_configure(result["flow_id"], DETAILS)
    assert result["type"] is FlowResultType.CREATE_ENTRY
    subentry = next(iter(entry.subentries.values()))
    assert subentry.title == "Pothos"
    assert subentry.data["species"] == "golden_pothos"
    assert subentry.data["light"] == "medium"
    assert subentry.data["temp_min"] == 16
    assert subentry.data["pot_color"] == [30, 60, 90]
    assert subentry.data["moisture_jump"] == 12
    assert subentry.data["last_watered"].startswith("2026-09-01")
    assert "photo_file" not in subentry.data


async def test_fahrenheit_is_stored_as_celsius(hass: HomeAssistant) -> None:
    """Temperatures are entered in the user's units and stored in °C."""
    hass.config.units = US_CUSTOMARY_SYSTEM
    entry = await setup_entry(hass, make_entry({}))
    result = await _start_add(hass, entry, "Aloe", "tiger_aloe")
    suggested = {str(k): k.description.get("suggested_value") for k in result["data_schema"].schema if k.description}
    assert suggested["temp_min"] == 55
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"], DETAILS | {"temp_min": 50, "temp_max": 86}
    )
    subentry = next(iter(entry.subentries.values()))
    assert subentry.data["temp_min"] == pytest.approx(10)
    assert subentry.data["temp_max"] == pytest.approx(30)


async def test_other_plant_picks_a_drawing(hass: HomeAssistant) -> None:
    """A plant without a preset asks which shape to draw."""
    entry = await setup_entry(hass, make_entry({}))
    result = await _start_add(hass, entry, "Mystery", "other")
    assert any(str(k) == "shape" for k in result["data_schema"].schema)
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"], DETAILS | {"shape": "generic_succulent"}
    )
    subentry = next(iter(entry.subentries.values()))
    assert subentry.data["species"] == "other"
    assert subentry.data["shape"] == "generic_succulent"


async def test_temperature_range_must_make_sense(hass: HomeAssistant) -> None:
    """Minimum at or above maximum is an error."""
    entry = await setup_entry(hass, make_entry({}))
    result = await _start_add(hass, entry, "Pothos", "golden_pothos")
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"], DETAILS | {"temp_min": 30, "temp_max": 20}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"base": "temp_range"}


FILE_ID = "0123456789abcdef0123456789abcdef"


@contextmanager
def _fake_upload(path: Path):
    @contextmanager
    def process(_hass, _file_id):
        yield path

    with patch("custom_components.lil_wet_guys.config_flow.process_uploaded_file", process):
        yield


async def test_photo_is_resized_and_stored(hass: HomeAssistant, tmp_path: Path) -> None:
    """Uploads are saved as JPEGs no bigger than 1024 px."""
    upload = tmp_path / "big.png"
    Image.new("RGB", (3000, 2000), (0, 128, 0)).save(upload)
    entry = await setup_entry(hass, make_entry({}))
    result = await _start_add(hass, entry, "Pothos", "golden_pothos")
    with _fake_upload(upload):
        result = await hass.config_entries.subentries.async_configure(
            result["flow_id"], DETAILS | {"photo": FILE_ID}
        )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    subentry = next(iter(entry.subentries.values()))
    saved = Path(hass.config.path(PHOTO_DIR)) / subentry.data["photo_file"]
    with Image.open(saved) as img:
        assert img.format == "JPEG"
        assert max(img.size) == 1024


async def test_bad_photo_is_rejected(hass: HomeAssistant, tmp_path: Path) -> None:
    """A file that isn't an image shows an error on the photo field."""
    upload = tmp_path / "notes.txt"
    upload.write_text("not a photo")
    entry = await setup_entry(hass, make_entry({}))
    result = await _start_add(hass, entry, "Pothos", "golden_pothos")
    with _fake_upload(upload):
        result = await hass.config_entries.subentries.async_configure(
            result["flow_id"], DETAILS | {"photo": FILE_ID}
        )
    assert result["errors"] == {"photo": "bad_photo"}


async def test_reconfigure_updates_the_plant(hass: HomeAssistant) -> None:
    """Editing changes the name and details and reloads the plant."""
    entry = await setup_entry(hass, make_entry())
    result = await entry.start_subentry_reconfigure_flow(hass, PLANT_ID)
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "reconfigure"
    user_input = {k: v for k, v in DETAILS.items() if k != "last_watered"}
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"], user_input | {"name": "Big pothos", "species": "golden_pothos", "light": "low"}
    )
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "reconfigure_successful"
    await hass.async_block_till_done()
    subentry = entry.subentries[PLANT_ID]
    assert subentry.title == "Big pothos"
    assert subentry.data["light"] == "low"
    assert hass.states.get("sensor.pothos_status").attributes["interval_days"] == 12


async def test_reconfigure_can_remove_the_photo(hass: HomeAssistant) -> None:
    """Ticking 'remove' drops the photo."""
    entry = await setup_entry(hass, make_entry({PLANT_ID: ("Pothos", plant_data(photo_file="x.jpg"))}))
    result = await entry.start_subentry_reconfigure_flow(hass, PLANT_ID)
    user_input = {k: v for k, v in DETAILS.items() if k != "last_watered"}
    await hass.config_entries.subentries.async_configure(
        result["flow_id"], user_input | {"name": "Pothos", "species": "golden_pothos", "remove_photo": True}
    )
    await hass.async_block_till_done()
    assert "photo_file" not in entry.subentries[PLANT_ID].data
