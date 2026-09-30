"""Warning when the room is too cold or too hot for the plant."""

from __future__ import annotations

from typing import Any

from homeassistant.components.binary_sensor import BinarySensorDeviceClass, BinarySensorEntity
from homeassistant.const import UnitOfTemperature
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.util.unit_conversion import TemperatureConverter

from . import PlantTrackerConfigEntry
from .entity import PlantEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: PlantTrackerConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Add a temperature warning for every plant with a room sensor."""
    for plant in entry.runtime_data.plants.values():
        if plant.temperature_sensor:
            async_add_entities([TemperatureProblem(plant, "temperature")], config_subentry_id=plant.id)


class TemperatureProblem(PlantEntity, BinarySensorEntity):
    """On when the room temperature is outside the plant's range."""

    _attr_device_class = BinarySensorDeviceClass.PROBLEM

    @property
    def is_on(self) -> bool | None:
        """True when too cold or too hot; unknown without a reading."""
        if self.plant.temperature_c is None:
            return None
        return self.plant.temperature_problem is not None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """The reading, the range and which way it is off."""
        unit = self.hass.config.units.temperature_unit

        def temp(value_c: float | None) -> float | None:
            if value_c is None:
                return None
            return round(TemperatureConverter.convert(value_c, UnitOfTemperature.CELSIUS, unit), 1)

        return {
            "problem": self.plant.temperature_problem,
            "temperature": temp(self.plant.temperature_c),
            "minimum": temp(self.plant.temp_min_c),
            "maximum": temp(self.plant.temp_max_c),
            "sensor": self.plant.temperature_sensor,
        }
