# Changelog

Versions follow MAJOR.MINOR.PATCH: patch for fixes, minor for new features, major
when updating needs you to do something.

## 0.3.0 — 2026-10-02

### Added
- Six new plants, each with a care preset and its own drawing: Epipremnum
  pinnatum, Inch plant (Tradescantia zebrina), White bird of paradise
  (Strelitzia nicolai), Monstera deliciosa, Thai Constellation monstera and
  Black Raven ZZ plant.
- A **Light** setting for each plant, changeable from the card's plant popup or
  the plant's device page (`select.<plant>_light`). The next watering moves as
  soon as you change it.
- Export and import under Settings → Devices & services → Lil Wet Guys →
  **Configure**. An export is a `.zip` with every plant's settings,
  last-watered time, notes and photo; import it on this or another Home
  Assistant.

### Changed
- Published as numbered GitHub releases, so HACS shows versions and offers
  updates instead of tracking every commit.
- Stored data now carries version numbers with upgrade hooks, so future releases
  can change how plants are stored without losing them. An entry saved by a
  newer version is refused rather than damaged.

## 0.2.3 — 2026-09-30

### Fixed
- Animations no longer restart every time Home Assistant sends an update, and
  run smoothly: each drawing is split into layers that the browser can move
  without redrawing.

### Changed
- Eyes, mouths and brows are black on every pot except black ones, and the eyes
  have no glint.

## 0.2.1 — 2026-09-30

### Changed
- Each plant gets a random arm-and-feet pose on every page load.

## 0.2.0 — 2026-09-30

### Changed
- Renamed to Lil Wet Guys, including the integration id (`lil_wet_guys`) and the
  card (`custom:lil-wet-guys-card`). Installs of 0.1.0 have to be removed and
  reinstalled.

### Added
- Notes for each plant, editable in the card's popup.
- A °C/°F switch on the card.

## 0.1.0 — 2026-09-30

- First version, as Plant Tracker.
