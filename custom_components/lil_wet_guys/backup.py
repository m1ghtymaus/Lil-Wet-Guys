"""Export every plant to a file, and import plants from one.

An export is a .zip holding plants.json (settings, last-watered time and notes
for each plant) and the plants' photos. It is portable between Home Assistant
instances: temperatures are stored in °C and the plant ids in the file are only
used to match photos, so importing always creates fresh plants.
"""

from __future__ import annotations

import json
import re
import uuid
import zipfile
from dataclasses import dataclass, field
from datetime import datetime
from http import HTTPStatus
from pathlib import Path
from types import MappingProxyType
from typing import TYPE_CHECKING, Any

from aiohttp import web

from homeassistant.components.http import KEY_HASS_USER, HomeAssistantView
from homeassistant.config_entries import ConfigSubentry
from homeassistant.core import HomeAssistant
from homeassistant.loader import async_get_integration
from homeassistant.util import dt as dt_util

from .const import (
    CONF_BASE_DAYS,
    CONF_LAST_WATERED,
    CONF_LIGHT,
    CONF_PHOTO_FILE,
    CONF_POT_COLOR,
    CONF_SPECIES,
    CONF_TEMP_MAX,
    CONF_TEMP_MIN,
    DOMAIN,
    LIGHT_LEVELS,
    PHOTO_DIR,
    SPECIES_OTHER,
    SUBENTRY_PLANT,
)
from .plant import photo_path

if TYPE_CHECKING:
    from . import LilWetGuysConfigEntry

EXPORT_FORMAT = "lil_wet_guys.export"
EXPORT_VERSION = 1
EXPORT_DIR = "lil_wet_guys/exports"  # relative to the config directory
EXPORTS_KEPT = 5
EXPORT_URL = "/api/lil_wet_guys/export/{filename}"
EXPORT_NAME = re.compile(r"lil-wet-guys-\d{8}-\d{6}\.zip")
PLANTS_FILE = "plants.json"


class InvalidExport(ValueError):
    """The file isn't a Lil Wet Guys export this version understands."""


@dataclass
class Bundle:
    """Plants read from an export file."""

    plants: list[dict[str, Any]]
    photos: dict[str, bytes] = field(default_factory=dict)


# ----------------------------------------------------------------------- export


def _plant_record(entry: LilWetGuysConfigEntry, plant_id: str) -> dict[str, Any]:
    plant = entry.runtime_data.plants[plant_id]
    settings = {k: v for k, v in plant.config.items() if k not in (CONF_PHOTO_FILE, CONF_LAST_WATERED)}
    return {
        "id": plant_id,
        "name": plant.name,
        "settings": settings,
        "last_watered": plant.last_watered.isoformat(),
        "notes": plant.notes,
        "photo": f"photos/{plant_id}.jpg" if plant.photo_file else None,
    }


def _write_export(hass: HomeAssistant, manifest: dict[str, Any], photos: dict[str, Path]) -> str:
    """Write the zip and prune old exports; returns the file name (runs in the executor)."""
    folder = Path(hass.config.path(EXPORT_DIR))
    folder.mkdir(parents=True, exist_ok=True)
    name = f"lil-wet-guys-{dt_util.now().strftime('%Y%m%d-%H%M%S')}.zip"
    for plant in manifest["plants"]:
        if plant["photo"] and not photos[plant["id"]].is_file():
            plant["photo"] = None  # the photo file has gone missing
    with zipfile.ZipFile(folder / name, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(PLANTS_FILE, json.dumps(manifest, indent=2, ensure_ascii=False))
        for plant in manifest["plants"]:
            if plant["photo"]:
                zf.write(photos[plant["id"]], plant["photo"])
    for old in sorted(folder.glob("lil-wet-guys-*.zip"))[:-EXPORTS_KEPT]:
        old.unlink(missing_ok=True)
    return name


async def async_create_export(hass: HomeAssistant, entry: LilWetGuysConfigEntry) -> tuple[str, int]:
    """Export every plant; returns (file name, number of plants)."""
    integration = await async_get_integration(hass, DOMAIN)
    plants = entry.runtime_data.plants
    manifest = {
        "format": EXPORT_FORMAT,
        "version": EXPORT_VERSION,
        "exported_at": dt_util.utcnow().isoformat(),
        "integration_version": str(integration.version),
        "plants": [_plant_record(entry, plant_id) for plant_id in plants],
    }
    photos = {pid: photo_path(hass, p.photo_file) for pid, p in plants.items() if p.photo_file}
    name = await hass.async_add_executor_job(_write_export, hass, manifest, photos)
    return name, len(manifest["plants"])


class ExportDownloadView(HomeAssistantView):
    """Serve an export to an administrator (via a signed link)."""

    url = EXPORT_URL
    name = "api:lil_wet_guys:export"
    requires_auth = True

    async def get(self, request: web.Request, filename: str) -> web.StreamResponse:
        """Return the export as a download."""
        if not request[KEY_HASS_USER].is_admin:
            return web.Response(status=HTTPStatus.UNAUTHORIZED)
        hass: HomeAssistant = request.app["hass"]
        path = Path(hass.config.path(EXPORT_DIR)) / filename
        if not EXPORT_NAME.fullmatch(filename) or not await hass.async_add_executor_job(path.is_file):
            return web.Response(status=HTTPStatus.NOT_FOUND)
        return web.FileResponse(path, headers={"Content-Disposition": f'attachment; filename="{filename}"'})


# ----------------------------------------------------------------------- import


def read_bundle(path: Path) -> Bundle:
    """Read an export (.zip with photos, or plain plants.json); runs in the executor."""
    photos: dict[str, bytes] = {}
    try:
        if zipfile.is_zipfile(path):
            with zipfile.ZipFile(path) as zf:
                manifest = json.loads(zf.read(PLANTS_FILE))
                for name in zf.namelist():
                    if name.startswith("photos/") and name.endswith(".jpg"):
                        photos[name] = zf.read(name)
        else:
            manifest = json.loads(path.read_text(encoding="utf-8"))
    except (KeyError, OSError, UnicodeDecodeError, ValueError, zipfile.BadZipFile) as err:
        raise InvalidExport(str(err)) from err
    if not isinstance(manifest, dict) or manifest.get("format") != EXPORT_FORMAT:
        raise InvalidExport("not a Lil Wet Guys export")
    if not isinstance(manifest.get("version"), int) or manifest["version"] > EXPORT_VERSION:
        raise InvalidExport("made by a newer version of Lil Wet Guys")
    plants = manifest.get("plants")
    if not isinstance(plants, list):
        raise InvalidExport("no plants in the file")
    return Bundle(plants=plants, photos=photos)


def _valid_settings(settings: Any) -> dict[str, Any] | None:
    """Return importable settings, or None if they're unusable."""
    if not isinstance(settings, dict):
        return None
    try:
        light = settings[CONF_LIGHT]
        base_days = float(settings[CONF_BASE_DAYS])
        temp_min = float(settings[CONF_TEMP_MIN])
        temp_max = float(settings[CONF_TEMP_MAX])
        pot = [int(c) for c in settings[CONF_POT_COLOR]]
    except (KeyError, TypeError, ValueError):
        return None
    if light not in LIGHT_LEVELS or not 1 <= base_days <= 90 or temp_min >= temp_max or len(pot) != 3:
        return None
    clean = dict(settings)
    clean.pop(CONF_PHOTO_FILE, None)
    clean.setdefault(CONF_SPECIES, SPECIES_OTHER)
    clean.update({CONF_BASE_DAYS: base_days, CONF_TEMP_MIN: temp_min, CONF_TEMP_MAX: temp_max, CONF_POT_COLOR: pot})
    return clean


def _save_photo_bytes(hass: HomeAssistant, data: bytes) -> str:
    folder = Path(hass.config.path(PHOTO_DIR))
    folder.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4().hex}.jpg"
    (folder / name).write_bytes(data)
    return name


def _parse_time(value: Any) -> datetime | None:
    when = dt_util.parse_datetime(value) if isinstance(value, str) else None
    return dt_util.as_utc(when) if when else None


async def async_import_bundle(
    hass: HomeAssistant, entry: LilWetGuysConfigEntry, bundle: Bundle, *, skip_existing: bool
) -> tuple[int, int]:
    """Add the bundle's plants to the entry; returns (added, skipped)."""
    existing = {sub.title.casefold() for sub in entry.subentries.values()}
    store = entry.runtime_data.store
    prepared: list[tuple[ConfigSubentry, datetime | None, str]] = []
    skipped = 0
    for record in bundle.plants:
        name = record.get("name") if isinstance(record, dict) else None
        settings = _valid_settings(record.get("settings")) if name else None
        if not isinstance(name, str) or not name.strip() or settings is None:
            skipped += 1
            continue
        if skip_existing and name.casefold() in existing:
            skipped += 1
            continue
        last = _parse_time(record.get("last_watered"))
        if last:
            settings[CONF_LAST_WATERED] = last.isoformat()
        photo = bundle.photos.get(record.get("photo") or "")
        if photo:
            settings[CONF_PHOTO_FILE] = await hass.async_add_executor_job(_save_photo_bytes, hass, photo)
        notes = record.get("notes") if isinstance(record.get("notes"), str) else ""
        subentry = ConfigSubentry(
            data=MappingProxyType(settings), subentry_type=SUBENTRY_PLANT, title=name.strip(), unique_id=None
        )
        prepared.append((subentry, last, notes[:255]))
        existing.add(name.casefold())

    if prepared:
        # Each added plant would normally reload the entry; hold that until all are in.
        entry.runtime_data.importing = True
        for subentry, last, notes in prepared:
            if last:
                store.set_last_watered(subentry.subentry_id, last)
            if notes:
                store.set_notes(subentry.subentry_id, notes)
            hass.config_entries.async_add_subentry(entry, subentry)
        await store.async_flush()
        await hass.config_entries.async_reload(entry.entry_id)
    return len(prepared), skipped

