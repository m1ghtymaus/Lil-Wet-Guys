"""Tests for setting up Lil Wet Guys and adding or editing plants."""

from __future__ import annotations

from contextlib import contextmanager
from pathlib import Path
from unittest.mock import patch

import pytest
from PIL import Image

from custom_components.lil_wet_guys.const import DOMAIN, PHOTO_DIR, SUBENTRY_PLANT
from custom_components.lil_wet_guys.species import SPECIES
from homeassistant.config_entries import SOURCE_USER
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.helpers import device_registry as dr
from homeassistant.util.unit_system import US_CUSTOMARY_SYSTEM

from .conftest import PLANT_ID, make_entry, plant_data, setup_entry

pytestmark = pytest.mark.usefixtures("isolated_config")


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


async def test_add_propagation(hass: HomeAssistant) -> None:
    """A propagation asks which plant the cutting is from, and is named and drawn after it."""
    hass.config.units = US_CUSTOMARY_SYSTEM
    entry = await setup_entry(hass, make_entry({}, {"fertilizer": True}))
    result = await hass.config_entries.subentries.async_init(
        (entry.entry_id, SUBENTRY_PLANT), context={"source": SOURCE_USER}
    )
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"], {"name": "Baby monstera", "species": "propagation"}
    )
    assert result["step_id"] == "cutting"
    result = await hass.config_entries.subentries.async_configure(result["flow_id"], {"cutting": "monstera_deliciosa"})
    assert result["step_id"] == "details"
    suggested = {str(k): k.description.get("suggested_value") for k in result["data_schema"].schema if k.description}
    assert suggested["base_days"] == 7  # a fresh jar of water every week
    assert suggested["temp_min"] == SPECIES["monstera_deliciosa"].temp_min_f  # the cutting's own range

    result = await hass.config_entries.subentries.async_configure(result["flow_id"], DETAILS)
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    subentry = next(iter(entry.subentries.values()))
    assert subentry.data["species"] == "propagation"
    assert subentry.data["cutting"] == "monstera_deliciosa"
    attrs = hass.states.get("sensor.baby_monstera_status").attributes
    assert attrs["shape"] == "propagation"
    assert attrs["cutting"] == "monstera_deliciosa"
    assert attrs["species_name"] == "Swiss Cheese Plant cutting"
    assert attrs["fertilizer_dose"] == 0  # a cutting in water isn't fed
    assert "fertilizer_step" not in attrs
    device = dr.async_get(hass).async_get_device(identifiers={(DOMAIN, subentry.subentry_id)})
    assert device.model == "Propagation: Swiss Cheese Plant (Monstera deliciosa)"

    # Editing it can change what it's a cutting of.
    result = await entry.start_subentry_reconfigure_flow(hass, subentry.subentry_id)
    assert "cutting" in {str(k) for k in result["data_schema"].schema}
    user_input = {k: v for k, v in DETAILS.items() if k != "last_watered"}
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"], user_input | {"name": "Baby pothos", "species": "propagation", "cutting": "golden_pothos"}
    )
    assert result["reason"] == "reconfigure_successful"
    await hass.async_block_till_done()
    assert entry.subentries[subentry.subentry_id].data["cutting"] == "golden_pothos"


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


async def test_temperature_unit_setting(hass: HomeAssistant) -> None:
    """Configure → Settings picks the unit for every plant, whatever Home Assistant uses."""
    entry = await setup_entry(hass, make_entry())
    status = hass.states.get("sensor.pothos_status").attributes
    assert status["temperature_unit"] == "°C"
    assert status["temperature_min"] == 15.6

    result = await hass.config_entries.options.async_init(entry.entry_id)
    result = await hass.config_entries.options.async_configure(result["flow_id"], {"next_step_id": "settings"})
    assert result["step_id"] == "settings"
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {"temperature_unit": "fahrenheit", "fertilizer": False}
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    assert entry.options["temperature_unit"] == "fahrenheit"

    # The plants reload and their entities switch over.
    status = hass.states.get("sensor.pothos_status").attributes
    assert status["temperature_unit"] == "°F"
    assert status["temperature_min"] == 60
    assert status["temperature_max"] == 85

    # New plants are entered in °F too, and still stored in °C.
    result = await _start_add(hass, entry, "Aloe", "tiger_aloe")
    suggested = {str(k): k.description.get("suggested_value") for k in result["data_schema"].schema if k.description}
    assert suggested["temp_min"] == 55
    await hass.config_entries.subentries.async_configure(result["flow_id"], DETAILS | {"temp_min": 50, "temp_max": 86})
    aloe = next(s for s in entry.subentries.values() if s.title == "Aloe")
    assert aloe.data["temp_min"] == pytest.approx(10)


async def test_fertilizer_setting(hass: HomeAssistant) -> None:
    """Configure → Settings turns the fertilizer reminders on for every plant."""
    entry = await setup_entry(hass, make_entry())
    assert "fertilizer" not in hass.states.get("sensor.pothos_status").attributes
    result = await hass.config_entries.options.async_init(entry.entry_id)
    result = await hass.config_entries.options.async_configure(result["flow_id"], {"next_step_id": "settings"})
    assert result["data_schema"]({})["fertilizer"] is False
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {"temperature_unit": "auto", "fertilizer": True}
    )
    await hass.async_block_till_done()
    assert hass.states.get("sensor.pothos_status").attributes["fertilizer_step"] == 1
    assert hass.states.get("select.pothos_next_watering").state == "feed_1"


async def test_holidays_setting(hass: HomeAssistant) -> None:
    """Configure → Settings turns holiday decorations on; the card learns it from each status."""
    entry = await setup_entry(hass, make_entry())
    assert "holidays" not in hass.states.get("sensor.pothos_status").attributes
    result = await hass.config_entries.options.async_init(entry.entry_id)
    result = await hass.config_entries.options.async_configure(result["flow_id"], {"next_step_id": "settings"})
    assert result["data_schema"]({})["holidays"] is False
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {"temperature_unit": "auto", "holidays": True}
    )
    await hass.async_block_till_done()
    assert entry.options["holidays"] is True
    assert hass.states.get("sensor.pothos_status").attributes["holidays"] is True


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
    """Editing changes the name and details and reloads the plant, keeping its fullness."""
    entry = await setup_entry(hass, make_entry({PLANT_ID: ("Pothos", plant_data(fullness=60))}))
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
    assert subentry.data["fullness"] == 60  # set on the device page, not in this form
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
