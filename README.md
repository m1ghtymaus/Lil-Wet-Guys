# Plant Tracker for Home Assistant

Keeps a watering countdown for each of your houseplants and shows them on your
dashboard as cartoons in their own pots, most thirsty first. When a plant's
watering date passes it slowly droops, browns and frowns; three days late it
turns into a ghost. Tap the watering can to bring it back.

![The Plant Tracker card](docs/dashboard.jpg)

## What you get

Each plant is its own device with these entities:

| Entity | What it does |
| --- | --- |
| `sensor.<plant>_next_watering` | When the plant is next due. Home Assistant shows it as a countdown. |
| `sensor.<plant>_status` | `happy`, `thirsty` (0–1½ days late), `wilting` (1½–3 days late) or `ghost` (3+ days late). Its attributes carry everything the card needs. |
| `button.<plant>_watered` | Press after watering; the countdown starts again. |
| `datetime.<plant>_last_watered` | When it was last watered. Change it if you watered yesterday and forgot to press the button. |
| `image.<plant>_photo` | The plant's photo, if you added one. |
| `binary_sensor.<plant>_temperature` | On when the room is too cold or hot for the plant (only if you linked a thermometer). |

Plus a dashboard card and a daily reminder blueprint.

## How the countdown works

Every plant has a watering interval for **bright, indirect light**. The light
where it actually lives stretches or shortens that:

| Light | Interval |
| --- | --- |
| Direct sun | ×0.75 |
| Bright, indirect light | ×1 |
| Medium light | ×1.25 |
| Low light | ×1.5 |

So a golden pothos (8 days in bright light) in medium light is due every 10
days. The next watering is the last watering plus that interval.

If you link a **soil moisture sensor**, a rise of 10 percentage points (you can
change this) within an hour counts as watering and resets the countdown.

## Requirements

- Home Assistant **2025.6** or newer (plants are config subentries, which the
  "Add plant" button relies on).
- No cloud or AI services. Everything runs locally.

## Install

This repository is private, and [HACS can't install from private
repositories](https://www.hacs.xyz/docs/faq/private_repositories/), so install by
hand: copy `custom_components/plant_tracker` into your Home Assistant config
directory, next to `configuration.yaml`, and restart. The result should be
`<config>/custom_components/plant_tracker/manifest.json`.

| Install type | Config directory | How to get files in |
| --- | --- | --- |
| Home Assistant OS / Supervised | `/config` (`/homeassistant` over Samba) | Samba share, Studio Code Server or File editor add-on, or `scp` via the SSH add-on |
| Container / Docker | whatever you mounted at `/config` | copy into that directory on the host |
| Core (venv) | `~/.homeassistant` | copy it there |

To update, copy the folder again and restart. (If the repository is ever made
public, `hacs.json` is already in place for adding it to HACS as a custom
repository.)

## Set up

1. **Settings → Devices & services → Add integration → Plant Tracker.**
2. On the Plant Tracker page, press **Add plant**.
3. Give it a name and pick its type. The next page is filled in from the type:
   light, watering interval, comfortable temperatures. Change anything you like,
   pick a pot colour, add a photo, and set when you last watered it.
4. Under **Sensors (optional)** you can link a room thermometer and a soil
   moisture sensor.

To change a plant later, use the pencil next to it on the integration page
(**Edit plant**). Deleting it there removes its device and entities.

### Plant types with presets

Arrowhead plant, Asparagus fern 'Sprengeri', Banana plant, Cylindrical snake
plant, Dragon tree, Easter cactus, Gasteria, Golden pothos, Heartleaf
philodendron, Lipstick plant, Lucky bamboo, Monkey mask, Peperomia, Peperomia
'Hope', Pink Princess philodendron, Rubber plant 'Ruby', Satin pothos, Snake
plant 'Laurentii', Snake plant 'Zeylanica', Snake plant 'Moonshine', Spider
plant, Split-leaf philodendron, Tiger aloe, Tiger tooth aloe, Umbrella plant,
Variegated peperomia, Weeping fig and ZZ plant.

Each has its own drawing and care preset (see
[`species.py`](custom_components/plant_tracker/species.py)). For anything else
choose **Other**, pick one of five drawings (leafy, trailing vine, succulent,
upright spiky, small tree) and fill in its care yourself.

## The dashboard card

The integration loads the card for you. Add it to a dashboard with:

```yaml
type: custom:plant-tracker-card
title: My plants   # optional
```

| Option | Default | What it does |
| --- | --- | --- |
| `title` | none | Heading above the plants. |
| `limbs` | `true` | Little arms and feet on each pot. |
| `entities` | all plants | A list of `sensor.<plant>_status` ids, to show only some plants. |

- New plants appear on their own, sorted by how soon they need water.
- The **watering can** marks a plant as watered, with **Undo** in the pop-up
  message.
- **Tap a plant** for its photo, care notes, room temperature and moisture, and
  a **Watered** button.

![Plant details](docs/details.jpg)

## Reminders

[`blueprints/automation/plant_tracker/water_reminder.yaml`](blueprints/automation/plant_tracker/water_reminder.yaml)
sends one notification per plant that needs water, once a day at a time you
choose (9:00 by default), each with a **Watered** button. It can also warn when
a room is too cold or hot for a plant. It finds your plants itself, so new
plants need no changes.

To use it, copy the file to `<config>/blueprints/automation/plant_tracker/` (or
import it by URL once this repository is on GitHub), then **Settings →
Automations & scenes → Blueprints → Plant Tracker – water reminders → Create
automation** and pick your phone. Notifications need the Home Assistant
Companion app.

## Development

```bash
uv venv --python 3.13 .venv
uv pip install --python .venv/bin/python pytest-homeassistant-custom-component
.venv/bin/python -m pytest
uvx ruff check .
```

- `custom_components/plant_tracker/frontend/art/` draws the plants;
  `preview/index.html` shows every drawing with a watering-day slider (serve the
  project folder over HTTP and open `/preview/`).
- After editing `strings.json`, run `python3 tools/build_translations.py` to
  regenerate `translations/en.json`.
- `dev/` (not committed) holds a throwaway local Home Assistant for trying the
  integration end to end; see `dev/README.md`.
