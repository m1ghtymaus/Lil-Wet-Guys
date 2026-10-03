# Changelog

Versions follow MAJOR.MINOR.PATCH: patch for fixes, minor for new features, major
when updating needs you to do something.

## 0.8.0 — 2026-10-03

### Added
- **Sweating** and **scorching** moods: when a plant's thermometer says the room
  is a little too hot, its face sweats; 5 °C (9 °F) or more over its range, it
  scorches, with a red-hot pot and heat rising beside it. The `heat` attribute
  on the status and temperature sensors reports the same, for automations.

## 0.7.1 — 2026-10-03

### Changed
- Bookshelf dividers are as thick as the side posts and join the crown and base
  the same way, instead of looking set in behind them. Plant labels on the
  bookshelf are all the same width with their text centred both ways, so each
  divider sits evenly between its neighbours and every label in a row lines up.

## 0.7.0 — 2026-10-03

### Added
- A **Wood** choice for the bookshelf: walnut, oak, maple, cherry, mahogany,
  ebony, whitewash, or any custom colour, with the whole case shaded from it.

## 0.6.0 — 2026-10-03

### Added
- A global **Temperature unit** setting (Configure → Settings): the same as Home
  Assistant, Celsius or Fahrenheit, for every plant's forms, entities and the
  card's default.
- Bookshelf **dividers**: wooden uprights splitting each row into equal
  compartments of three plants (or two, when a row's plants don't divide by
  three), so long rows on wide screens are broken up (`dividers: false` turns
  them off).

## 0.5.0 — 2026-10-03

### Added
- Moss terrarium: moss and a string of fairy lights in a glass jar with a
  wooden lid. Its pot colour becomes a ribbon round the jar's neck.
- New bookshelf surprises: a toadstool cottage with a lit window, a frog with
  fairy wings, a dripping candle, a crystal and herb charm hanging from a twig,
  two little mushroom people leaning together, a mortar and pestle with the triple
  moon, a mushroom garland, acorns, a beetle, a jar of jam, a basket of
  mushrooms, a tree stump with shelf fungi, a newt climbing a post, a frog on a
  crescent-moon swing, a cobweb in a corner, and now and then a snail with
  mushrooms growing on its shell.
- A **Whimsy** slider for the bookshelf (`whimsy`, 0–4): from just the shelves to
  four surprises per plant. Fireflies follow it too.

### Removed
- The sleeping dragon, the fairy and the mouse hole are gone from the bookshelf.

### Fixed
- On the bookshelf, props (like a snail on a side post) no longer slip
  underneath plant labels; they always sit on top, while still tucking behind
  the plants themselves.

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
