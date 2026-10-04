// How each species is drawn: a rig plus its parameters. Care data (watering,
// light, temperature) lives in the integration's species.py; ids must match.

export const SPECIES = {
  arrowhead_plant: {
    name: 'Arrowhead plant', latin: 'Syngonium podophyllum', rig: 'upright_leaf',
    count: 7, len: [34, 70], spread: 0.95, tilt: 0.45, stem: '#86b565',
    leaf: { shape: 'arrow', L: 36, W: 30, color: '#6aa84f', vari: '#dff0cc', variType: 'veins', rib: false },
  },
  asparagus_fern: {
    name: "Asparagus fern 'Sprengeri'", latin: "Asparagus densiflorus 'Sprengeri'", rig: 'bushy', form: 'fern',
    count: 14, stem: '#6f9a3a', dryHue: 50,
    leaf: { color: '#7cb342' },
  },
  banana_plant: {
    name: 'Banana plant', latin: 'Musa spp.', rig: 'canes', form: 'banana', scale: 0.96,
    trunk: 74, trunkColor: '#9dbb5f', len: [70, 92], W: 29, leafAngles: [-1.1, -0.45, 0.5, 1.12],
    strap: { color: '#6fb24a', rib: '#dcebb0', veins: 10, tears: true, scorch: true },
  },
  cylindrical_snake_plant: {
    name: 'Cylindrical snake plant', latin: 'Dracaena angolensis', rig: 'spikes',
    count: 6, len: [72, 128], width: 9.5, spread: 0.75, base: 14, curl: 0.15, lean: 0.4, flop: 0.35,
    profile: 'spike', drop: 0,
    strap: {
      color: '#58795a', tip: 'round', cap: '#8b6a4a', highlight: true, groove: true, wrinkle: true,
      bands: { n: 9, color: '#9dbb97', ring: true, w: 1.3 },
    },
  },
  dragon_tree: {
    name: 'Dragon tree', latin: 'Dracaena marginata', rig: 'canes', form: 'dragon',
    cane: '#8a7663', crown: 15, crownLen: [24, 38], stripW: 4.8,
    canes: [{ x: -9, h: 72, a: -0.2 }, { x: 11, h: 128, a: 0.1 }, { x: 2, h: 100, a: -0.03 }],
    strap: { color: '#3a6b35', edge: '#b8394e', edgeScale: 0.5, tips: true },
  },
  easter_cactus: {
    name: 'Easter cactus', latin: 'Schlumbergera gaertneri', rig: 'bushy', form: 'cactus',
    count: 7, flower: '#e2485a', dryHue: 350,
    leaf: { shape: 'segment', L: 21, W: 15, color: '#4f8a45', vari: '#9c4a55', variType: 'edge', edgeScale: 0.78, rib: false },
  },
  gasteria: {
    name: 'Gasteria', latin: 'Gasteria spp.', rig: 'sword',
    count: 8, len: [42, 66], width: 15.5, fanned: true, spread: 0.95, base: 6, curl: 0.2, lean: 0.25, flop: 0.2,
    profile: 'tongue', drop: 0, dryHue: 20,
    strap: { color: '#35523a', tip: 'round', wrinkle: true, spots: { n: 11, color: '#e6efe0', r: 1.3 } },
  },
  golden_pothos: {
    name: 'Golden pothos', latin: 'Epipremnum aureum', rig: 'trailing',
    top: 8, topLen: 26, vines: 4, vineLen: 74, perVine: 7, stem: '#6a9a3f',
    leaf: { shape: 'heart', L: 22, W: 18, color: '#3f8f3a', vari: '#ecd95a', variType: 'streaks', gloss: true },
  },
  heartleaf_philodendron: {
    name: 'Heartleaf philodendron', latin: 'Philodendron hederaceum', rig: 'trailing',
    top: 8, topLen: 24, vines: 4, vineLen: 78, perVine: 8, stem: '#5f8f3a',
    leaf: { shape: 'heart', L: 18, W: 14, color: '#2f7d32', gloss: true },
  },
  lipstick_plant: {
    name: 'Lipstick plant', latin: 'Aeschynanthus radicans', rig: 'trailing',
    top: 9, topLen: 22, vines: 4, vineLen: 76, perVine: 9, stem: '#6b5a3a', flowers: '#d22e3a',
    leaf: { shape: 'lance', L: 16, W: 9, color: '#2f6b2f', gloss: true },
  },
  lucky_bamboo: {
    name: 'Lucky bamboo', latin: 'Dracaena sanderiana', rig: 'canes', form: 'bamboo', dryHue: 52,
    stalk: '#9cc05a', stalks: [{ x: -14, h: 62 }, { x: 14, h: 90 }, { x: 0, h: 116 }],
    leaf: { color: '#5fa13f', tips: true },
  },
  monkey_mask: {
    name: 'Monkey mask', latin: 'Monstera adansonii', rig: 'trailing',
    top: 6, topLen: 30, vines: 3, vineLen: 74, perVine: 5, stem: '#5f8f3a',
    leaf: { shape: 'holes', L: 30, W: 21, color: '#3f8a3a', rib: true },
  },
  peperomia: {
    name: 'Peperomia', latin: 'Peperomia spp.', rig: 'bushy', form: 'peperomia',
    count: 9, stem: '#6f9a4a',
    leaf: { shape: 'heart', L: 23, W: 21, color: '#2f5a2c', variType: 'ripple', gloss: true },
  },
  peperomia_hope: {
    name: "Peperomia 'Hope'", latin: "Peperomia 'Hope'", rig: 'trailing',
    top: 8, topLen: 20, vines: 4, vineLen: 60, perVine: 7, pairs: true, stem: '#7a8f4a',
    leaf: { shape: 'round', L: 9.5, W: 9, color: '#4f8a3a', vari: '#9cc58a', variType: 'streaks', rib: false, gloss: true },
  },
  pink_princess_philodendron: {
    name: 'Pink Princess philodendron', latin: "Philodendron erubescens 'Pink Princess'", rig: 'tree', form: 'climber',
    h: 104, count: 6, stem: '#7a3b4a', root: '#8a6a50', young: '#e67fa3',
    leaf: { shape: 'heart', L: 43, W: 28, color: '#2d3f28', vari: '#f08fb0', variType: 'splash', ribColor: '#5a3a48', gloss: true },
  },
  rubber_plant_ruby: {
    name: "Rubber plant 'Ruby'", latin: "Ficus elastica 'Ruby'", rig: 'tree', form: 'rubber',
    h: 100, count: 7, trunk: '#7a6a4f', sheath: '#c2344d',
    leaf: { shape: 'oval', L: 52, W: 33, color: '#3b5f3a', vari: '#f1d2c6', variType: 'edge', edgeScale: 0.74, ribColor: '#d0607a', gloss: true },
  },
  satin_pothos: {
    name: 'Satin pothos', latin: 'Scindapsus pictus', rig: 'trailing',
    top: 9, topLen: 24, tuft: 5, vines: 3, vineLen: 74, perVine: 7, stem: '#58704a',
    leaf: { shape: 'heart', L: 21, W: 15, color: '#2e5a3e', vari: '#c3d3cf', variType: 'spots', curl: 1.8 },
  },
  snake_plant_laurentii: {
    name: "Snake plant 'Laurentii'", latin: "Dracaena trifasciata 'Laurentii'", rig: 'sword',
    count: 7, len: [86, 136], width: 16, spread: 0.36, base: 22, flop: 0.3, drop: 0,
    strap: {
      color: '#2f5d3a', edge: '#d8c85a', edgeScale: 0.78, wrinkle: true,
      bands: { n: 9, color: '#86ab80', w: 1.4 },
    },
  },
  snake_plant_zeylanica: {
    name: "Snake plant 'Zeylanica'", latin: "Dracaena trifasciata 'Zeylanica'", rig: 'sword',
    count: 8, len: [80, 128], width: 13.5, spread: 0.4, base: 22, flop: 0.3, drop: 0,
    strap: {
      color: '#27432e', edge: '#6b4a3a', edgeScale: 0.9, wrinkle: true,
      bands: { n: 13, color: '#a6c3a0', w: 1.7 },
    },
  },
  snake_plant_moonshine: {
    name: "Snake plant 'Moonshine'", latin: "Dracaena trifasciata 'Moonshine'", rig: 'sword',
    count: 5, len: [72, 112], width: 21, spread: 0.4, base: 17, flop: 0.3, drop: 0,
    strap: {
      color: '#b3cbbb', edge: '#3f6b4a', edgeScale: 0.9, wrinkle: true,
      bands: { n: 6, color: '#c9dccf', w: 1.3 },
    },
  },
  spider_plant: {
    name: 'Spider plant', latin: 'Chlorophytum comosum', rig: 'arching',
    count: 14, len: [36, 72], width: 7, runners: 2, drop: 0.25,
    strap: { color: '#4f9a3f', stripe: '#f1f0d6', tips: true },
  },
  split_leaf_philodendron: {
    name: 'Split-leaf philodendron', latin: 'Thaumatophyllum bipinnatifidum', rig: 'upright_leaf', scale: 0.95,
    count: 5, len: [30, 62], spread: 1.05, tilt: 0.75, stem: '#6c8f45', stemW: 3,
    leaf: { shape: 'lobed', L: 56, W: 54, lobes: 5, depth: 0.55, color: '#3f7f3a', gloss: true },
  },
  tiger_aloe: {
    name: 'Tiger aloe', latin: 'Gonialoe variegata', rig: 'rosette',
    count: 9, len: [30, 56], width: 21, spread: 1.2, dryHue: 12, profile: 'plump',
    strap: { color: '#3f5f3a', edge: '#f0f1e6', edgeScale: 0.84, dashes: { n: 4, color: '#e9efe3' } },
  },
  tiger_tooth_aloe: {
    name: 'Tiger tooth aloe', latin: 'Aloe juvenna', rig: 'rosette',
    count: 10, len: [34, 56], width: 15, spread: 0.95, clusters: 3, dryHue: 12, profile: 'plump',
    strap: { color: '#5f9a45', teeth: { n: 4, color: '#f4f4ea', size: 2.6 }, spots: { n: 6, color: '#eef3e2', r: 1 } },
  },
  umbrella_plant: {
    name: 'Umbrella plant', latin: 'Schefflera arboricola', rig: 'tree', form: 'umbrella',
    stem: '#6f7a45', petiole: '#86a04a', leaflets: 8,
    stems: [{ x: -9, h: 74, a: -0.2 }, { x: 11, h: 56, a: 0.3 }, { x: 1, h: 98, a: 0.03 }],
    leaf: { shape: 'obovate', L: 23, W: 9.5, color: '#3f7d34', gloss: true },
  },
  variegated_peperomia: {
    name: 'Variegated peperomia', latin: "Peperomia obtusifolia 'Variegata'", rig: 'bushy', form: 'obtusifolia',
    count: 3, stem: '#8aa35a',
    leaf: { shape: 'round', L: 22, W: 19, color: '#5a8a3c', vari: '#efe6b0', variType: 'edge', gloss: true },
  },
  weeping_fig: {
    name: 'Weeping fig', latin: 'Ficus benjamina', rig: 'tree', form: 'fig', dryHue: 50, drop: 0.6,
    h: 74, branches: 9, trunk: '#9b8565',
    leaf: { shape: 'lance', L: 15, W: 8, color: '#3e7b36', gloss: true },
  },
  zz_plant: {
    name: 'ZZ plant', latin: 'Zamioculcas zamiifolia', rig: 'canes', form: 'zz', drop: 0.3,
    count: 6, len: [56, 102], leaflets: 8, stem: '#4c7a37',
    leaf: { shape: 'oval', L: 17.5, W: 9.5, color: '#2f5f2a', gloss: true, rib: false },
  },

  epipremnum_pinnatum: {
    name: 'Epipremnum pinnatum', latin: 'Epipremnum pinnatum', rig: 'trailing',
    top: 7, topLen: 26, vines: 4, vineLen: 74, perVine: 6, stem: '#5f8a4a',
    leaf: { shape: 'heart', L: 25, W: 14, color: '#4f8c6a', gloss: true },
  },
  inch_plant: {
    name: 'Inch plant', latin: 'Tradescantia zebrina', rig: 'trailing',
    top: 8, topLen: 22, vines: 4, vineLen: 72, perVine: 7, stem: '#7a4a7f',
    leaf: { shape: 'lance', L: 21, W: 12.5, color: '#6b3d78', vari: '#c9d6d6', variType: 'zebra', rib: false, gloss: true },
  },
  white_bird_of_paradise: {
    name: 'White bird of paradise', latin: 'Strelitzia nicolai', rig: 'canes', form: 'bird',
    count: 5, spread: 0.6, stalk: [44, 80], len: [44, 60], W: 24, stalkColor: '#6f9455',
    strap: { color: '#4f8758', rib: '#c9dcb0', veins: 9, tears: true, scorch: true },
  },
  monstera_deliciosa: {
    name: 'Monstera deliciosa', latin: 'Monstera deliciosa', rig: 'upright_leaf', scale: 0.95,
    count: 5, len: [36, 70], spread: 1.0, tilt: 0.7, stem: '#5f8f3a', stemW: 3.2,
    leaf: { shape: 'monstera', L: 50, W: 50, slits: 4, color: '#2f6f34' },
  },
  monstera_thai_constellation: {
    name: 'Thai Constellation monstera', latin: "Monstera deliciosa 'Thai Constellation'", rig: 'upright_leaf', scale: 0.95,
    count: 5, len: [36, 70], spread: 1.0, tilt: 0.7, stem: '#7c9a5a', stemW: 3.2,
    leaf: { shape: 'monstera', L: 50, W: 50, slits: 4, color: '#2b6631', vari: '#f3eed6', variType: 'constellation', gloss: true },
  },
  zz_plant_raven: {
    name: 'Black Raven ZZ plant', latin: "Zamioculcas zamiifolia 'Raven'", rig: 'canes', form: 'zz', drop: 0.3,
    count: 6, len: [56, 102], leaflets: 8, stem: '#2c3627',
    leaf: { shape: 'oval', L: 17.5, W: 9.5, color: '#36452f', gloss: true, rib: false },
  },
  jade_pothos: {
    name: 'Jade pothos', latin: "Epipremnum aureum 'Jade'", rig: 'trailing',
    top: 8, topLen: 26, vines: 4, vineLen: 74, perVine: 7, stem: '#5a8a3a',
    leaf: { shape: 'heart', L: 22, W: 18, color: '#2c7a3c', gloss: true },
  },
  alocasia_frydek: {
    name: "Alocasia 'Frydek'", latin: "Alocasia micholitziana 'Frydek'", rig: 'upright_leaf',
    count: 5, len: [44, 80], spread: 0.8, tilt: 0.85, stem: '#6a8a52', stemW: 2.6,
    leaf: { shape: 'arrow', L: 46, W: 30, color: '#1f4029', vari: '#b9cc8a', variType: 'ribs', veins: 4, veinW: 0.6, rib: false },
  },
  money_tree: {
    name: 'Money tree', latin: 'Pachira aquatica', rig: 'tree', form: 'umbrella', braid: 46,
    trunk: '#a08d6a', stem: '#7f8a50', petiole: '#7fa452', leaflets: 5, wheel: 2.1,
    stems: [{ x: -6, h: 42, a: -0.55 }, { x: 6, h: 36, a: 0.6 }, { x: 0, h: 54, a: 0.04 }],
    leaf: { shape: 'elliptic', L: 32, W: 11, color: '#4c9a3e', gloss: true },
  },
  mini_monstera: {
    name: 'Mini monstera', latin: 'Rhaphidophora tetrasperma', rig: 'tree', form: 'climber',
    h: 100, count: 7, stem: '#5f8f3a', root: '#8a6a50', young: '#9bd06a',
    leaf: { shape: 'monstera', L: 40, W: 27, slits: 3, depth: 0.1, gap: 0.06, windows: false, color: '#3a8540' },
  },
  nerve_plant: {
    name: 'Nerve plant', latin: 'Fittonia albivenis', rig: 'bushy', form: 'peperomia',
    count: 13, len: [12, 30], spread: 1.4, nodes: 1, stem: '#5f7f4a',
    leaf: { shape: 'oval', L: 21, W: 16.5, color: '#2a5a30', vari: '#eef3ea', variType: 'ribs', veins: 3, veinW: 0.6, net: true, rib: false },
  },
  persian_shield: {
    name: 'Persian shield', latin: 'Strobilanthes dyerianus', rig: 'bushy', form: 'obtusifolia', scale: 1.3,
    count: 4, stem: '#5e4a6e',
    leaf: { shape: 'serrate', L: 28, W: 12, color: '#3d6145', vari: '#2f4d38', purple: '#a058d8', silver: '#ecd6fa', variType: 'shield', rib: false, gloss: true },
  },
  purple_passion: {
    name: 'Purple passion plant', latin: 'Gynura aurantiaca', rig: 'bushy', form: 'gynura',
    count: 6, perStem: 5, stem: '#93408f',
    leaf: { shape: 'dentate', L: 24, W: 15, color: '#587a4a', vari: '#8e3a9a', variType: 'fuzz', ribColor: '#9a5aa0' },
  },
  alocasia_polly: {
    name: "Alocasia 'Polly'", latin: "Alocasia × amazonica 'Polly'", rig: 'upright_leaf',
    count: 5, len: [40, 72], spread: 0.8, tilt: 0.95, stem: '#5d7a4c', stemW: 2.4,
    leaf: { shape: 'polly', L: 40, W: 26, color: '#163522', vari: '#cfdcc6', variType: 'polly', rib: false, gloss: true },
  },
  alocasia_chienlii: {
    name: 'Alocasia chienlii', latin: 'Alocasia chienlii', rig: 'upright_leaf',
    count: 5, len: [34, 62], spread: 0.75, tilt: 0.9, stem: '#3b3833', stemW: 2.3,
    leaf: { shape: 'sagittate', L: 40, W: 24, color: '#191b1a', vari: '#6e655d', variType: 'char', ribColor: '#2b2d2b' },
  },
  alocasia_regal_shield: {
    name: "Alocasia 'Regal Shield'", latin: "Alocasia 'Regal Shield'", rig: 'upright_leaf',
    count: 4, len: [52, 86], spread: 0.95, tilt: 0.7, stem: '#4f4a36', stemW: 3,
    leaf: { shape: 'regal', L: 44, W: 34, color: '#1a2e1f', vari: '#4f7d44', variType: 'ribs', veins: 5, veinW: 0.7, rib: false },
  },
  moss_terrarium: {
    name: 'Moss terrarium', latin: 'Bryophyta', rig: 'terrarium', container: 'jar', still: true, dryHue: 45,
    moss: ['#5f9e3f', '#4b8634', '#79b24c'], lights: '#ffd56a', lid: '#a8743f',
  },
  million_hearts_variegated: {
    name: 'Variegated million hearts', latin: "Dischidia ruscifolia 'Variegata'", rig: 'trailing', form: 'strings',
    arches: 10, hangs: 8, spacing: 8.5, stem: '#7f8a5a',
    leaf: { shape: 'heart', L: 8.5, W: 8, color: '#4a8a40', vari: '#efe9cc', variType: 'edge', edgeScale: 0.62, rib: false },
  },

  // Shapes offered for plants without a preset.
  generic_leafy: {
    name: 'Leafy plant', rig: 'upright_leaf', generic: true,
    count: 7, len: [30, 62], spread: 0.95, tilt: 0.4, stem: '#6c9a45',
    leaf: { shape: 'oval', L: 30, W: 18, color: '#4a8a3c', gloss: true },
  },
  generic_trailing: {
    name: 'Trailing vine', rig: 'trailing', generic: true,
    top: 8, topLen: 24, vines: 4, vineLen: 74, perVine: 7, stem: '#6a9a3f',
    leaf: { shape: 'heart', L: 20, W: 16, color: '#3f8a3a', gloss: true },
  },
  generic_succulent: {
    name: 'Succulent', rig: 'rosette', generic: true,
    count: 9, len: [30, 50], width: 18, spread: 1.1, dryHue: 12, profile: 'plump',
    strap: { color: '#6a9a70' },
  },
  generic_spiky: {
    name: 'Upright spiky', rig: 'sword', generic: true,
    count: 7, len: [70, 118], width: 13, spread: 0.4, base: 20, drop: 0,
    strap: { color: '#3f6f45', wrinkle: true },
  },
  generic_tree: {
    name: 'Small tree', rig: 'tree', form: 'rubber', generic: true,
    h: 108, count: 7, trunk: '#7a6a4f', sheath: '#8fb86a',
    leaf: { shape: 'oval', L: 40, W: 23, color: '#3f7a38', gloss: true },
  },
};
