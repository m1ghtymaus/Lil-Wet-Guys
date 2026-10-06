"""The light each plant lives in, and where it is in the fertilizer cycle."""

from __future__ import annotations

from homeassistant.components.select import SelectEntity
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import LilWetGuysConfigEntry
from .const import LIGHT_LEVELS
from .entity import PlantEntity
from .model import FEEDS


async def async_setup_entry(
    hass: HomeAssistant,
    entry: LilWetGuysConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Add a light setting for every plant, and a fertilizer step when that's on."""
    for plant in entry.runtime_data.plants.values():
        entities: list[SelectEntity] = [PlantLight(plant, "light")]
        if plant.feeding:
            entities.append(FertilizerStep(plant, "fertilizer"))
        async_add_entities(entities, config_subentry_id=plant.id)


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


FEED_STEPS = [f"feed_{n}" for n in range(1, FEEDS + 1)] + ["plain_water"]


class FertilizerStep(PlantEntity, SelectEntity):
    """What the next watering should be: fertilizer (1 or 2 of 2) or plain water.

    It moves on by itself with each watering; change it if you've got out of step.
    """

    _attr_entity_category = EntityCategory.CONFIG
    _attr_options = FEED_STEPS

    @property
    def current_option(self) -> str:
        """The next watering."""
        return FEED_STEPS[self.plant.feed_step - 1]

    async def async_select_option(self, option: str) -> None:
        """Say what the next watering should be."""
        self.plant.async_set_feed_step(FEED_STEPS.index(option) + 1)
