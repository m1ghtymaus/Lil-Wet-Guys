"""Free-text notes for each plant, editable from the dashboard card."""

from __future__ import annotations

from homeassistant.components.text import TextEntity, TextMode
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import LilWetGuysConfigEntry
from .entity import PlantEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: LilWetGuysConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Add a notes entity for every plant."""
    for plant in entry.runtime_data.plants.values():
        async_add_entities([PlantNotes(plant, "notes")], config_subentry_id=plant.id)


class PlantNotes(PlantEntity, TextEntity):
    """Anything worth remembering about the plant."""

    _attr_mode = TextMode.TEXT
    _attr_native_min = 0
    _attr_native_max = 255  # the longest state Home Assistant allows

    @property
    def native_value(self) -> str:
        """The notes."""
        return self.plant.notes

    async def async_set_value(self, value: str) -> None:
        """Replace the notes."""
        self.plant.async_set_notes(value)
