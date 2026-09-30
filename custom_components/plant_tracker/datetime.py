"""Editable last-watered time, for "I actually watered it yesterday"."""

from __future__ import annotations

from datetime import datetime

from homeassistant.components.datetime import DateTimeEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import PlantTrackerConfigEntry
from .entity import PlantEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: PlantTrackerConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Add a last-watered entity for every plant."""
    for plant in entry.runtime_data.plants.values():
        async_add_entities([LastWatered(plant, "last_watered")], config_subentry_id=plant.id)


class LastWatered(PlantEntity, DateTimeEntity):
    """When the plant was last watered."""

    @property
    def native_value(self) -> datetime:
        """The last watering."""
        return self.plant.last_watered

    async def async_set_value(self, value: datetime) -> None:
        """Change when the plant was last watered."""
        self.plant.async_set_last_watered(value)
