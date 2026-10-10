"""Base entity: one device per plant, refreshed whenever the plant changes."""

from __future__ import annotations

from homeassistant.core import callback
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity import Entity

from .const import DOMAIN, MANUFACTURER
from .plant import Plant


class PlantEntity(Entity):
    """An entity belonging to one plant."""

    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(self, plant: Plant, key: str) -> None:
        """Attach the entity to its plant's device."""
        self.plant = plant
        self._attr_translation_key = key
        self._attr_unique_id = f"{plant.id}_{key}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, plant.id)},
            name=plant.name,
            manufacturer=MANUFACTURER,
            model=plant.model,
        )

    async def async_added_to_hass(self) -> None:
        """Follow the plant."""
        await super().async_added_to_hass()
        self.async_on_remove(self.plant.async_add_listener(self._handle_plant_update))

    @callback
    def _handle_plant_update(self) -> None:
        self.async_write_ha_state()
