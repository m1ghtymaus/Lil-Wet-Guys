# Releasing Lil Wet Guys

## What keeps existing installs safe

A Home Assistant that already has Lil Wet Guys keeps its plants through an
update because none of their data lives in the integration's folder, which is
the only thing HACS replaces:

| Data | Where it lives |
| --- | --- |
| Each plant's settings | Home Assistant's config entries (`.storage/core.config_entries`) |
| Last-watered times and notes | `.storage/lil_wet_guys` |
| Photos | `/config/lil_wet_guys/photos` |
| Entity history | the recorder, tied to each entity's unique id |

So a release must never change:

- the integration id `lil_wet_guys`
- entity unique ids (`<plant id>_<key>`, e.g. `…_next_watering`)
- the storage key, the photo folder, or the card type `custom:lil-wet-guys-card`

When a release changes the **shape** of stored data:

- **A plant's settings:** bump `VERSION`/`MINOR_VERSION` in `config_flow.py` and
  convert old entries in `async_migrate_entry` (`__init__.py`).
- **Last-watered times or notes:** bump `STORAGE_VERSION` in `const.py` and
  convert old data in `_VersionedStore._async_migrate_func` (`plant.py`).
- Add a test that loads data in the old shape.

## Publishing a release

1. Set the new version in `custom_components/lil_wet_guys/manifest.json`
   (patch for fixes, minor for features, major if users must act).
2. Add a section for it at the top of `CHANGELOG.md`.
3. Run the checks:

   ```bash
   .venv/bin/python -m pytest
   uvx ruff check .
   ```

4. Commit, tag and push (replace `0.3.0`):

   ```bash
   git tag -a v0.3.0 -m "v0.3.0"
   git push origin main v0.3.0
   ```

5. On GitHub: the repository → **Releases** → **Draft a new release** →
   **Choose a tag** → `v0.3.0` → title `v0.3.0` → paste that version's
   `CHANGELOG.md` section as the description → **Publish release**.

HACS reads the version from the release tag, so the tag must match the version
in `manifest.json`.

## Updating an installed Home Assistant

See **Updating** in the README: back up, make the repository public, update in
HACS, restart, make it private again.
