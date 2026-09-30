"""The "Watered" button."""

from __future__ import annotations

from homeassistant.components.button import ButtonEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.util import dt as dt_util

from . import LilWetGuysConfigEntry
from .entity import PlantEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: LilWetGuysConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Add a Watered button for every plant."""
    for plant in entry.runtime_data.plants.values():
        async_add_entities([WateredButton(plant, "watered")], config_subentry_id=plant.id)


class WateredButton(PlantEntity, ButtonEntity):
    """Press after watering the plant; the countdown starts again."""

    async def async_press(self) -> None:
        """Record a watering now."""
        self.plant.async_set_last_watered(dt_util.utcnow())
