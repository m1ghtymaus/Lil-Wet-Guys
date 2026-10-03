"""The Lil Wet Guys plant tracker integration.

One config entry holds every plant as a config subentry. Each plant becomes a
device with a next-watering countdown, a status, a "Watered" button, an
editable last-watered time and light level, notes and, when configured, a
photo and a temperature warning. The integration also serves the dashboard card.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType
from homeassistant.loader import async_get_integration

from .backup import ExportDownloadView
from .const import CARD_FILE, DOMAIN, SUBENTRY_PLANT, URL_BASE
from .plant import Plant, PlantStore, remove_orphan_photos

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = [
    Platform.BINARY_SENSOR,
    Platform.BUTTON,
    Platform.DATETIME,
    Platform.IMAGE,
    Platform.SELECT,
    Platform.SENSOR,
    Platform.TEXT,
]

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


@dataclass
class LilWetGuysData:
    """Runtime data: the store and every plant, keyed by subentry id."""

    store: PlantStore
    plants: dict[str, Plant]
    importing: bool = False  # an import adds many plants, then reloads once

    def matches(self, entry: ConfigEntry) -> bool:
        """Whether the running plants are exactly the entry's plant subentries."""
        subentries = {sid: sub for sid, sub in entry.subentries.items() if sub.subentry_type == SUBENTRY_PLANT}
        return subentries.keys() == self.plants.keys() and all(
            sub.title == self.plants[sid].name and sub.data == self.plants[sid].config
            for sid, sub in subentries.items()
        )


type LilWetGuysConfigEntry = ConfigEntry[LilWetGuysData]


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Serve the dashboard card and load it on every dashboard."""
    frontend_dir = Path(__file__).parent / "frontend"
    await hass.http.async_register_static_paths(
        [StaticPathConfig(URL_BASE, str(frontend_dir), cache_headers=False)]
    )
    hass.http.register_view(ExportDownloadView)
    if "frontend" in hass.config.components:
        from homeassistant.components.frontend import add_extra_js_url  # noqa: PLC0415

        integration = await async_get_integration(hass, DOMAIN)
        add_extra_js_url(hass, f"{URL_BASE}/{CARD_FILE}?v={integration.version}")
    return True


async def async_setup_entry(hass: HomeAssistant, entry: LilWetGuysConfigEntry) -> bool:
    """Set up every plant in the entry."""
    store = PlantStore(hass)
    await store.async_load()
    plants = {
        subentry_id: Plant(hass, entry, subentry, store)
        for subentry_id, subentry in entry.subentries.items()
        if subentry.subentry_type == SUBENTRY_PLANT
    }
    store.prune(set(plants))
    await hass.async_add_executor_job(
        remove_orphan_photos, hass, {p.photo_file for p in plants.values() if p.photo_file}
    )
    for plant in plants.values():
        await plant.async_start()
    entry.runtime_data = LilWetGuysData(store, plants)

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    # The status sensor lists its sibling entities; they all exist now.
    for plant in plants.values():
        plant.async_refresh()
    # Adding, editing or removing a plant changes the entry's subentries.
    entry.async_on_unload(entry.add_update_listener(_async_reload))
    return True


async def async_unload_entry(hass: HomeAssistant, entry: LilWetGuysConfigEntry) -> bool:
    """Unload the entry and stop every plant."""
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded:
        for plant in entry.runtime_data.plants.values():
            plant.async_stop()
        await entry.runtime_data.store.async_flush()
    return unloaded


async def _async_reload(hass: HomeAssistant, entry: LilWetGuysConfigEntry) -> None:
    data = entry.runtime_data
    if data.importing or data.matches(entry):
        return  # nothing to pick up, e.g. a plant's light was changed in place
    await hass.config_entries.async_reload(entry.entry_id)


async def async_migrate_entry(hass: HomeAssistant, entry: LilWetGuysConfigEntry) -> bool:
    """Upgrade an entry saved by an older version.

    Nothing has changed shape yet (version 1.1). When a release changes the
    subentry data, bump VERSION/MINOR_VERSION in config_flow.py and convert the
    old data here, so existing plants survive the update.
    """
    if entry.version > 1:
        # Saved by a newer release; refusing beats corrupting it.
        _LOGGER.error("This Lil Wet Guys entry was saved by a newer version; update the integration")
        return False
    return True
