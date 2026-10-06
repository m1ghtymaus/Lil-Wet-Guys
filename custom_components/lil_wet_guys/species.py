"""Care presets for the plants Lil Wet Guys knows how to draw.

Ids must match frontend/art/species.js. Fertilizer doses are Foliage Focus per
litre: 3 ml for slow growers that are easily burned (succulents, snake plants,
peperomias), 5 ml for fast-growing aroids and alocasias, 4 ml for the rest and
none for moss, which takes what it needs from water and air. Watering intervals are for bright,
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
    feed_ml: int = 4  # Foliage Focus per litre of water (the label says 3-5); 0 = don't feed

    @property
    def label(self) -> str:
        """How the plant type is shown: Common Name (Scientific name)."""
        return f"{self.name} ({self.latin})" if self.latin else self.name


SPECIES: dict[str, Species] = {
    "arrowhead_plant": Species(
        "Arrowhead Plant", "Syngonium podophyllum", "bright_indirect", 7, 60, 85,
        "Water when the top inch of soil is dry.",
    ),
    "asparagus_fern": Species(
        "Asparagus Fern", "Asparagus densiflorus 'Sprengeri'", "bright_indirect", 5, 50, 80,
        "Keep the soil evenly moist.",
    ),
    "banana_plant": Species(
        "Banana Plant", "Musa spp.", "direct", 3, 65, 85,
        "Keep the soil moist; it drinks a lot in warm weather.",
        feed_ml=5,
    ),
    "cylindrical_snake_plant": Species(
        "Cylindrical Snake Plant", "Dracaena angolensis", "medium", 21, 60, 85,
        "Let the soil dry out completely between waterings.",
        feed_ml=3,
    ),
    "dragon_tree": Species(
        "Dragon Tree", "Dracaena marginata", "bright_indirect", 12, 65, 80,
        "Water when the top half of the soil is dry.",
        feed_ml=3,
    ),
    "easter_cactus": Species(
        "Easter Cactus", "Schlumbergera gaertneri", "bright_indirect", 8, 60, 75,
        "Water when the top inch is dry. Cool nights help it bloom.",
        feed_ml=3,
    ),
    "gasteria": Species(
        "Ox Tongue", "Gasteria spp.", "bright_indirect", 16, 60, 80,
        "Let the soil dry out completely between waterings.",
        feed_ml=3,
    ),
    "golden_pothos": Species(
        "Golden Pothos", "Epipremnum aureum", "medium", 8, 60, 85,
        "Water when the top 1–2 inches of soil are dry.",
        feed_ml=5,
    ),
    "heartleaf_philodendron": Species(
        "Heartleaf Philodendron", "Philodendron hederaceum", "bright_indirect", 8, 60, 85,
        "Water when the top inch of soil is dry.",
        feed_ml=5,
    ),
    "lipstick_plant": Species(
        "Lipstick Plant", "Aeschynanthus radicans", "bright_indirect", 6, 65, 80,
        "Keep the soil lightly moist.",
    ),
    "lucky_bamboo": Species(
        "Lucky Bamboo", "Dracaena sanderiana", "medium", 6, 65, 90,
        "In water, refresh it weekly. In soil, keep it moist.",
        feed_ml=3,
    ),
    "monkey_mask": Species(
        "Monkey Mask", "Monstera adansonii", "bright_indirect", 7, 60, 85,
        "Water when the top inch is dry. Likes humidity.",
        feed_ml=5,
    ),
    "peperomia": Species(
        "Radiator Plant", "Peperomia spp.", "bright_indirect", 10, 65, 80,
        "Let most of the soil dry out between waterings.",
        feed_ml=3,
    ),
    "peperomia_hope": Species(
        "Hope Peperomia", "Peperomia 'Hope'", "bright_indirect", 12, 65, 80,
        "Let most of the soil dry out between waterings.",
        feed_ml=3,
    ),
    "pink_princess_philodendron": Species(
        "Pink Princess Philodendron", "Philodendron erubescens 'Pink Princess'", "bright_indirect", 7, 65, 85,
        "Water when the top inch of soil is dry.",
        feed_ml=5,
    ),
    "rubber_plant_ruby": Species(
        "Rubber Plant", "Ficus elastica 'Ruby'", "bright_indirect", 10, 60, 85,
        "Water when the top 2 inches of soil are dry.",
    ),
    "satin_pothos": Species(
        "Satin Pothos", "Scindapsus pictus", "bright_indirect", 10, 65, 85,
        "Let most of the soil dry out. Its leaves curl when it is thirsty.",
    ),
    "snake_plant_laurentii": Species(
        "Snake Plant", "Dracaena trifasciata 'Laurentii'", "medium", 21, 60, 85,
        "Let the soil dry out completely between waterings.",
        feed_ml=3,
    ),
    "snake_plant_zeylanica": Species(
        "Snake Plant", "Dracaena trifasciata 'Zeylanica'", "medium", 21, 60, 85,
        "Let the soil dry out completely between waterings.",
        feed_ml=3,
    ),
    "snake_plant_moonshine": Species(
        "Snake Plant", "Dracaena trifasciata 'Moonshine'", "medium", 21, 60, 85,
        "Let the soil dry out completely between waterings.",
        feed_ml=3,
    ),
    "spider_plant": Species(
        "Spider Plant", "Chlorophytum comosum", "bright_indirect", 7, 55, 80,
        "Water when the top inch of soil is dry.",
        feed_ml=3,
    ),
    "split_leaf_philodendron": Species(
        "Split-Leaf Philodendron", "Thaumatophyllum bipinnatifidum", "bright_indirect", 7, 60, 85,
        "Water when the top inch of soil is dry.",
        feed_ml=5,
    ),
    "tiger_aloe": Species(
        "Tiger Aloe", "Gonialoe variegata", "bright_indirect", 18, 55, 85,
        "Let the soil dry out completely between waterings.",
        feed_ml=3,
    ),
    "tiger_tooth_aloe": Species(
        "Tiger Tooth Aloe", "Aloe juvenna", "bright_indirect", 18, 50, 85,
        "Let the soil dry out completely between waterings.",
        feed_ml=3,
    ),
    "umbrella_plant": Species(
        "Umbrella Plant", "Schefflera arboricola", "bright_indirect", 9, 60, 80,
        "Water when the top 1–2 inches of soil are dry.",
    ),
    "variegated_peperomia": Species(
        "Variegated Baby Rubber Plant", "Peperomia obtusifolia 'Variegata'", "bright_indirect", 10, 65, 80,
        "Let most of the soil dry out between waterings.",
        feed_ml=3,
    ),
    "weeping_fig": Species(
        "Weeping Fig", "Ficus benjamina", "bright_indirect", 7, 60, 80,
        "Water when the top inch is dry. Keep it away from drafts.",
    ),
    "zz_plant": Species(
        "ZZ Plant", "Zamioculcas zamiifolia", "medium", 18, 60, 85,
        "Let the soil dry out completely between waterings.",
        feed_ml=3,
    ),
    "epipremnum_pinnatum": Species(
        "Dragon Tail Plant", "Epipremnum pinnatum", "bright_indirect", 8, 60, 85,
        "Water when the top 1–2 inches of soil are dry.",
        feed_ml=5,
    ),
    "inch_plant": Species(
        "Inch Plant", "Tradescantia zebrina", "bright_indirect", 6, 60, 80,
        "Keep the soil lightly moist; water when the top inch is dry.",
    ),
    "white_bird_of_paradise": Species(
        "White Bird of Paradise", "Strelitzia nicolai", "bright_indirect", 8, 65, 85,
        "Water when the top 2 inches are dry. Give it as much light as you can.",
        feed_ml=5,
    ),
    "monstera_deliciosa": Species(
        "Swiss Cheese Plant", "Monstera deliciosa", "bright_indirect", 8, 65, 85,
        "Water when the top 2 inches of soil are dry.",
        feed_ml=5,
    ),
    "monstera_thai_constellation": Species(
        "Thai Constellation Monstera", "Monstera deliciosa 'Thai Constellation'", "bright_indirect", 8, 65, 85,
        "Water when the top 2 inches are dry. Bright light keeps the speckles strong.",
        feed_ml=5,
    ),
    "zz_plant_raven": Species(
        "Black Raven ZZ Plant", "Zamioculcas zamiifolia 'Raven'", "medium", 18, 60, 85,
        "Let the soil dry out completely between waterings.",
        feed_ml=3,
    ),
    "jade_pothos": Species(
        "Jade Pothos", "Epipremnum aureum 'Jade'", "medium", 8, 60, 85,
        "Water when the top 1–2 inches of soil are dry.",
        feed_ml=5,
    ),
    "alocasia_frydek": Species(
        "Green Velvet Alocasia", "Alocasia micholitziana 'Frydek'", "bright_indirect", 6, 65, 85,
        "Water when the top inch is dry; keep it lightly moist, never soggy. Hates cold drafts.",
        feed_ml=5,
    ),
    "money_tree": Species(
        "Money Tree", "Pachira aquatica", "bright_indirect", 10, 60, 85,
        "Water when the top 2 inches of soil are dry.",
    ),
    "mini_monstera": Species(
        "Mini Monstera", "Rhaphidophora tetrasperma", "bright_indirect", 7, 60, 85,
        "Water when the top 1–2 inches of soil are dry.",
        feed_ml=5,
    ),
    "nerve_plant": Species(
        "Nerve Plant", "Fittonia albivenis", "medium", 4, 60, 80,
        "Keep the soil evenly moist. It flops dramatically when thirsty and perks up after a drink.",
    ),
    "persian_shield": Species(
        "Persian Shield", "Strobilanthes dyerianus", "bright_indirect", 5, 60, 80,
        "Keep the soil lightly moist; water when the top inch is dry. Bright light keeps the purple vivid.",
    ),
    "purple_passion": Species(
        "Purple Passion Plant", "Gynura aurantiaca", "bright_indirect", 7, 60, 75,
        "Water when the top inch is dry, at the soil rather than on its fuzzy leaves.",
    ),
    "alocasia_polly": Species(
        "African Mask Plant", "Alocasia × amazonica 'Polly'", "bright_indirect", 7, 65, 85,
        "Water when the top 1–2 inches are dry. Likes humidity and hates cold drafts.",
        feed_ml=5,
    ),
    "alocasia_chienlii": Species(
        "Elephant Ear", "Alocasia chienlii", "bright_indirect", 7, 65, 85,
        "Water when the top inch is dry; keep it humid and away from cold drafts.",
        feed_ml=5,
    ),
    "alocasia_regal_shield": Species(
        "Regal Shield", "Alocasia 'Regal Shield'", "bright_indirect", 6, 65, 85,
        "Water when the top 2 inches are dry. Drinks more in summer, less in winter; keep it warm and humid.",
        feed_ml=5,
    ),
    "moss_terrarium": Species(
        "Moss Terrarium", "Bryophyta", "medium", 14, 60, 75,
        "Mist lightly when the moss looks pale or the glass stops fogging up. Keep it out of direct sun.",
        feed_ml=0,
    ),
    "million_hearts_variegated": Species(
        "Variegated Million Hearts", "Dischidia ruscifolia 'Variegata'", "bright_indirect", 10, 60, 85,
        "Let the mix dry out between waterings; it stores water in its leaves.",
        feed_ml=3,
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

OTHER = Species("Other Plant", "", "bright_indirect", 7, 60, 80, "")
