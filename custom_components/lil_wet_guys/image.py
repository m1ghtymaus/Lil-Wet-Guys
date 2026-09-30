"""The plant's photo, served through Home Assistant's authenticated image proxy."""

from __future__ import annotations

from datetime import datetime

from homeassistant.components.image import ImageEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.util import dt as dt_util

from . import LilWetGuysConfigEntry
from .entity import PlantEntity
from .plant import Plant, photo_path


async def async_setup_entry(
    hass: HomeAssistant,
    entry: LilWetGuysConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Add a photo entity for every plant that has a photo."""
    for plant in entry.runtime_data.plants.values():
        if plant.photo_file:
            async_add_entities([PlantPhoto(hass, plant)], config_subentry_id=plant.id)


class PlantPhoto(PlantEntity, ImageEntity):
    """A photo of the plant."""

    _attr_content_type = "image/jpeg"
    _last_updated: datetime | None = None

    def __init__(self, hass: HomeAssistant, plant: Plant) -> None:
        """Point at the plant's stored photo."""
        PlantEntity.__init__(self, plant, "photo")
        ImageEntity.__init__(self, hass)

    @property
    def image_last_updated(self) -> datetime | None:
        """Changes when a new photo is uploaded (it gets a new file name)."""
        return self._last_updated

    async def async_added_to_hass(self) -> None:
        """Note when the photo file was written."""
        await super().async_added_to_hass()
        path = photo_path(self.hass, self.plant.photo_file)
        mtime = await self.hass.async_add_executor_job(lambda: path.stat().st_mtime if path.exists() else None)
        self._last_updated = dt_util.utc_from_timestamp(mtime) if mtime else None
        self.async_write_ha_state()

    async def async_image(self) -> bytes | None:
        """Return the photo."""
        path = photo_path(self.hass, self.plant.photo_file)
        return await self.hass.async_add_executor_job(lambda: path.read_bytes() if path.exists() else None)
