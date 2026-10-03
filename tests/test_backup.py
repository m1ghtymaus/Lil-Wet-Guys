"""Tests for exporting and importing plants, and for safe upgrades."""

from __future__ import annotations

import io
import json
import re
import zipfile
from contextlib import contextmanager
from datetime import timedelta
from pathlib import Path
from typing import Any
from unittest.mock import patch

import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.lil_wet_guys.backup import EXPORT_DIR
from custom_components.lil_wet_guys.const import DOMAIN, PHOTO_DIR
from custom_components.lil_wet_guys.species import SPECIES
from homeassistant.components.http.auth import async_sign_path
from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.util import dt as dt_util

from .conftest import PLANT_ID, make_entry, plant_data, setup_entry, watered_ago

pytestmark = pytest.mark.usefixtures("isolated_config")

ART_SPECIES = Path(__file__).parent.parent / "custom_components/lil_wet_guys/frontend/art/species.js"


def _two_plants(hass: HomeAssistant) -> dict[str, tuple[str, dict[str, Any]]]:
    photos = Path(hass.config.path(PHOTO_DIR))
    photos.mkdir(parents=True, exist_ok=True)
    (photos / "pothos.jpg").write_bytes(b"\xff\xd8 fake jpeg \xff\xd9")
    return {
        PLANT_ID: ("Pothos", plant_data(photo_file="pothos.jpg", temperature_sensor="sensor.room")),
        "plant02": ("Monstera", plant_data(species="monstera_deliciosa", light="medium", base_days=8.0)),
    }


async def _export(hass: HomeAssistant, entry) -> dict[str, Any]:
    result = await hass.config_entries.options.async_init(entry.entry_id)
    assert result["type"] is FlowResultType.MENU
    result = await hass.config_entries.options.async_configure(result["flow_id"], {"next_step_id": "export"})
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "export_ready"
    return result


@contextmanager
def _upload(path: Path):
    @contextmanager
    def process(_hass, _file_id):
        yield path

    with patch("custom_components.lil_wet_guys.config_flow.process_uploaded_file", process):
        yield


async def _import(hass: HomeAssistant, entry, path: Path, existing: str = "skip") -> dict[str, Any]:
    result = await hass.config_entries.options.async_init(entry.entry_id)
    result = await hass.config_entries.options.async_configure(result["flow_id"], {"next_step_id": "import_plants"})
    assert result["step_id"] == "import_plants"
    with _upload(path):
        result = await hass.config_entries.options.async_configure(
            result["flow_id"], {"file": "0123456789abcdef0123456789abcdef", "existing": existing}
        )
    await hass.async_block_till_done()
    return result


async def test_export_and_import_round_trip(hass: HomeAssistant, hass_storage: dict[str, Any]) -> None:
    """Everything about a plant survives export, removal and import."""
    watered = watered_ago(hass_storage, 3)
    entry = await setup_entry(hass, make_entry(_two_plants(hass)))
    await hass.services.async_call(
        "text", "set_value", {ATTR_ENTITY_ID: "text.pothos_notes", "value": "Repotted in May"}, blocking=True
    )

    result = await _export(hass, entry)
    assert result["description_placeholders"]["count"] == "2"
    assert "authSig=" in result["description_placeholders"]["url"]
    files = list(Path(hass.config.path(EXPORT_DIR)).glob("lil-wet-guys-*.zip"))
    assert len(files) == 1
    with zipfile.ZipFile(files[0]) as zf:
        manifest = json.loads(zf.read("plants.json"))
        assert f"photos/{PLANT_ID}.jpg" in zf.namelist()
    assert manifest["format"] == "lil_wet_guys.export"
    assert {p["name"] for p in manifest["plants"]} == {"Pothos", "Monstera"}

    # Importing over the same plants skips them by name.
    result = await _import(hass, entry, files[0])
    assert result["reason"] == "import_done"
    assert result["description_placeholders"] == {"added": "0", "skipped": "2"}

    # Remove both plants, then bring them back from the file.
    for subentry_id in list(entry.subentries):
        hass.config_entries.async_remove_subentry(entry, subentry_id)
    await hass.async_block_till_done()
    assert not entry.subentries

    result = await _import(hass, entry, files[0])
    assert result["description_placeholders"] == {"added": "2", "skipped": "0"}
    assert entry.state is ConfigEntryState.LOADED
    pothos = next(s for s in entry.subentries.values() if s.title == "Pothos")
    assert pothos.subentry_id != PLANT_ID  # a fresh plant, not a resurrected id
    assert pothos.data["temperature_sensor"] == "sensor.room"
    photo = Path(hass.config.path(PHOTO_DIR)) / pothos.data["photo_file"]
    assert photo.read_bytes() == b"\xff\xd8 fake jpeg \xff\xd9"

    status = [s for s in hass.states.async_all("sensor") if s.attributes.get("lil_wet_guys")]
    assert len(status) == 2
    notes = [s.state for s in hass.states.async_all("text")]
    assert "Repotted in May" in notes
    restored = dt_util.parse_datetime(hass_storage[DOMAIN]["data"][pothos.subentry_id]["last_watered"])
    assert abs(restored - watered) < timedelta(seconds=1)


async def test_import_can_add_duplicates(hass: HomeAssistant, hass_storage: dict[str, Any]) -> None:
    """Choosing "add them anyway" imports plants whose names already exist."""
    watered_ago(hass_storage, 1)
    entry = await setup_entry(hass, make_entry())
    await _export(hass, entry)
    export = next(Path(hass.config.path(EXPORT_DIR)).glob("*.zip"))
    result = await _import(hass, entry, export, existing="add")
    assert result["description_placeholders"] == {"added": "1", "skipped": "0"}
    assert [s.title for s in entry.subentries.values()] == ["Pothos", "Pothos"]


async def test_import_rejects_other_files(hass: HomeAssistant, tmp_path: Path) -> None:
    """A file that isn't an export is refused with a message."""
    entry = await setup_entry(hass, make_entry({}))
    junk = tmp_path / "notes.json"
    junk.write_text('{"hello": "world"}')
    result = await _import(hass, entry, junk)
    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"file": "bad_export"}


async def test_import_skips_broken_plants(hass: HomeAssistant, tmp_path: Path) -> None:
    """Plants with unusable settings are skipped; the rest come in."""
    entry = await setup_entry(hass, make_entry({}))
    good = {"name": "Fern", "settings": plant_data(species="asparagus_fern"), "last_watered": None, "notes": ""}
    bad = {"name": "Broken", "settings": {"light": "disco"}}
    export = tmp_path / "plants.json"
    export.write_text(json.dumps({"format": "lil_wet_guys.export", "version": 1, "plants": [good, bad]}))
    result = await _import(hass, entry, export)
    assert result["description_placeholders"] == {"added": "1", "skipped": "1"}
    assert [s.title for s in entry.subentries.values()] == ["Fern"]


async def test_download_link(
    hass: HomeAssistant, hass_storage: dict[str, Any], hass_client_no_auth, hass_access_token: str
) -> None:
    """A signed link downloads the export; anything else is refused."""
    watered_ago(hass_storage, 1)
    entry = await setup_entry(hass, make_entry())
    await _export(hass, entry)
    name = next(Path(hass.config.path(EXPORT_DIR)).glob("*.zip")).name
    refresh = hass.auth.async_validate_access_token(hass_access_token)
    client = await hass_client_no_auth()

    signed = async_sign_path(hass, f"/api/lil_wet_guys/export/{name}", timedelta(minutes=5), refresh_token_id=refresh.id)
    response = await client.get(signed)
    assert response.status == 200
    assert response.headers["Content-Disposition"] == f'attachment; filename="{name}"'
    assert zipfile.is_zipfile(io.BytesIO(await response.read()))

    assert (await client.get(f"/api/lil_wet_guys/export/{name}")).status == 401
    bogus = async_sign_path(hass, "/api/lil_wet_guys/export/..%2Fsecrets.yaml", timedelta(minutes=5), refresh_token_id=refresh.id)
    assert (await client.get(bogus)).status == 404


async def test_newer_entry_is_refused(hass: HomeAssistant) -> None:
    """An entry saved by a future release isn't loaded (and so isn't damaged)."""
    entry = MockConfigEntry(domain=DOMAIN, title="Lil Wet Guys", data={}, version=2)
    entry.add_to_hass(hass)
    assert not await hass.config_entries.async_setup(entry.entry_id)
    assert entry.state is ConfigEntryState.MIGRATION_ERROR


def test_every_preset_has_a_drawing() -> None:
    """species.py and the card's species.js list the same plants."""
    drawings = set(re.findall(r"^  ([a-z_]+): \{", ART_SPECIES.read_text(), re.M))
    assert set(SPECIES) <= drawings
    assert {d for d in drawings if not d.startswith("generic_")} == set(SPECIES)
