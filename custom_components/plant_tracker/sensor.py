"""Next-watering countdown and status sensors."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity
from homeassistant.const import MATCH_ALL, UnitOfTemperature
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.util.unit_conversion import TemperatureConverter

from . import PlantTrackerConfigEntry
from .const import DOMAIN
from .entity import PlantEntity
from .model import STATUSES


async def async_setup_entry(
    hass: HomeAssistant,
    entry: PlantTrackerConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Add the sensors for every plant."""
    for plant in entry.runtime_data.plants.values():
        async_add_entities(
            [NextWateringSensor(plant, "next_watering"), StatusSensor(plant, "status")],
            config_subentry_id=plant.id,
        )


class NextWateringSensor(PlantEntity, SensorEntity):
    """When the plant is next due; the frontend shows it as a countdown."""

    _attr_device_class = SensorDeviceClass.TIMESTAMP

    @property
    def native_value(self) -> datetime:
        """The next watering time."""
        return self.plant.next_watering


class StatusSensor(PlantEntity, SensorEntity):
    """happy / thirsty / wilting / ghost, with everything the card needs."""

    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = STATUSES
    # The attributes describe the plant rather than history worth keeping.
    _unrecorded_attributes = frozenset({MATCH_ALL})

    @property
    def native_value(self) -> str:
        """The plant's mood."""
        return self.plant.status

    def _sibling(self, domain: str, key: str) -> str | None:
        return er.async_get(self.hass).async_get_entity_id(domain, DOMAIN, f"{self.plant.id}_{key}")

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Care details and the ids of the plant's other entities."""
        plant = self.plant
        unit = self.hass.config.units.temperature_unit

        def temp(value_c: float | None) -> float | None:
            if value_c is None:
                return None
            return round(TemperatureConverter.convert(value_c, UnitOfTemperature.CELSIUS, unit), 1)

        attrs: dict[str, Any] = {
            "plant_tracker": True,
            "species": plant.species_id,
            "species_name": plant.species.name if plant.species_id != "other" else None,
            "shape": plant.shape,
            "pot_color": plant.pot_color,
            "light": plant.light,
            "base_days": plant.base_days,
            "interval_days": plant.interval_days,
            "last_watered": plant.last_watered.isoformat(),
            "next_watering": plant.next_watering.isoformat(),
            "days_overdue": round(plant.days_overdue, 2),
            "care_note": plant.species.note or None,
            "temperature_min": temp(plant.temp_min_c),
            "temperature_max": temp(plant.temp_max_c),
            "temperature_unit": unit,
            "button_entity": self._sibling("button", "watered"),
            "last_watered_entity": self._sibling("datetime", "last_watered"),
        }
        if plant.photo_file:
            attrs["photo_entity"] = self._sibling("image", "photo")
        if plant.temperature_sensor:
            attrs["temperature"] = temp(plant.temperature_c)
            attrs["temperature_problem"] = plant.temperature_problem
            attrs["temperature_entity"] = self._sibling("binary_sensor", "temperature")
        if plant.moisture_sensor:
            attrs["moisture"] = plant.moisture
        return attrs
