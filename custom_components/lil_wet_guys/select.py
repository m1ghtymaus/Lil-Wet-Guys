"""The light each plant lives in, changeable from the dashboard card."""

from __future__ import annotations

from homeassistant.components.select import SelectEntity
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import LilWetGuysConfigEntry
from .const import LIGHT_LEVELS
from .entity import PlantEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: LilWetGuysConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Add a light setting for every plant."""
    for plant in entry.runtime_data.plants.values():
        async_add_entities([PlantLight(plant, "light")], config_subentry_id=plant.id)


class PlantLight(PlantEntity, SelectEntity):
    """How much light the plant gets, which sets how often it needs water."""

    _attr_entity_category = EntityCategory.CONFIG
    _attr_options = LIGHT_LEVELS

    @property
    def current_option(self) -> str:
        """The plant's light level."""
        return self.plant.light

    async def async_select_option(self, option: str) -> None:
        """Move the plant to another light level."""
        self.plant.async_set_light(option)
