# Changelog

Versions follow MAJOR.MINOR.PATCH: patch for fixes, minor for new features, major
when updating needs you to do something.

## 0.4.1 — 2026-10-03

### Changed
- The satin pothos drawing has a fuller middle instead of a fan of bare stems.

## 0.4.0 — 2026-10-03

### Added
- A **bookshelf** background for the card (`background: bookshelf`, or
  Background in the card editor): each row of plants stands on a cartoon wooden
  walnut shelf with its name on a little label, and a different handful of
  surprises turns up on every page load: books, a snail, a peeking fairy, a
  climbing vine, a mouse hole and more, always with something magical (potions,
  crystals, a sleeping baby dragon or a moon mobile). Fireflies twinkle on
  every shelf.
- Six more plants, each with a care preset and its own drawing: Jade pothos,
  Alocasia 'Frydek', Money tree, Mini monstera (Rhaphidophora tetrasperma),
  Nerve plant (Fittonia albivenis) and Variegated million hearts (Dischidia
  ruscifolia 'Variegata').

### Fixed
- A countdown just under two days read "1 day 24 h" instead of "2 days".

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
