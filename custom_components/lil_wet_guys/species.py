"""Care presets for the plants Lil Wet Guys knows how to draw.

Ids must match frontend/art/species.js. Watering intervals are for bright,
indirect light; the light setting stretches or shortens them. Temperatures are
°F because that is how the presets were written; they are converted on use.
These are starting points: every value can be changed per plant.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Species:
    """Care defaults for one kind of plant."""

    name: str
    latin: str
    light: str  # default light level for the add-plant form
    base_days: float
    temp_min_f: int
    temp_max_f: int
    note: str


SPECIES: dict[str, Species] = {
    "arrowhead_plant": Species(
        "Arrowhead plant", "Syngonium podophyllum", "bright_indirect", 7, 60, 85,
        "Water when the top inch of soil is dry.",
    ),
    "asparagus_fern": Species(
        "Asparagus fern 'Sprengeri'", "Asparagus densiflorus 'Sprengeri'", "bright_indirect", 5, 50, 80,
        "Keep the soil evenly moist.",
    ),
    "banana_plant": Species(
        "Banana plant", "Musa spp.", "direct", 3, 65, 85,
        "Keep the soil moist; it drinks a lot in warm weather.",
    ),
    "cylindrical_snake_plant": Species(
        "Cylindrical snake plant", "Dracaena angolensis", "medium", 21, 60, 85,
        "Let the soil dry out completely between waterings.",
    ),
    "dragon_tree": Species(
        "Dragon tree", "Dracaena marginata", "bright_indirect", 12, 65, 80,
        "Water when the top half of the soil is dry.",
    ),
    "easter_cactus": Species(
        "Easter cactus", "Schlumbergera gaertneri", "bright_indirect", 8, 60, 75,
        "Water when the top inch is dry. Cool nights help it bloom.",
    ),
    "gasteria": Species(
        "Gasteria", "Gasteria spp.", "bright_indirect", 16, 60, 80,
        "Let the soil dry out completely between waterings.",
    ),
    "golden_pothos": Species(
        "Golden pothos", "Epipremnum aureum", "medium", 8, 60, 85,
        "Water when the top 1–2 inches of soil are dry.",
    ),
    "heartleaf_philodendron": Species(
        "Heartleaf philodendron", "Philodendron hederaceum", "bright_indirect", 8, 60, 85,
        "Water when the top inch of soil is dry.",
    ),
    "lipstick_plant": Species(
        "Lipstick plant", "Aeschynanthus radicans", "bright_indirect", 6, 65, 80,
        "Keep the soil lightly moist.",
    ),
    "lucky_bamboo": Species(
        "Lucky bamboo", "Dracaena sanderiana", "medium", 6, 65, 90,
        "In water, refresh it weekly. In soil, keep it moist.",
    ),
    "monkey_mask": Species(
        "Monkey mask", "Monstera adansonii", "bright_indirect", 7, 60, 85,
        "Water when the top inch is dry. Likes humidity.",
    ),
    "peperomia": Species(
        "Peperomia", "Peperomia spp.", "bright_indirect", 10, 65, 80,
        "Let most of the soil dry out between waterings.",
    ),
    "peperomia_hope": Species(
        "Peperomia 'Hope'", "Peperomia 'Hope'", "bright_indirect", 12, 65, 80,
        "Let most of the soil dry out between waterings.",
    ),
    "pink_princess_philodendron": Species(
        "Pink Princess philodendron", "Philodendron erubescens 'Pink Princess'", "bright_indirect", 7, 65, 85,
        "Water when the top inch of soil is dry.",
    ),
    "rubber_plant_ruby": Species(
        "Rubber plant 'Ruby'", "Ficus elastica 'Ruby'", "bright_indirect", 10, 60, 85,
        "Water when the top 2 inches of soil are dry.",
    ),
    "satin_pothos": Species(
        "Satin pothos", "Scindapsus pictus", "bright_indirect", 10, 65, 85,
        "Let most of the soil dry out. Its leaves curl when it is thirsty.",
    ),
    "snake_plant_laurentii": Species(
        "Snake plant 'Laurentii'", "Dracaena trifasciata 'Laurentii'", "medium", 21, 60, 85,
        "Let the soil dry out completely between waterings.",
    ),
    "snake_plant_zeylanica": Species(
        "Snake plant 'Zeylanica'", "Dracaena trifasciata 'Zeylanica'", "medium", 21, 60, 85,
        "Let the soil dry out completely between waterings.",
    ),
    "snake_plant_moonshine": Species(
        "Snake plant 'Moonshine'", "Dracaena trifasciata 'Moonshine'", "medium", 21, 60, 85,
        "Let the soil dry out completely between waterings.",
    ),
    "spider_plant": Species(
        "Spider plant", "Chlorophytum comosum", "bright_indirect", 7, 55, 80,
        "Water when the top inch of soil is dry.",
    ),
    "split_leaf_philodendron": Species(
        "Split-leaf philodendron", "Thaumatophyllum bipinnatifidum", "bright_indirect", 7, 60, 85,
        "Water when the top inch of soil is dry.",
    ),
    "tiger_aloe": Species(
        "Tiger aloe", "Gonialoe variegata", "bright_indirect", 18, 55, 85,
        "Let the soil dry out completely between waterings.",
    ),
    "tiger_tooth_aloe": Species(
        "Tiger tooth aloe", "Aloe juvenna", "bright_indirect", 18, 50, 85,
        "Let the soil dry out completely between waterings.",
    ),
    "umbrella_plant": Species(
        "Umbrella plant", "Schefflera arboricola", "bright_indirect", 9, 60, 80,
        "Water when the top 1–2 inches of soil are dry.",
    ),
    "variegated_peperomia": Species(
        "Variegated peperomia", "Peperomia obtusifolia 'Variegata'", "bright_indirect", 10, 65, 80,
        "Let most of the soil dry out between waterings.",
    ),
    "weeping_fig": Species(
        "Weeping fig", "Ficus benjamina", "bright_indirect", 7, 60, 80,
        "Water when the top inch is dry. Keep it away from drafts.",
    ),
    "zz_plant": Species(
        "ZZ plant", "Zamioculcas zamiifolia", "medium", 18, 60, 85,
        "Let the soil dry out completely between waterings.",
    ),
    "epipremnum_pinnatum": Species(
        "Epipremnum pinnatum", "Epipremnum pinnatum", "bright_indirect", 8, 60, 85,
        "Water when the top 1–2 inches of soil are dry.",
    ),
    "inch_plant": Species(
        "Inch plant", "Tradescantia zebrina", "bright_indirect", 6, 60, 80,
        "Keep the soil lightly moist; water when the top inch is dry.",
    ),
    "white_bird_of_paradise": Species(
        "White bird of paradise", "Strelitzia nicolai", "bright_indirect", 8, 65, 85,
        "Water when the top 2 inches are dry. Give it as much light as you can.",
    ),
    "monstera_deliciosa": Species(
        "Monstera deliciosa", "Monstera deliciosa", "bright_indirect", 8, 65, 85,
        "Water when the top 2 inches of soil are dry.",
    ),
    "monstera_thai_constellation": Species(
        "Thai Constellation monstera", "Monstera deliciosa 'Thai Constellation'", "bright_indirect", 8, 65, 85,
        "Water when the top 2 inches are dry. Bright light keeps the speckles strong.",
    ),
    "zz_plant_raven": Species(
        "Black Raven ZZ plant", "Zamioculcas zamiifolia 'Raven'", "medium", 18, 60, 85,
        "Let the soil dry out completely between waterings.",
    ),
    "jade_pothos": Species(
        "Jade pothos", "Epipremnum aureum 'Jade'", "medium", 8, 60, 85,
        "Water when the top 1–2 inches of soil are dry.",
    ),
    "alocasia_frydek": Species(
        "Alocasia 'Frydek'", "Alocasia micholitziana 'Frydek'", "bright_indirect", 6, 65, 85,
        "Water when the top inch is dry; keep it lightly moist, never soggy. Hates cold drafts.",
    ),
    "money_tree": Species(
        "Money tree", "Pachira aquatica", "bright_indirect", 10, 60, 85,
        "Water when the top 2 inches of soil are dry.",
    ),
    "mini_monstera": Species(
        "Mini monstera", "Rhaphidophora tetrasperma", "bright_indirect", 7, 60, 85,
        "Water when the top 1–2 inches of soil are dry.",
    ),
    "nerve_plant": Species(
        "Nerve plant", "Fittonia albivenis", "medium", 4, 60, 80,
        "Keep the soil evenly moist. It flops dramatically when thirsty and perks up after a drink.",
    ),
    "million_hearts_variegated": Species(
        "Variegated million hearts", "Dischidia ruscifolia 'Variegata'", "bright_indirect", 10, 60, 85,
        "Let the mix dry out between waterings; it stores water in its leaves.",
    ),
}

# Drawing shapes offered for a plant without a preset.
GENERIC_SHAPES: list[str] = [
    "generic_leafy",
    "generic_trailing",
    "generic_succulent",
    "generic_spiky",
    "generic_tree",
]

OTHER = Species("Other plant", "", "bright_indirect", 7, 60, 80, "")
