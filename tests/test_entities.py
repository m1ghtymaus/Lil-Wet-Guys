"""Tests for the plant entities: countdown, status, watering and sensors."""

from __future__ import annotations

from datetime import timedelta
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from pytest_homeassistant_custom_component.common import async_fire_time_changed

from custom_components.lil_wet_guys.const import DOMAIN
from homeassistant.const import (
    ATTR_ENTITY_ID,
    ATTR_UNIT_OF_MEASUREMENT,
    EntityCategory,
    UnitOfTemperature,
)
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util

from .conftest import PLANT_ID, make_entry, plant_data, setup_entry, watered_ago

STATUS = "sensor.pothos_status"
NEXT = "sensor.pothos_next_watering"
BUTTON = "button.pothos_watered"
LAST = "datetime.pothos_last_watered"
NOTES = "text.pothos_notes"
LIGHT = "select.pothos_light"
FEED = "select.pothos_next_watering"
FULLNESS = "number.pothos_fullness"
FERTILIZER = {"fertilizer": True}


async def test_entities_and_device(hass: HomeAssistant, hass_storage: dict[str, Any]) -> None:
    """Each plant is a device with its entities; optional ones are absent."""
    watered_ago(hass_storage, 2)
    entry = await setup_entry(hass, make_entry())
    for entity_id in (STATUS, NEXT, BUTTON, LAST, NOTES, LIGHT):
        assert hass.states.get(entity_id) is not None, entity_id
    assert hass.states.get("image.pothos_photo") is None
    assert hass.states.get("binary_sensor.pothos_temperature") is None

    device = dr.async_get(hass).async_get_device(identifiers={(DOMAIN, PLANT_ID)})
    assert device.name == "Pothos"
    assert device.model == "Golden Pothos (Epipremnum aureum)"
    assert device.manufacturer == "Lil Wet Guys"
    entity = er.async_get(hass).async_get(STATUS)
    assert entity.config_subentry_id == PLANT_ID
    assert entity.config_entry_id == entry.entry_id


async def test_status_and_attributes(hass: HomeAssistant, hass_storage: dict[str, Any]) -> None:
    """Two days into an eight-day interval the plant is happy."""
    watered = watered_ago(hass_storage, 2)
    await setup_entry(hass, make_entry())
    state = hass.states.get(STATUS)
    assert state.state == "happy"
    attrs = state.attributes
    assert attrs["shape"] == "golden_pothos"
    assert attrs["pot_color"] == "#c8643c"
    assert attrs["interval_days"] == 8
    assert attrs["button_entity"] == BUTTON
    assert attrs["last_watered_entity"] == LAST
    assert attrs["temperature_min"] == 15.6
    expected_next = watered + timedelta(days=8)
    assert dt_util.parse_datetime(hass.states.get(NEXT).state) == expected_next.replace(microsecond=0)


async def test_status_changes_on_its_own(
    hass: HomeAssistant, hass_storage: dict[str, Any], freezer: FrozenDateTimeFactory
) -> None:
    """Status moves on at the due date, +1.5 days and +3 days without polling."""
    watered_ago(hass_storage, 7.5)
    await setup_entry(hass, make_entry())
    assert hass.states.get(STATUS).state == "happy"
    for days, expected in ((0.6, "thirsty"), (1.5, "wilting"), (1.5, "ghost")):
        freezer.tick(timedelta(days=days))
        async_fire_time_changed(hass)
        await hass.async_block_till_done()
        assert hass.states.get(STATUS).state == expected


async def test_watered_button_resets(hass: HomeAssistant, hass_storage: dict[str, Any]) -> None:
    """Pressing Watered makes a ghost happy and saves the time."""
    watered_ago(hass_storage, 20)
    await setup_entry(hass, make_entry())
    assert hass.states.get(STATUS).state == "ghost"
    await hass.services.async_call("button", "press", {ATTR_ENTITY_ID: BUTTON}, blocking=True)
    assert hass.states.get(STATUS).state == "happy"
    last = dt_util.parse_datetime(hass.states.get(LAST).state)
    assert dt_util.utcnow() - last < timedelta(minutes=1)
    await hass.async_block_till_done()


async def test_last_watered_can_be_corrected(hass: HomeAssistant, hass_storage: dict[str, Any]) -> None:
    """Setting the last-watered time moves the countdown."""
    watered_ago(hass_storage, 1)
    await setup_entry(hass, make_entry())
    when = dt_util.utcnow() - timedelta(days=9)
    await hass.services.async_call(
        "datetime", "set_value", {ATTR_ENTITY_ID: LAST, "datetime": when.isoformat()}, blocking=True
    )
    assert hass.states.get(STATUS).state == "thirsty"


async def test_new_plant_uses_the_date_from_the_form(hass: HomeAssistant) -> None:
    """Without a saved time, the plant starts from the date given when it was added."""
    when = dt_util.utcnow() - timedelta(days=10)
    await setup_entry(hass, make_entry({PLANT_ID: ("Pothos", plant_data(last_watered=when.isoformat()))}))
    assert hass.states.get(STATUS).state == "wilting"


async def test_temperature_warning(hass: HomeAssistant, hass_storage: dict[str, Any]) -> None:
    """A room sensor in °F is compared with the plant's range."""
    watered_ago(hass_storage, 1)
    hass.states.async_set("sensor.living_room", "70", {ATTR_UNIT_OF_MEASUREMENT: UnitOfTemperature.FAHRENHEIT})
    await setup_entry(
        hass, make_entry({PLANT_ID: ("Pothos", plant_data(temperature_sensor="sensor.living_room"))})
    )
    problem = "binary_sensor.pothos_temperature"
    assert hass.states.get(problem).state == "off"

    hass.states.async_set("sensor.living_room", "50", {ATTR_UNIT_OF_MEASUREMENT: UnitOfTemperature.FAHRENHEIT})
    await hass.async_block_till_done()
    assert hass.states.get(problem).state == "on"
    assert hass.states.get(problem).attributes["problem"] == "cold"
    assert hass.states.get(STATUS).attributes["temperature_problem"] == "cold"

    # The pothos is comfortable up to 85 °F: a little over makes it sweat, far over scorch.
    assert hass.states.get(STATUS).attributes["heat"] is None
    hass.states.async_set("sensor.living_room", "88", {ATTR_UNIT_OF_MEASUREMENT: UnitOfTemperature.FAHRENHEIT})
    await hass.async_block_till_done()
    assert hass.states.get(STATUS).attributes["heat"] == "sweating"
    assert hass.states.get(problem).attributes["heat"] == "sweating"
    hass.states.async_set("sensor.living_room", "96", {ATTR_UNIT_OF_MEASUREMENT: UnitOfTemperature.FAHRENHEIT})
    await hass.async_block_till_done()
    assert hass.states.get(STATUS).attributes["heat"] == "scorching"

    hass.states.async_set("sensor.living_room", "unavailable")
    await hass.async_block_till_done()
    assert hass.states.get(problem).state == "unknown"


async def test_moisture_jump_marks_watered(hass: HomeAssistant, hass_storage: dict[str, Any]) -> None:
    """A soil moisture rise past the threshold counts as watering."""
    watered_ago(hass_storage, 20)
    hass.states.async_set("sensor.pothos_soil", "18")
    await setup_entry(
        hass, make_entry({PLANT_ID: ("Pothos", plant_data(moisture_sensor="sensor.pothos_soil"))})
    )
    assert hass.states.get(STATUS).state == "ghost"
    hass.states.async_set("sensor.pothos_soil", "21")
    await hass.async_block_till_done()
    assert hass.states.get(STATUS).state == "ghost"
    assert hass.states.get(STATUS).attributes["moisture"] == 21
    hass.states.async_set("sensor.pothos_soil", "34")
    await hass.async_block_till_done()
    assert hass.states.get(STATUS).state == "happy"


async def test_first_reading_after_startup_is_the_baseline(
    hass: HomeAssistant, hass_storage: dict[str, Any]
) -> None:
    """A single jump right after startup is measured from the startup reading."""
    watered_ago(hass_storage, 20)
    hass.states.async_set("sensor.pothos_soil", "20")
    await setup_entry(
        hass, make_entry({PLANT_ID: ("Pothos", plant_data(moisture_sensor="sensor.pothos_soil"))})
    )
    hass.states.async_set("sensor.pothos_soil", "35")
    await hass.async_block_till_done()
    assert hass.states.get(STATUS).state == "happy"


async def test_notes(hass: HomeAssistant, hass_storage: dict[str, Any]) -> None:
    """Notes start empty, can be set, survive a watering and a reload."""
    watered_ago(hass_storage, 1)
    entry = await setup_entry(hass, make_entry())
    assert hass.states.get(NOTES).state == ""
    assert hass.states.get(STATUS).attributes["notes_entity"] == NOTES

    await hass.services.async_call(
        "text", "set_value", {ATTR_ENTITY_ID: NOTES, "value": "Repotted in May"}, blocking=True
    )
    assert hass.states.get(NOTES).state == "Repotted in May"
    await hass.services.async_call("button", "press", {ATTR_ENTITY_ID: BUTTON}, blocking=True)
    assert hass.states.get(NOTES).state == "Repotted in May"

    assert await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()
    assert hass.states.get(NOTES).state == "Repotted in May"
    assert hass_storage[DOMAIN]["data"][PLANT_ID]["notes"] == "Repotted in May"


async def test_light_can_be_changed(hass: HomeAssistant, hass_storage: dict[str, Any]) -> None:
    """Changing the light moves the next watering and is saved, without a reload."""
    watered = watered_ago(hass_storage, 2)
    entry = await setup_entry(hass, make_entry())
    assert hass.states.get(LIGHT).state == "bright_indirect"
    assert hass.states.get(STATUS).attributes["light_entity"] == LIGHT
    assert er.async_get(hass).async_get(LIGHT).entity_category is EntityCategory.CONFIG
    plant = entry.runtime_data.plants[PLANT_ID]

    await hass.services.async_call(
        "select", "select_option", {ATTR_ENTITY_ID: LIGHT, "option": "low"}, blocking=True
    )
    await hass.async_block_till_done()
    assert entry.runtime_data.plants[PLANT_ID] is plant  # changed in place, not reloaded
    assert entry.subentries[PLANT_ID].data["light"] == "low"
    assert hass.states.get(LIGHT).state == "low"
    assert hass.states.get(STATUS).attributes["interval_days"] == 12
    expected_next = watered + timedelta(days=12)
    assert dt_util.parse_datetime(hass.states.get(NEXT).state) == expected_next.replace(microsecond=0)

    # The choice is part of the plant's settings, so it survives a restart.
    assert await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()
    assert hass.states.get(LIGHT).state == "low"


async def test_fullness_can_be_changed(hass: HomeAssistant, hass_storage: dict[str, Any]) -> None:
    """The Fullness slider starts at 100%, saves without a reload and reaches the card."""
    watered_ago(hass_storage, 2)
    entry = await setup_entry(hass, make_entry())
    state = hass.states.get(FULLNESS)
    assert float(state.state) == 100
    assert state.attributes["min"] == 0
    assert state.attributes["max"] == 200
    assert er.async_get(hass).async_get(FULLNESS).entity_category is EntityCategory.CONFIG
    assert hass.states.get(STATUS).attributes["fullness"] == 100
    plant = entry.runtime_data.plants[PLANT_ID]

    await hass.services.async_call("number", "set_value", {ATTR_ENTITY_ID: FULLNESS, "value": 170}, blocking=True)
    await hass.async_block_till_done()
    assert entry.runtime_data.plants[PLANT_ID] is plant  # changed in place, not reloaded
    assert entry.subentries[PLANT_ID].data["fullness"] == 170
    assert hass.states.get(STATUS).attributes["fullness"] == 170

    assert await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()
    assert float(hass.states.get(FULLNESS).state) == 170


async def test_removing_a_plant(hass: HomeAssistant, hass_storage: dict[str, Any]) -> None:
    """Removing the subentry removes its device and entities."""
    watered_ago(hass_storage, 1)
    entry = await setup_entry(hass, make_entry())
    assert hass.config_entries.async_remove_subentry(entry, PLANT_ID)
    await hass.async_block_till_done()
    assert dr.async_get(hass).async_get_device(identifiers={(DOMAIN, PLANT_ID)}) is None
    assert er.async_get(hass).async_get(STATUS) is None
    assert hass.states.get(STATUS) is None


async def test_unload(hass: HomeAssistant, hass_storage: dict[str, Any]) -> None:
    """Unloading stops the plants and flushes the store."""
    watered_ago(hass_storage, 1)
    entry = await setup_entry(hass, make_entry())
    await hass.services.async_call("button", "press", {ATTR_ENTITY_ID: BUTTON}, blocking=True)
    assert await hass.config_entries.async_unload(entry.entry_id)
    saved = hass_storage[DOMAIN]["data"][PLANT_ID]["last_watered"]
    assert dt_util.utcnow() - dt_util.parse_datetime(saved) < timedelta(minutes=1)


async def _water(hass: HomeAssistant, freezer: FrozenDateTimeFactory) -> None:
    freezer.tick(timedelta(days=1))
    await hass.services.async_call("button", "press", {ATTR_ENTITY_ID: BUTTON}, blocking=True)


async def test_fertilizer_is_off_by_default(hass: HomeAssistant, hass_storage: dict[str, Any]) -> None:
    """Without the setting there's no reminder and no Next watering entity."""
    watered_ago(hass_storage, 2)
    await setup_entry(hass, make_entry())
    assert "fertilizer" not in hass.states.get(STATUS).attributes
    assert hass.states.get(FEED) is None


async def test_fertilizer_cycle(
    hass: HomeAssistant, hass_storage: dict[str, Any], freezer: FrozenDateTimeFactory
) -> None:
    """Each watering moves the cycle on: two with fertilizer, then plain water."""
    watered_ago(hass_storage, 2)
    await setup_entry(hass, make_entry(options=FERTILIZER))
    attrs = hass.states.get(STATUS).attributes
    assert attrs["fertilizer"] == "Foliage Focus"
    assert attrs["fertilizer_dose"] == 5  # pothos are hungry
    assert attrs["fertilizer_feeds"] == 2
    assert attrs["fertilizer_entity"] == FEED
    assert er.async_get(hass).async_get(FEED).entity_category is EntityCategory.CONFIG

    steps = []
    for _ in range(4):
        steps.append((hass.states.get(STATUS).attributes["fertilizer_step"], hass.states.get(FEED).state))
        await _water(hass, freezer)
    assert steps == [(1, "feed_1"), (2, "feed_2"), (3, "plain_water"), (1, "feed_1")]


async def test_undo_takes_the_watering_back_off(
    hass: HomeAssistant, hass_storage: dict[str, Any], freezer: FrozenDateTimeFactory
) -> None:
    """Undo (back to the previous time) steps back; correcting the time doesn't."""
    watered_ago(hass_storage, 2)
    await setup_entry(hass, make_entry(options=FERTILIZER))
    previous = hass.states.get(LAST).state
    await _water(hass, freezer)
    assert hass.states.get(FEED).state == "feed_2"

    # "I actually watered it an hour ago": still the same watering.
    when = dt_util.utcnow() - timedelta(hours=1)
    await hass.services.async_call(
        "datetime", "set_value", {ATTR_ENTITY_ID: LAST, "datetime": when.isoformat()}, blocking=True
    )
    assert hass.states.get(FEED).state == "feed_2"

    # The card's Undo puts back the time from before the watering.
    await hass.services.async_call("datetime", "set_value", {ATTR_ENTITY_ID: LAST, "datetime": previous}, blocking=True)
    assert hass.states.get(FEED).state == "feed_1"


async def test_next_watering_can_be_put_back_in_step(
    hass: HomeAssistant, hass_storage: dict[str, Any], freezer: FrozenDateTimeFactory
) -> None:
    """Choosing what the next watering is restarts the count from there."""
    watered_ago(hass_storage, 2)
    await setup_entry(hass, make_entry(options=FERTILIZER))
    await hass.services.async_call(
        "select", "select_option", {ATTR_ENTITY_ID: FEED, "option": "plain_water"}, blocking=True
    )
    assert hass.states.get(STATUS).attributes["fertilizer_step"] == 3
    await _water(hass, freezer)
    assert hass.states.get(FEED).state == "feed_1"


async def test_moss_is_not_fed(hass: HomeAssistant, hass_storage: dict[str, Any]) -> None:
    """The terrarium says it needs no fertilizer and has no cycle to follow."""
    watered_ago(hass_storage, 2)
    await setup_entry(hass, make_entry({PLANT_ID: ("Pothos", plant_data(species="moss_terrarium"))}, FERTILIZER))
    attrs = hass.states.get(STATUS).attributes
    assert attrs["fertilizer_dose"] == 0
    assert "fertilizer_step" not in attrs
    assert hass.states.get(FEED) is None
