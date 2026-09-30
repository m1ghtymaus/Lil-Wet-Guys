"""Test fixtures for Lil Wet Guys."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.lil_wet_guys.const import DOMAIN, SUBENTRY_PLANT
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util

PLANT_ID = "plant01"


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    """Let Home Assistant load the integration from custom_components."""
    return enable_custom_integrations


def plant_data(**overrides: Any) -> dict[str, Any]:
    """Subentry data for a golden pothos watered every 8 days in bright light."""
    data = {
        "species": "golden_pothos",
        "light": "bright_indirect",
        "base_days": 8.0,
        "temp_min": 15.56,
        "temp_max": 29.44,
        "pot_color": [200, 100, 60],
        "moisture_jump": 10.0,
    }
    data.update(overrides)
    return data


def make_entry(plants: dict[str, tuple[str, dict[str, Any]]] | None = None) -> MockConfigEntry:
    """Build a Lil Wet Guys entry holding the given plants (id -> (name, data))."""
    plants = plants if plants is not None else {PLANT_ID: ("Pothos", plant_data())}
    return MockConfigEntry(
        domain=DOMAIN,
        title="Lil Wet Guys",
        data={},
        subentries_data=[
            {
                "data": data,
                "subentry_id": plant_id,
                "subentry_type": SUBENTRY_PLANT,
                "title": name,
                "unique_id": None,
            }
            for plant_id, (name, data) in plants.items()
        ],
    )


def watered_ago(hass_storage: dict[str, Any], days: float, plant_id: str = PLANT_ID) -> datetime:
    """Pre-load the store so the plant was last watered `days` ago."""
    when = dt_util.utcnow() - timedelta(days=days)
    hass_storage[DOMAIN] = {
        "version": 1,
        "minor_version": 1,
        "key": DOMAIN,
        "data": {plant_id: {"last_watered": when.isoformat()}},
    }
    return when


async def setup_entry(hass: HomeAssistant, entry: MockConfigEntry) -> MockConfigEntry:
    """Add the entry and wait for it to load."""
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry
