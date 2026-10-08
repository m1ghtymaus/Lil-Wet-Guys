"""How full each plant is drawn, changeable from its device page."""

from __future__ import annotations

from homeassistant.components.number import NumberEntity, NumberMode
from homeassistant.const import PERCENTAGE, EntityCategory
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import LilWetGuysConfigEntry
from .entity import PlantEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: LilWetGuysConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Add a fullness slider for every plant."""
    for plant in entry.runtime_data.plants.values():
        async_add_entities([PlantFullness(plant, "fullness")], config_subentry_id=plant.id)


class PlantFullness(PlantEntity, NumberEntity):
    """How many leaves the plant's drawing has: 0% a single leaf, 100% as usual, 200% overgrown."""

    _attr_entity_category = EntityCategory.CONFIG
    _attr_mode = NumberMode.SLIDER
    _attr_native_min_value = 0
    _attr_native_max_value = 200
    _attr_native_step = 10
    _attr_native_unit_of_measurement = PERCENTAGE

    @property
    def native_value(self) -> int:
        """The plant's fullness."""
        return self.plant.fullness

    async def async_set_native_value(self, value: float) -> None:
        """Make the plant fuller or sparser."""
        self.plant.async_set_fullness(round(value))
