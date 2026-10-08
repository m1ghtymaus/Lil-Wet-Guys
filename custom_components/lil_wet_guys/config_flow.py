"""Config flow: one Lil Wet Guys entry, then an "Add plant" flow per plant."""

from __future__ import annotations

import uuid
from collections.abc import Mapping
from datetime import timedelta
from pathlib import Path
from typing import Any

import voluptuous as vol
from PIL import Image, ImageOps, UnidentifiedImageError

from homeassistant.components.file_upload import process_uploaded_file
from homeassistant.components.http.auth import async_sign_path
from homeassistant.config_entries import (
    ConfigEntry,
    ConfigFlow,
    ConfigFlowResult,
    ConfigSubentryFlow,
    OptionsFlow,
    SubentryFlowResult,
)
from homeassistant.const import CONF_NAME, UnitOfTemperature
from homeassistant.core import HomeAssistant, callback
from homeassistant.data_entry_flow import section
from homeassistant.helpers import selector
from homeassistant.util import dt as dt_util
from homeassistant.util.unit_conversion import TemperatureConverter

from .backup import (
    EXPORT_DIR,
    EXPORT_URL,
    InvalidExport,
    async_create_export,
    async_import_bundle,
    read_bundle,
)
from .const import (
    CONF_BASE_DAYS,
    CONF_FERTILIZER,
    CONF_FULLNESS,
    CONF_LAST_WATERED,
    CONF_LIGHT,
    CONF_MOISTURE_JUMP,
    CONF_MOISTURE_SENSOR,
    CONF_PHOTO,
    CONF_PHOTO_FILE,
    CONF_POT_COLOR,
    CONF_REMOVE_PHOTO,
    CONF_SHAPE,
    CONF_SPECIES,
    CONF_TEMP_MAX,
    CONF_TEMP_MIN,
    CONF_TEMP_SENSOR,
    CONF_TEMPERATURE_UNIT,
    DEFAULT_MOISTURE_JUMP,
    DEFAULT_POT_COLOR,
    DOMAIN,
    INTEGRATION_NAME,
    LIGHT_LEVELS,
    PHOTO_DIR,
    SECTION_SENSORS,
    SPECIES_OTHER,
    SUBENTRY_PLANT,
    TEMPERATURE_UNITS,
    UNIT_AUTO,
)
from .plant import temperature_unit
from .species import GENERIC_SHAPES, OTHER, SPECIES

CONF_FILE = "file"  # import form: the uploaded export
CONF_EXISTING = "existing"  # import form: skip or add plants whose name already exists

C = UnitOfTemperature.CELSIUS
F = UnitOfTemperature.FAHRENHEIT

SPECIES_OPTIONS = [
    selector.SelectOptionDict(value=key, label=sp.label)
    for key, sp in sorted(SPECIES.items(), key=lambda item: item[1].label.lower())
] + [selector.SelectOptionDict(value=SPECIES_OTHER, label="Other (not listed)")]


def save_photo(hass: HomeAssistant, file_id: str) -> str:
    """Store an uploaded photo as a JPEG up to 1024 px; return its file name.

    Runs in the executor.
    """
    folder = Path(hass.config.path(PHOTO_DIR))
    folder.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4().hex}.jpg"
    with process_uploaded_file(hass, file_id) as src, Image.open(src) as img:
        photo = ImageOps.exif_transpose(img)
        photo.thumbnail((1024, 1024))
        photo.convert("RGB").save(folder / name, "JPEG", quality=85)
    return name


class LilWetGuysConfigFlow(ConfigFlow, domain=DOMAIN):
    """Create the single Lil Wet Guys entry."""

    # Bump these (and handle the old shape in __init__.async_migrate_entry) whenever
    # a release changes what a plant's subentry data looks like.
    VERSION = 1
    MINOR_VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Confirm setup."""
        if user_input is not None:
            return self.async_create_entry(title=INTEGRATION_NAME, data={})
        return self.async_show_form(step_id="user")

    @classmethod
    @callback
    def async_get_supported_subentry_types(
        cls, config_entry: ConfigEntry
    ) -> dict[str, type[ConfigSubentryFlow]]:
        """Plants are added as subentries."""
        return {SUBENTRY_PLANT: PlantFlow}

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        """Configure offers settings, export and import."""
        return BackupFlow()


class BackupFlow(OptionsFlow):
    """Settings for every plant, and exporting or importing plants."""

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Choose settings, export or import."""
        return self.async_show_menu(step_id="init", menu_options=["settings", "export", "import_plants"])

    async def async_step_settings(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Change the settings that apply to every plant."""
        if user_input is not None:
            return self.async_create_entry(data={**self.config_entry.options, **user_input})
        schema = vol.Schema(
            {
                vol.Required(
                    CONF_TEMPERATURE_UNIT, default=self.config_entry.options.get(CONF_TEMPERATURE_UNIT, UNIT_AUTO)
                ): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=TEMPERATURE_UNITS,
                        translation_key=CONF_TEMPERATURE_UNIT,
                        mode=selector.SelectSelectorMode.DROPDOWN,
                    )
                ),
                vol.Required(
                    CONF_FERTILIZER, default=self.config_entry.options.get(CONF_FERTILIZER, False)
                ): selector.BooleanSelector(),
            }
        )
        return self.async_show_form(step_id="settings", data_schema=schema)

    async def async_step_export(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Write an export and hand back a download link that works for an hour."""
        name, count = await async_create_export(self.hass, self.config_entry)
        url = async_sign_path(self.hass, EXPORT_URL.format(filename=name), timedelta(hours=1))
        return self.async_abort(
            reason="export_ready",
            description_placeholders={"count": str(count), "url": url, "path": f"/config/{EXPORT_DIR}/{name}"},
        )

    async def async_step_import_plants(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Add the plants from an export file."""
        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                bundle = await self.hass.async_add_executor_job(_read_upload, self.hass, user_input[CONF_FILE])
            except InvalidExport:
                errors[CONF_FILE] = "bad_export"
            else:
                added, skipped = await async_import_bundle(
                    self.hass, self.config_entry, bundle, skip_existing=user_input[CONF_EXISTING] == "skip"
                )
                return self.async_abort(
                    reason="import_done", description_placeholders={"added": str(added), "skipped": str(skipped)}
                )
        return self.async_show_form(
            step_id="import_plants",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_FILE): selector.FileSelector(
                        selector.FileSelectorConfig(accept=".zip,.json,application/zip,application/json")
                    ),
                    vol.Required(CONF_EXISTING, default="skip"): selector.SelectSelector(
                        selector.SelectSelectorConfig(options=["skip", "add"], translation_key="existing")
                    ),
                }
            ),
            errors=errors,
        )



def _read_upload(hass: HomeAssistant, file_id: str) -> Any:
    """Read an uploaded export (runs in the executor; the upload is removed after)."""
    with process_uploaded_file(hass, file_id) as path:
        return read_bundle(path)


class PlantFlow(ConfigSubentryFlow):
    """Add or edit one plant."""

    def __init__(self) -> None:
        """Start with nothing chosen."""
        self._name = ""
        self._species = SPECIES_OTHER

    # ------------------------------------------------------------------ add

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        """Name the plant and pick its type."""
        if user_input is not None:
            self._name = user_input[CONF_NAME].strip()
            self._species = user_input[CONF_SPECIES]
            return await self.async_step_details()
        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_NAME): selector.TextSelector(),
                    vol.Required(CONF_SPECIES): _species_selector(),
                }
            ),
        )

    async def async_step_details(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        """Care details, prefilled from the plant type."""
        errors: dict[str, str] = {}
        if user_input is not None:
            data, errors = await self._async_build(user_input, self._species, previous=None)
            if not errors:
                return self.async_create_entry(title=self._name, data=data)
        schema = self._details_schema(self._species, new=True, has_photo=False)
        return self.async_show_form(
            step_id="details",
            data_schema=self.add_suggested_values_to_schema(schema, user_input or self._defaults(self._species)),
            errors=errors,
            description_placeholders={"name": self._name, "species": _species_label(self._species)},
        )

    # ----------------------------------------------------------------- edit

    async def async_step_reconfigure(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        """Edit everything about an existing plant."""
        subentry = self._get_reconfigure_subentry()
        errors: dict[str, str] = {}
        if user_input is not None:
            values = dict(user_input)
            name = values.pop(CONF_NAME).strip()
            species = values.pop(CONF_SPECIES)
            data, errors = await self._async_build(values, species, previous=subentry.data)
            if not errors:
                return self.async_update_and_abort(self._get_entry(), subentry, title=name, data=data)
        schema = vol.Schema(
            {
                vol.Required(CONF_NAME): selector.TextSelector(),
                vol.Required(CONF_SPECIES): _species_selector(),
            }
        ).extend(
            self._details_schema(
                subentry.data.get(CONF_SPECIES, SPECIES_OTHER),
                new=False,
                has_photo=bool(subentry.data.get(CONF_PHOTO_FILE)),
            ).schema
        )
        return self.async_show_form(
            step_id="reconfigure",
            data_schema=self.add_suggested_values_to_schema(schema, user_input or self._current(subentry)),
            errors=errors,
            description_placeholders={"name": subentry.title},
        )

    # -------------------------------------------------------------- helpers

    @property
    def _unit(self) -> str:
        return temperature_unit(self.hass, self._get_entry())

    def _details_schema(self, species: str, *, new: bool, has_photo: bool) -> vol.Schema:
        unit = self._unit
        temp = selector.NumberSelector(
            selector.NumberSelectorConfig(
                min=-20, max=120, step=1, mode=selector.NumberSelectorMode.BOX, unit_of_measurement=unit
            )
        )
        fields: dict[Any, Any] = {
            vol.Required(CONF_LIGHT): selector.SelectSelector(
                selector.SelectSelectorConfig(
                    options=LIGHT_LEVELS, translation_key="light", mode=selector.SelectSelectorMode.DROPDOWN
                )
            ),
            vol.Required(CONF_BASE_DAYS): selector.NumberSelector(
                selector.NumberSelectorConfig(
                    min=1, max=90, step=0.5, mode=selector.NumberSelectorMode.BOX, unit_of_measurement="days"
                )
            ),
            vol.Required(CONF_TEMP_MIN): temp,
            vol.Required(CONF_TEMP_MAX): temp,
            vol.Required(CONF_POT_COLOR): selector.ColorRGBSelector(),
        }
        # The shape only matters without a preset, but an edit may switch to "Other".
        if species == SPECIES_OTHER or not new:
            fields[vol.Optional(CONF_SHAPE)] = selector.SelectSelector(
                selector.SelectSelectorConfig(
                    options=GENERIC_SHAPES, translation_key="shape", mode=selector.SelectSelectorMode.DROPDOWN
                )
            )
        fields[vol.Optional(CONF_PHOTO)] = selector.FileSelector(selector.FileSelectorConfig(accept="image/*"))
        if has_photo:
            fields[vol.Optional(CONF_REMOVE_PHOTO, default=False)] = selector.BooleanSelector()
        if new:
            fields[vol.Optional(CONF_LAST_WATERED)] = selector.DateTimeSelector()
        fields[vol.Required(SECTION_SENSORS)] = section(
            vol.Schema(
                {
                    vol.Optional(CONF_TEMP_SENSOR): selector.EntitySelector(
                        selector.EntitySelectorConfig(domain="sensor", device_class="temperature")
                    ),
                    vol.Optional(CONF_MOISTURE_SENSOR): selector.EntitySelector(
                        selector.EntitySelectorConfig(domain="sensor", device_class="moisture")
                    ),
                    vol.Optional(CONF_MOISTURE_JUMP, default=DEFAULT_MOISTURE_JUMP): selector.NumberSelector(
                        selector.NumberSelectorConfig(
                            min=1, max=50, step=1, mode=selector.NumberSelectorMode.BOX, unit_of_measurement="%"
                        )
                    ),
                }
            ),
            {"collapsed": True},
        )
        return vol.Schema(fields)

    def _defaults(self, species: str) -> dict[str, Any]:
        preset = SPECIES.get(species, OTHER)
        return {
            CONF_LIGHT: preset.light,
            CONF_BASE_DAYS: preset.base_days,
            CONF_TEMP_MIN: round(TemperatureConverter.convert(preset.temp_min_f, F, self._unit)),
            CONF_TEMP_MAX: round(TemperatureConverter.convert(preset.temp_max_f, F, self._unit)),
            CONF_POT_COLOR: DEFAULT_POT_COLOR,
            CONF_SHAPE: GENERIC_SHAPES[0],
            CONF_LAST_WATERED: dt_util.now().strftime("%Y-%m-%d %H:%M:%S"),
            SECTION_SENSORS: {CONF_MOISTURE_JUMP: DEFAULT_MOISTURE_JUMP},
        }

    def _current(self, subentry: Any) -> dict[str, Any]:
        data = subentry.data
        sensors = {CONF_MOISTURE_JUMP: data.get(CONF_MOISTURE_JUMP, DEFAULT_MOISTURE_JUMP)}
        for key in (CONF_TEMP_SENSOR, CONF_MOISTURE_SENSOR):
            if data.get(key):
                sensors[key] = data[key]
        return {
            CONF_NAME: subentry.title,
            CONF_SPECIES: data.get(CONF_SPECIES, SPECIES_OTHER),
            CONF_LIGHT: data[CONF_LIGHT],
            CONF_BASE_DAYS: data[CONF_BASE_DAYS],
            CONF_TEMP_MIN: round(TemperatureConverter.convert(data[CONF_TEMP_MIN], C, self._unit), 1),
            CONF_TEMP_MAX: round(TemperatureConverter.convert(data[CONF_TEMP_MAX], C, self._unit), 1),
            CONF_POT_COLOR: data.get(CONF_POT_COLOR, DEFAULT_POT_COLOR),
            CONF_SHAPE: data.get(CONF_SHAPE, GENERIC_SHAPES[0]),
            SECTION_SENSORS: sensors,
        }

    async def _async_build(
        self, user_input: Mapping[str, Any], species: str, previous: Mapping[str, Any] | None
    ) -> tuple[dict[str, Any], dict[str, str]]:
        """Turn form input into subentry data; returns (data, errors)."""
        errors: dict[str, str] = {}
        temp_min = TemperatureConverter.convert(float(user_input[CONF_TEMP_MIN]), self._unit, C)
        temp_max = TemperatureConverter.convert(float(user_input[CONF_TEMP_MAX]), self._unit, C)
        if temp_min >= temp_max:
            errors["base"] = "temp_range"
        sensors = user_input.get(SECTION_SENSORS, {})
        data: dict[str, Any] = {
            CONF_SPECIES: species,
            CONF_LIGHT: user_input[CONF_LIGHT],
            CONF_BASE_DAYS: float(user_input[CONF_BASE_DAYS]),
            CONF_TEMP_MIN: round(temp_min, 2),
            CONF_TEMP_MAX: round(temp_max, 2),
            CONF_POT_COLOR: [int(c) for c in user_input[CONF_POT_COLOR]],
            CONF_MOISTURE_JUMP: float(sensors.get(CONF_MOISTURE_JUMP, DEFAULT_MOISTURE_JUMP)),
        }
        if species == SPECIES_OTHER:
            data[CONF_SHAPE] = user_input.get(CONF_SHAPE) or GENERIC_SHAPES[0]
        if previous and CONF_FULLNESS in previous:
            data[CONF_FULLNESS] = previous[CONF_FULLNESS]  # set from the device page, not this form
        for key in (CONF_TEMP_SENSOR, CONF_MOISTURE_SENSOR):
            if sensors.get(key):
                data[key] = sensors[key]

        photo = (previous or {}).get(CONF_PHOTO_FILE)
        if user_input.get(CONF_REMOVE_PHOTO):
            photo = None
        # Only read the upload once everything else is valid: it is consumed on use.
        if not errors and user_input.get(CONF_PHOTO):
            try:
                photo = await self.hass.async_add_executor_job(save_photo, self.hass, user_input[CONF_PHOTO])
            except (UnidentifiedImageError, OSError, ValueError):
                errors[CONF_PHOTO] = "bad_photo"
        if photo:
            data[CONF_PHOTO_FILE] = photo

        if previous is None:
            data[CONF_LAST_WATERED] = _parse_last_watered(user_input.get(CONF_LAST_WATERED))
        elif CONF_LAST_WATERED in previous:
            data[CONF_LAST_WATERED] = previous[CONF_LAST_WATERED]
        return data, errors


def _species_selector() -> selector.SelectSelector:
    return selector.SelectSelector(
        selector.SelectSelectorConfig(options=SPECIES_OPTIONS, mode=selector.SelectSelectorMode.DROPDOWN)
    )


def _species_label(species: str) -> str:
    return SPECIES[species].label if species in SPECIES else "a plant without a preset"


def _parse_last_watered(value: str | None) -> str:
    """Local date-time from the form as UTC ISO; now if missing, never in the future."""
    now = dt_util.utcnow()
    when = dt_util.parse_datetime(value) if value else None
    if when is None:
        return now.isoformat()
    if when.tzinfo is None:
        when = when.replace(tzinfo=dt_util.get_default_time_zone())
    return min(dt_util.as_utc(when), now).isoformat()
