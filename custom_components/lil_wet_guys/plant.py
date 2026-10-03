"""A tracked plant: its settings, when it was watered, and what it is up to."""

from __future__ import annotations

import logging
from collections.abc import Callable, Mapping
from datetime import datetime
from pathlib import Path
from types import MappingProxyType
from typing import Any

from homeassistant.config_entries import ConfigEntry, ConfigSubentry
from homeassistant.const import (
    ATTR_UNIT_OF_MEASUREMENT,
    STATE_UNAVAILABLE,
    STATE_UNKNOWN,
    UnitOfTemperature,
)
from homeassistant.core import (
    CALLBACK_TYPE,
    Event,
    EventStateChangedData,
    HomeAssistant,
    State,
    callback,
)
from homeassistant.helpers.event import (
    async_track_point_in_utc_time,
    async_track_state_change_event,
)
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util
from homeassistant.util.unit_conversion import TemperatureConverter

from . import model
from .const import (
    CONF_BASE_DAYS,
    CONF_LAST_WATERED,
    CONF_LIGHT,
    CONF_MOISTURE_JUMP,
    CONF_MOISTURE_SENSOR,
    CONF_PHOTO_FILE,
    CONF_POT_COLOR,
    CONF_SHAPE,
    CONF_SPECIES,
    CONF_TEMP_MAX,
    CONF_TEMP_MIN,
    CONF_TEMP_SENSOR,
    CONF_TEMPERATURE_UNIT,
    DEFAULT_MOISTURE_JUMP,
    DEFAULT_POT_COLOR,
    LIGHT_LEVELS,
    PHOTO_DIR,
    SPECIES_OTHER,
    STORAGE_KEY,
    STORAGE_VERSION,
)
from .species import OTHER, SPECIES, Species

_LOGGER = logging.getLogger(__name__)


class _VersionedStore(Store[dict[str, dict[str, str]]]):
    """The on-disk store, with a place to upgrade data saved by older versions."""

    async def _async_migrate_func(self, old_major_version: int, old_minor_version: int, old_data: dict) -> dict:
        # Nothing to convert yet. When a release changes the stored shape, bump
        # STORAGE_VERSION and translate old_data here so nothing is lost.
        return old_data


class PlantStore:
    """When each plant was last watered, and its notes, keyed by subentry id."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Create the store; call async_load before use."""
        self._store = _VersionedStore(hass, STORAGE_VERSION, STORAGE_KEY)
        self._data: dict[str, dict[str, str]] = {}

    async def async_load(self) -> None:
        """Read the saved data."""
        self._data = await self._store.async_load() or {}

    def last_watered(self, plant_id: str) -> datetime | None:
        """Return the saved last-watered time, if any."""
        raw = self._data.get(plant_id, {}).get("last_watered")
        return dt_util.parse_datetime(raw) if raw else None

    @callback
    def set_last_watered(self, plant_id: str, when: datetime) -> None:
        """Save a new last-watered time."""
        self._data.setdefault(plant_id, {})["last_watered"] = dt_util.as_utc(when).isoformat()
        self._store.async_delay_save(lambda: self._data, 1)

    def notes(self, plant_id: str) -> str:
        """Return the plant's notes (empty if none)."""
        return self._data.get(plant_id, {}).get("notes", "")

    @callback
    def set_notes(self, plant_id: str, notes: str) -> None:
        """Save the plant's notes."""
        self._data.setdefault(plant_id, {})["notes"] = notes
        self._store.async_delay_save(lambda: self._data, 1)

    @callback
    def prune(self, keep: set[str]) -> None:
        """Forget plants that no longer exist."""
        stale = set(self._data) - keep
        for plant_id in stale:
            del self._data[plant_id]
        if stale:
            self._store.async_delay_save(lambda: self._data, 1)

    async def async_flush(self) -> None:
        """Write pending changes now."""
        await self._store.async_save(self._data)


def temperature_unit(hass: HomeAssistant, entry: ConfigEntry) -> str:
    """Return the unit plant temperatures are entered and shown in.

    That's the integration's Temperature unit setting, or Home Assistant's own unit
    when the setting is left on auto.
    """
    choice = entry.options.get(CONF_TEMPERATURE_UNIT)
    if choice == "celsius":
        return UnitOfTemperature.CELSIUS
    if choice == "fahrenheit":
        return UnitOfTemperature.FAHRENHEIT
    return hass.config.units.temperature_unit


def photo_path(hass: HomeAssistant, file_name: str) -> Path:
    """Where a plant photo lives on disk."""
    return Path(hass.config.path(PHOTO_DIR)) / file_name


def remove_orphan_photos(hass: HomeAssistant, keep: set[str]) -> None:
    """Delete photos no plant refers to any more (runs in the executor)."""
    folder = Path(hass.config.path(PHOTO_DIR))
    if not folder.is_dir():
        return
    for file in folder.iterdir():
        if file.is_file() and file.name not in keep:
            file.unlink(missing_ok=True)


def _number(state: State | None) -> float | None:
    if state is None or state.state in (STATE_UNKNOWN, STATE_UNAVAILABLE):
        return None
    try:
        return float(state.state)
    except ValueError:
        return None


class Plant:
    """One plant, shared by all of its entities."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry, subentry: ConfigSubentry, store: PlantStore) -> None:
        """Load the plant's settings and last-watered time."""
        self.hass = hass
        self._entry = entry
        self.id = subentry.subentry_id
        self.name = subentry.title
        self.config: Mapping[str, Any] = subentry.data
        self._store = store
        self._listeners: list[CALLBACK_TYPE] = []
        self._unsubs: list[CALLBACK_TYPE] = []
        self._unsub_timer: CALLBACK_TYPE | None = None
        self.temperature_c: float | None = None
        self.moisture: float | None = None
        self._moisture_watch = model.MoistureWatch(self.config.get(CONF_MOISTURE_JUMP, DEFAULT_MOISTURE_JUMP))

        saved = store.last_watered(self.id)
        if saved is None:
            initial = self.config.get(CONF_LAST_WATERED)
            saved = dt_util.parse_datetime(initial) if initial else None
            saved = dt_util.as_utc(saved) if saved else dt_util.utcnow()
            store.set_last_watered(self.id, saved)
        self.last_watered: datetime = saved

    # ------------------------------------------------------------ settings

    @property
    def species_id(self) -> str:
        """Preset id, or 'other'."""
        return self.config.get(CONF_SPECIES, SPECIES_OTHER)

    @property
    def species(self) -> Species:
        """Care preset (a neutral one for plants without a preset)."""
        return SPECIES.get(self.species_id, OTHER)

    @property
    def shape(self) -> str:
        """Which drawing the card uses."""
        if self.species_id in SPECIES:
            return self.species_id
        return self.config.get(CONF_SHAPE, "generic_leafy")

    @property
    def pot_color(self) -> str:
        """Pot colour as #rrggbb."""
        r, g, b = self.config.get(CONF_POT_COLOR, DEFAULT_POT_COLOR)
        return f"#{int(r):02x}{int(g):02x}{int(b):02x}"

    @property
    def light(self) -> str:
        """Light level where the plant lives."""
        return self.config.get(CONF_LIGHT, self.species.light)

    @property
    def base_days(self) -> float:
        """Watering interval in bright, indirect light."""
        return float(self.config.get(CONF_BASE_DAYS, self.species.base_days))

    @property
    def temp_min_c(self) -> float:
        """Lowest comfortable temperature, °C."""
        return float(self.config[CONF_TEMP_MIN])

    @property
    def temp_max_c(self) -> float:
        """Highest comfortable temperature, °C."""
        return float(self.config[CONF_TEMP_MAX])

    @property
    def temperature_unit(self) -> str:
        """The unit to show this plant's temperatures in."""
        return temperature_unit(self.hass, self._entry)

    @property
    def photo_file(self) -> str | None:
        """Stored photo file name, if the plant has a photo."""
        return self.config.get(CONF_PHOTO_FILE)

    @property
    def temperature_sensor(self) -> str | None:
        """Room temperature sensor entity id."""
        return self.config.get(CONF_TEMP_SENSOR)

    @property
    def moisture_sensor(self) -> str | None:
        """Soil moisture sensor entity id."""
        return self.config.get(CONF_MOISTURE_SENSOR)

    # ------------------------------------------------------------- derived

    @property
    def interval_days(self) -> float:
        """Days between waterings in this plant's light."""
        return model.interval_days(self.base_days, self.light)

    @property
    def next_watering(self) -> datetime:
        """When the plant is next due."""
        return model.next_watering(self.last_watered, self.interval_days)

    @property
    def days_overdue(self) -> float:
        """Days past the watering date (negative before it)."""
        return model.days_overdue(dt_util.utcnow(), self.next_watering)

    @property
    def status(self) -> str:
        """happy, thirsty, wilting or ghost."""
        return model.status_for(self.days_overdue)

    @property
    def temperature_problem(self) -> str | None:
        """'cold' or 'hot' when the room is outside the plant's range."""
        return model.temperature_problem(self.temperature_c, self.temp_min_c, self.temp_max_c)

    # ----------------------------------------------------------- lifecycle

    async def async_start(self) -> None:
        """Schedule status changes and follow the linked sensors."""
        self._schedule()
        if self.temperature_sensor:
            self._read_temperature(self.hass.states.get(self.temperature_sensor))
            self._unsubs.append(
                async_track_state_change_event(self.hass, [self.temperature_sensor], self._on_temperature)
            )
        if self.moisture_sensor:
            self.moisture = _number(self.hass.states.get(self.moisture_sensor))
            if self.moisture is not None:
                # The current reading is the baseline the next rise is measured from.
                self._moisture_watch.add(dt_util.utcnow(), self.moisture)
            self._unsubs.append(
                async_track_state_change_event(self.hass, [self.moisture_sensor], self._on_moisture)
            )

    @callback
    def async_stop(self) -> None:
        """Stop timers and sensor tracking."""
        if self._unsub_timer:
            self._unsub_timer()
            self._unsub_timer = None
        while self._unsubs:
            self._unsubs.pop()()

    @callback
    def async_add_listener(self, listener: CALLBACK_TYPE) -> Callable[[], None]:
        """Call `listener` whenever anything about the plant changes."""
        self._listeners.append(listener)
        return lambda: self._listeners.remove(listener)

    @callback
    def async_refresh(self) -> None:
        """Ask every entity of the plant to write its state again."""
        self._notify()

    @callback
    def _notify(self) -> None:
        for listener in list(self._listeners):
            listener()

    @callback
    def async_set_last_watered(self, when: datetime) -> None:
        """Record a watering (or correct when the last one was)."""
        self.last_watered = dt_util.as_utc(when)
        self._store.set_last_watered(self.id, self.last_watered)
        self._schedule()
        self._notify()

    @callback
    def async_set_light(self, light: str) -> None:
        """Move the plant to another light level; its watering interval follows.

        The change is saved to the plant's settings without reloading the
        integration: the settings this plant runs with already match, so the
        update listener has nothing to do.
        """
        if light not in LIGHT_LEVELS:
            raise ValueError(f"Unknown light level: {light}")
        if light == self.light:
            return
        self.config = MappingProxyType({**self.config, CONF_LIGHT: light})
        self.hass.config_entries.async_update_subentry(
            self._entry, self._entry.subentries[self.id], data=dict(self.config)
        )
        self._schedule()
        self._notify()

    @property
    def notes(self) -> str:
        """Free-text notes about the plant."""
        return self._store.notes(self.id)

    @callback
    def async_set_notes(self, notes: str) -> None:
        """Replace the plant's notes."""
        self._store.set_notes(self.id, notes)
        self._notify()

    @callback
    def _schedule(self) -> None:
        if self._unsub_timer:
            self._unsub_timer()
            self._unsub_timer = None
        moment = model.next_change(dt_util.utcnow(), self.next_watering)
        if moment is not None:
            self._unsub_timer = async_track_point_in_utc_time(self.hass, self._on_status_change, moment)

    @callback
    def _on_status_change(self, _now: datetime) -> None:
        self._unsub_timer = None
        self._schedule()
        self._notify()

    # ------------------------------------------------------------- sensors

    @callback
    def _read_temperature(self, state: State | None) -> None:
        value = _number(state)
        if value is not None:
            unit = state.attributes.get(ATTR_UNIT_OF_MEASUREMENT, UnitOfTemperature.CELSIUS)
            try:
                value = TemperatureConverter.convert(value, unit, UnitOfTemperature.CELSIUS)
            except Exception:  # noqa: BLE001 - an odd unit just means we can't use it
                _LOGGER.debug("Ignoring %s: unexpected unit %s", self.temperature_sensor, unit)
                value = None
        self.temperature_c = value

    @callback
    def _on_temperature(self, event: Event[EventStateChangedData]) -> None:
        self._read_temperature(event.data["new_state"])
        self._notify()

    @callback
    def _on_moisture(self, event: Event[EventStateChangedData]) -> None:
        self.moisture = _number(event.data["new_state"])
        if self.moisture is not None and self._moisture_watch.add(dt_util.utcnow(), self.moisture):
            _LOGGER.debug("%s: soil moisture jumped to %s%%, counting it as watered", self.name, self.moisture)
            self.async_set_last_watered(dt_util.utcnow())
            return
        self._notify()
