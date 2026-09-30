"""Constants for the Plant Tracker integration."""

from __future__ import annotations

from typing import Final

DOMAIN: Final = "plant_tracker"
MANUFACTURER: Final = "Plant Tracker"
SUBENTRY_PLANT: Final = "plant"

# Subentry data keys.
CONF_SPECIES: Final = "species"
CONF_SHAPE: Final = "shape"
CONF_LIGHT: Final = "light"
CONF_BASE_DAYS: Final = "base_days"
CONF_TEMP_MIN: Final = "temp_min"  # stored in °C
CONF_TEMP_MAX: Final = "temp_max"  # stored in °C
CONF_POT_COLOR: Final = "pot_color"  # [r, g, b]
CONF_PHOTO_FILE: Final = "photo_file"  # file name under PHOTO_DIR
CONF_TEMP_SENSOR: Final = "temperature_sensor"
CONF_MOISTURE_SENSOR: Final = "moisture_sensor"
CONF_MOISTURE_JUMP: Final = "moisture_jump"
CONF_LAST_WATERED: Final = "last_watered"  # only used when the plant is added

# Form-only keys.
CONF_PHOTO: Final = "photo"  # uploaded file id
CONF_REMOVE_PHOTO: Final = "remove_photo"
SECTION_SENSORS: Final = "sensors"

SPECIES_OTHER: Final = "other"
LIGHT_LEVELS: Final = ["direct", "bright_indirect", "medium", "low"]
DEFAULT_POT_COLOR: Final = [200, 100, 60]
DEFAULT_MOISTURE_JUMP: Final = 10

STORAGE_KEY: Final = DOMAIN
STORAGE_VERSION: Final = 1
PHOTO_DIR: Final = "plant_tracker/photos"  # relative to the config directory

URL_BASE: Final = "/plant_tracker_static"
CARD_FILE: Final = "plant-tracker-card.js"
