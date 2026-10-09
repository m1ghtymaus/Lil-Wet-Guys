// How each species is drawn: a rig plus its parameters. Care data (watering,
// light, temperature) lives in the integration's species.py; ids must match.

export const SPECIES = {
  arrowhead_plant: {
    name: 'Arrowhead Plant', latin: 'Syngonium podophyllum', rig: 'upright_leaf',
    count: 7, len: [34, 70], spread: 0.95, tilt: 0.45, stem: '#86b565', pups: 2, cap: 9,
    ages: { leaf: { shape: [[0, 'arrow'], [1.45, 'trifid']], variType: [[0, 'veins'], [1.45, 'none']], color: [[0, '#6aa84f'], [1.45, '#4a8a3e']] } },
    leaf: { shape: 'arrow', L: 36, W: 30, color: '#6aa84f', vari: '#dff0cc', variType: 'veins', rib: false },
  },
  asparagus_fern: {
    name: 'Asparagus Fern', latin: "Asparagus densiflorus 'Sprengeri'", rig: 'bushy', form: 'fern',
    count: 14, stem: '#6f9a3a', dryHue: 50,
    leaf: { color: '#7cb342' },
  },
  banana_plant: {
    name: 'Banana Plant', latin: 'Musa spp.', rig: 'canes', form: 'banana', scale: 0.96,
    trunk: 74, trunkColor: '#9dbb5f', len: [70, 92], W: 29, leafAngles: [-1.1, -0.45, 0.5, 1.12], pups: 2,
    strap: { color: '#6fb24a', rib: '#dcebb0', veins: 10, tears: true, scorch: true },
  },
  cylindrical_snake_plant: {
    name: 'Cylindrical Snake Plant', latin: 'Dracaena angolensis', rig: 'spikes',
    count: 6, len: [72, 128], width: 9.5, spread: 0.75, base: 14, curl: 0.15, lean: 0.4, flop: 0.35, pups: 2, bloomSpike: { len: 104, stalk: '#7a8a5a', color: '#eef0d8', tip: '#f8f4cc', n: 14, from: 0.4, size: 4.5, w: 2 },
    profile: 'spike', drop: 0,
    strap: {
      color: '#58795a', tip: 'round', cap: '#8b6a4a', highlight: true, groove: true, wrinkle: true,
      bands: { n: 9, color: '#9dbb97', ring: true, w: 1.3 },
    },
  },
  dragon_tree: {
    name: 'Dragon Tree', latin: 'Dracaena marginata', rig: 'canes', form: 'dragon',
    cane: '#8a7663', crown: 15, crownLen: [24, 38], stripW: 4.8,
    canes: [{ x: -9, h: 72, a: -0.2 }, { x: 11, h: 128, a: 0.1 }, { x: 2, h: 100, a: -0.03 }],
    strap: { color: '#3a6b35', edge: '#b8394e', edgeScale: 0.5, tips: true },
  },
  easter_cactus: {
    name: 'Easter Cactus', latin: 'Schlumbergera gaertneri', rig: 'bushy', form: 'cactus',
    count: 7, flower: '#e2485a', dryHue: 350, wobble: 0,
    leaf: { shape: 'segment', L: 21, W: 15, color: '#4f8a45', vari: '#9c4a55', variType: 'edge', edgeScale: 0.78, rib: false },
  },
  gasteria: {
    name: 'Ox Tongue', latin: 'Gasteria spp.', rig: 'sword',
    count: 8, len: [42, 66], width: 15.5, fanned: true, spread: 0.95, base: 6, curl: 0.2, lean: 0.25, flop: 0.2, pups: 3, raceme: { len: 80, stalk: '#7a5a5a', color: '#e88aa0', tip: '#9cc58a', n: 9, from: 0.5, arch: 1, size: 5.5, w: 2.6 },
    profile: 'tongue', drop: 0, dryHue: 20,
    strap: { color: '#35523a', tip: 'round', wrinkle: true, spots: { n: 11, color: '#e6efe0', r: 1.3 } },
  },
  golden_pothos: {
    name: 'Golden Pothos', latin: 'Epipremnum aureum', rig: 'trailing',
    top: 9, topLen: 30, topLeaves: 1, tuft: 4, vines: 5, vineLen: 74, perVine: 7, stem: '#6a9a3f', wobble: 0.38, roots: true, leafGrowth: 0.25,
    leaf: { shape: 'heart', L: 22, W: 18, color: '#3f8f3a', vari: '#ecd95a', variType: 'streaks', gloss: true },
  },
  heartleaf_philodendron: {
    name: 'Heartleaf Philodendron', latin: 'Philodendron hederaceum', rig: 'trailing',
    top: 11, topLen: 26, topLeaves: 1, tuft: 5, vines: 5, vineLen: 78, perVine: 9, stem: '#5f8f3a', roots: true, leafGrowth: 0.25,
    leaf: { shape: 'heart', L: 18, W: 14, color: '#2f7d32', gloss: true },
  },
  lipstick_plant: {
    name: 'Lipstick Plant', latin: 'Aeschynanthus radicans', rig: 'trailing',
    top: 15, topLen: 26, topLeaves: 2, tuft: 6, vines: 5, vineLen: 76, perVine: 11, stem: '#6b5a3a', flowers: '#d22e3a',
    leaf: { shape: 'lance', L: 16, W: 9, color: '#2f6b2f', gloss: true },
  },
  lucky_bamboo: {
    name: 'Lucky Bamboo', latin: 'Dracaena sanderiana', rig: 'canes', form: 'bamboo', dryHue: 52,
    stalk: '#9cc05a', stalks: [{ x: -14, h: 62 }, { x: 14, h: 90 }, { x: 0, h: 116 }],
    leaf: { color: '#5fa13f', tips: true },
  },
  monkey_mask: {
    name: 'Monkey Mask', latin: 'Monstera adansonii', rig: 'trailing',
    top: 9, topLen: 32, topLeaves: 1, tuft: 5, vines: 4, vineLen: 74, perVine: 6, stem: '#5f8f3a', roots: true, leafGrowth: 0.2,
    ages: { leaf: { holeRows: [[0.35, 0], [0.8, 2], [1, 3], [1.7, 4]] } },
    leaf: { shape: 'holes', L: 30, W: 21, color: '#3f8a3a', rib: true },
  },
  peperomia: {
    name: 'Radiator Plant', latin: 'Peperomia spp.', rig: 'bushy', form: 'peperomia',
    count: 14, spread: 1.45, stem: '#6f9a4a', spikes: { n: 4, color: '#e9e4b8', stalk: '#9a4a3a', w: 2.6, len: 2 },
    leaf: { shape: 'heart', L: 23, W: 21, color: '#2f5a2c', variType: 'ripple', gloss: true },
  },
  peperomia_hope: {
    name: 'Hope Peperomia', latin: "Peperomia 'Hope'", rig: 'trailing', form: 'strings',
    arches: 12, hangs: 6, spacing: 7, stem: '#7a8f4a', spikes: { n: 3, color: '#d9d9b0', w: 2.2, len: 1.3 },
    leaf: { shape: 'round', L: 9.5, W: 9, color: '#4f8a3a', vari: '#9cc58a', variType: 'streaks', rib: false, gloss: true },
  },
  pink_princess_philodendron: {
    name: 'Pink Princess Philodendron', latin: "Philodendron erubescens 'Pink Princess'", rig: 'tree', form: 'climber',
    h: 104, count: 6, stem: '#7a3b4a', root: '#8a6a50', young: '#e67fa3', leafGrowth: 0.2,
    leaf: { shape: 'heart', L: 43, W: 28, color: '#2d3f28', vari: '#f08fb0', variType: 'splash', ribColor: '#5a3a48', gloss: true },
  },
  white_princess_philodendron: {
    // The Pink Princess's sister: brighter green leaves, a little narrower and more
    // pointed, splashed with clean white instead of pink, on green stems.
    name: 'White Princess Philodendron', latin: "Philodendron erubescens 'White Princess'", rig: 'tree', form: 'climber',
    h: 104, count: 6, stem: '#5f7f45', root: '#8a6a50', young: '#e8eedb', leafGrowth: 0.2,
    leaf: { shape: 'heart', L: 44, W: 24, color: '#2e5a30', vari: '#f5f2e6', variType: 'splash', ribColor: '#4f6f42', gloss: true },
  },
  rubber_plant_ruby: {
    name: 'Rubber Plant', latin: "Ficus elastica 'Ruby'", rig: 'tree', form: 'rubber',
    h: 100, count: 7, trunk: '#7a6a4f', sheath: '#c2344d', wobble: 0.1,
    leaf: { shape: 'oval', L: 52, W: 33, color: '#3b5f3a', vari: '#f1d2c6', variType: 'edge', edgeScale: 0.74, ribColor: '#d0607a', gloss: true },
  },
  satin_pothos: {
    name: 'Satin Pothos', latin: 'Scindapsus pictus', rig: 'trailing',
    top: 14, topLen: 28, topLeaves: 2, tuft: 8, vines: 5, vineLen: 74, perVine: 9, stem: '#58704a', roots: true, leafGrowth: 0.25,
    leaf: { shape: 'heart', L: 21, W: 15, color: '#2e5a3e', vari: '#c3d3cf', variType: 'spots', curl: 1.8 },
  },
  snake_plant_laurentii: {
    name: 'Snake Plant', latin: "Dracaena trifasciata 'Laurentii'", rig: 'sword',
    count: 7, len: [86, 136], width: 16, spread: 0.36, base: 22, flop: 0.3, drop: 0, pups: 3, bloomSpike: { len: 92, stalk: '#7a8a5a', color: '#eef0d8', tip: '#f8f4cc', n: 14, from: 0.4, size: 4.5, w: 2 },
    strap: {
      color: '#2f5d3a', edge: '#d8c85a', edgeScale: 0.78, wrinkle: true,
      bands: { n: 9, color: '#86ab80', w: 1.4 },
    },
  },
  snake_plant_zeylanica: {
    name: 'Snake Plant', latin: "Dracaena trifasciata 'Zeylanica'", rig: 'sword',
    count: 8, len: [80, 128], width: 13.5, spread: 0.4, base: 22, flop: 0.3, drop: 0, pups: 3, bloomSpike: { len: 92, stalk: '#7a8a5a', color: '#eef0d8', tip: '#f8f4cc', n: 14, from: 0.4, size: 4.5, w: 2 },
    strap: {
      color: '#27432e', edge: '#6b4a3a', edgeScale: 0.9, wrinkle: true,
      bands: { n: 13, color: '#a6c3a0', w: 1.7 },
    },
  },
  snake_plant_moonshine: {
    name: 'Snake Plant', latin: "Dracaena trifasciata 'Moonshine'", rig: 'sword',
    count: 5, len: [72, 112], width: 21, spread: 0.4, base: 17, flop: 0.3, drop: 0, pups: 3, bloomSpike: { len: 92, stalk: '#7a8a5a', color: '#eef0d8', tip: '#f8f4cc', n: 14, from: 0.4, size: 4.5, w: 2 },
    strap: {
      color: '#b3cbbb', edge: '#3f6b4a', edgeScale: 0.9, wrinkle: true,
      bands: { n: 6, color: '#c9dccf', w: 1.3 },
    },
  },
  spider_plant: {
    name: 'Spider Plant', latin: 'Chlorophytum comosum', rig: 'arching',
    count: 14, len: [36, 72], width: 7, runners: 2, drop: 0.25, pups: 2,
    strap: { color: '#4f9a3f', stripe: '#f1f0d6', tips: true },
  },
  split_leaf_philodendron: {
    name: 'Split-Leaf Philodendron', latin: 'Thaumatophyllum bipinnatifidum', rig: 'upright_leaf', scale: 0.95,
    count: 5, len: [30, 62], spread: 1.05, tilt: 0.75, stem: '#6c8f45', stemW: 3, leafGrowth: 0.15, cap: 7,
    ages: { leaf: { lobes: [[0.3, 3], [1, 5], [1.8, 7]], depth: [[0.3, 0.3], [1, 0.55], [1.8, 0.65]] } },
    leaf: { shape: 'lobed', L: 56, W: 54, lobes: 5, depth: 0.55, color: '#3f7f3a', gloss: true },
  },
  tiger_aloe: {
    name: 'Tiger Aloe', latin: 'Gonialoe variegata', rig: 'rosette',
    count: 9, len: [30, 56], width: 21, spread: 1.2, dryHue: 12, profile: 'plump', pups: 3, raceme: { len: 72, stalk: '#7a6a4a', color: '#e8643a', tip: '#a8c870', n: 10, from: 0.55, arch: 0.25, size: 6, w: 2.8 },
    strap: { color: '#3f5f3a', edge: '#f0f1e6', edgeScale: 0.84, dashes: { n: 4, color: '#e9efe3' } },
  },
  tiger_tooth_aloe: {
    name: 'Tiger Tooth Aloe', latin: 'Aloe juvenna', rig: 'rosette',
    count: 10, len: [34, 56], width: 15, spread: 0.95, clusters: 3, dryHue: 12, profile: 'plump', pups: 2, raceme: { len: 66, stalk: '#7a6a4a', color: '#e8553a', n: 9, from: 0.55, arch: 0.3, size: 5.5, w: 2.6 },
    strap: { color: '#5f9a45', teeth: { n: 4, color: '#f4f4ea', size: 2.6 }, spots: { n: 6, color: '#eef3e2', r: 1 } },
  },
  umbrella_plant: {
    name: 'Umbrella Plant', latin: 'Schefflera arboricola', rig: 'tree', form: 'umbrella',
    stem: '#6f7a45', petiole: '#86a04a', leaflets: 8, wobble: 0.06,
    ages: { leaflets: [[0.2, 3], [0.6, 5], [1, 8], [1.8, 10]] },
    stems: [{ x: -9, h: 74, a: -0.2 }, { x: 11, h: 56, a: 0.3 }, { x: 1, h: 98, a: 0.03 }],
    leaf: { shape: 'obovate', L: 23, W: 9.5, color: '#3f7d34', gloss: true },
  },
  variegated_peperomia: {
    name: 'Variegated Baby Rubber Plant', latin: "Peperomia obtusifolia 'Variegata'", rig: 'bushy', form: 'obtusifolia',
    count: 3, stem: '#8aa35a', sprawl: 1, spikes: { n: 2, color: '#e3dcae', w: 3.4, len: 1.25 },
    leaf: { shape: 'round', L: 22, W: 19, color: '#5a8a3c', vari: '#efe6b0', variType: 'edge', gloss: true },
  },
  weeping_fig: {
    name: 'Weeping Fig', latin: 'Ficus benjamina', rig: 'tree', form: 'fig', dryHue: 50, drop: 0.6,
    h: 74, branches: 9, trunk: '#9b8565',
    leaf: { shape: 'lance', L: 15, W: 8, color: '#3e7b36', gloss: true },
  },
  zz_plant: {
    name: 'ZZ Plant', latin: 'Zamioculcas zamiifolia', rig: 'canes', form: 'zz', drop: 0.3,
    count: 6, len: [56, 102], leaflets: 8, stem: '#4c7a37', wobble: 0, pups: 2,
    leaf: { shape: 'oval', L: 17.5, W: 9.5, color: '#2f5f2a', gloss: true, rib: false },
  },

  epipremnum_pinnatum: {
    name: 'Dragon Tail Plant', latin: 'Epipremnum pinnatum', rig: 'trailing',
    top: 10, topLen: 28, topLeaves: 1, tuft: 4, vines: 5, vineLen: 74, perVine: 7, stem: '#5f8a4a', roots: true, leafGrowth: 0.25,
    leaf: { shape: 'heart', L: 25, W: 14, color: '#4f8c6a', gloss: true },
  },
  inch_plant: {
    name: 'Inch Plant', latin: 'Tradescantia zebrina', rig: 'trailing',
    top: 11, topLen: 24, topLeaves: 1, tuft: 5, vines: 5, vineLen: 72, perVine: 8, stem: '#7a4a7f', blooms: '#d77fc6', leggy: true,
    leaf: { shape: 'lance', L: 21, W: 12.5, color: '#6b3d78', vari: '#c9d6d6', variType: 'zebra', rib: false, gloss: true },
  },
  white_bird_of_paradise: {
    name: 'White Bird of Paradise', latin: 'Strelitzia nicolai', rig: 'canes', form: 'bird',
    count: 5, spread: 0.6, stalk: [44, 80], len: [44, 60], W: 24, stalkColor: '#6f9455', pups: 2,
    strap: { color: '#4f8758', rib: '#c9dcb0', veins: 9, tears: true, scorch: true },
  },
  monstera_deliciosa: {
    name: 'Swiss Cheese Plant', latin: 'Monstera deliciosa', rig: 'tree', form: 'monstera', scale: 0.95,
    count: 4, cap: 6, climbAt: 1.25, poleLeaves: 5, stem: '#5f8f3a', root: '#8a6a50', leafGrowth: 0.2, scroll: '#8fc46a',
    ages: { leaf: { slits: [[0.3, 0], [0.75, 2], [1, 4], [1.8, 5]], holeRows: [[0.5, 0], [1, 2], [1.6, 3]] } },
    leaf: { shape: 'monstera', L: 42, W: 42, slits: 4, color: '#2f6f34' },
  },
  monstera_thai_constellation: {
    name: 'Thai Constellation Monstera', latin: "Monstera deliciosa 'Thai Constellation'", rig: 'tree', form: 'monstera', scale: 0.95,
    count: 4, cap: 6, climbAt: 1.25, poleLeaves: 5, stem: '#7c9a5a', root: '#8a6a50', leafGrowth: 0.2, scroll: '#b9d690',
    ages: { leaf: { slits: [[0.3, 0], [0.75, 2], [1, 4], [1.8, 5]] } },
    leaf: { shape: 'monstera', L: 42, W: 42, slits: 4, color: '#2b6631', vari: '#f3eed6', variType: 'constellation' },
  },
  zz_plant_raven: {
    name: 'Black Raven ZZ Plant', latin: "Zamioculcas zamiifolia 'Raven'", rig: 'canes', form: 'zz', drop: 0.3,
    count: 6, len: [56, 102], leaflets: 8, stem: '#2c3627', wobble: 0, pups: 2,
    leaf: { shape: 'oval', L: 17.5, W: 9.5, color: '#36452f', gloss: true, rib: false },
  },
  jade_pothos: {
    name: 'Jade Pothos', latin: "Epipremnum aureum 'Jade'", rig: 'trailing',
    top: 11, topLen: 30, topLeaves: 1, tuft: 6, vines: 5, vineLen: 74, perVine: 8, stem: '#5a8a3a', roots: true, leafGrowth: 0.25,
    leaf: { shape: 'heart', L: 22, W: 18, color: '#2c7a3c', gloss: true },
  },
  alocasia_frydek: {
    name: 'Green Velvet Alocasia', latin: "Alocasia micholitziana 'Frydek'", rig: 'upright_leaf',
    count: 5, len: [44, 80], spread: 0.8, tilt: 0.85, stem: '#6a8a52', stemW: 2.6, pups: 2, leafGrowth: 0.15, cap: 6, scroll: '#5f8a4a',
    leaf: { shape: 'arrow', L: 46, W: 30, color: '#1f4029', vari: '#b9cc8a', variType: 'ribs', veins: 4, veinW: 0.6, rib: false },
  },
  money_tree: {
    name: 'Money Tree', latin: 'Pachira aquatica', rig: 'tree', form: 'umbrella', braid: 46,
    trunk: '#a08d6a', stem: '#7f8a50', petiole: '#7fa452', leaflets: 5, wheel: 2.1, wobble: 0.06,
    ages: { leaflets: [[0.3, 3], [1, 5], [1.8, 7]] },
    stems: [{ x: -6, h: 42, a: -0.55 }, { x: 6, h: 36, a: 0.6 }, { x: 0, h: 54, a: 0.04 }],
    leaf: { shape: 'elliptic', L: 32, W: 11, color: '#4c9a3e', gloss: true },
  },
  mini_monstera: {
    name: 'Mini Monstera', latin: 'Rhaphidophora tetrasperma', rig: 'tree', form: 'climber',
    h: 100, count: 7, pole: 1.2, stem: '#5f8f3a', root: '#8a6a50', young: '#9bd06a', leafGrowth: 0.2,
    ages: { leaf: { slits: [[0.4, 0], [0.8, 1], [1.1, 2], [1.8, 3]] } },
    leaf: { shape: 'tetra', L: 38, W: 28, slits: 2, color: '#3a8540' },
  },
  nerve_plant: {
    name: 'Nerve Plant', latin: 'Fittonia albivenis', rig: 'bushy', form: 'peperomia',
    count: 13, len: [12, 30], spread: 1.4, nodes: 1, stem: '#5f7f4a', creep: true, spikes: { n: 2, color: '#d7ddb8', w: 3.2, len: 1.9 },
    leaf: { shape: 'oval', L: 21, W: 16.5, color: '#2a5a30', vari: '#eef3ea', variType: 'ribs', veins: 3, veinW: 0.6, net: true, rib: false },
  },
  persian_shield: {
    name: 'Persian Shield', latin: 'Strobilanthes dyerianus', rig: 'bushy', form: 'obtusifolia', scale: 1.3,
    count: 4, stem: '#5e4a6e', sprawl: 0.5, woody: '#7a6a52', spikes: { n: 2, color: '#b7b2e6', w: 3.6, len: 1.2 },
    leaf: { shape: 'serrate', L: 28, W: 12, color: '#3d6145', vari: '#2f4d38', purple: '#a058d8', silver: '#ecd6fa', variType: 'shield', rib: false, gloss: true },
  },
  purple_passion: {
    name: 'Purple Passion Plant', latin: 'Gynura aurantiaca', rig: 'bushy', form: 'gynura',
    count: 8, perStem: 6, stem: '#93408f', bloom: '#f0912a',
    leaf: { shape: 'dentate', L: 24, W: 15, color: '#587a4a', vari: '#8e3a9a', variType: 'fuzz', ribColor: '#9a5aa0' },
  },
  alocasia_polly: {
    name: 'African Mask Plant', latin: "Alocasia × amazonica 'Polly'", rig: 'upright_leaf',
    count: 5, len: [40, 72], spread: 0.8, tilt: 0.95, stem: '#5d7a4c', stemW: 2.4, pups: 2, leafGrowth: 0.15, cap: 6, scroll: '#3f6a3e',
    leaf: { shape: 'polly', L: 40, W: 26, color: '#163522', vari: '#cfdcc6', variType: 'polly', rib: false, gloss: true },
  },
  alocasia_chienlii: {
    name: 'Elephant Ear', latin: 'Alocasia chienlii', rig: 'upright_leaf',
    count: 5, len: [34, 62], spread: 0.75, tilt: 0.9, stem: '#3b3833', stemW: 2.3, pups: 2, leafGrowth: 0.15, cap: 6, scroll: '#3a3f38',
    leaf: { shape: 'sagittate', L: 40, W: 24, color: '#191b1a', vari: '#6e655d', variType: 'char', ribColor: '#2b2d2b' },
  },
  alocasia_regal_shield: {
    name: 'Regal Shield', latin: "Alocasia 'Regal Shield'", rig: 'upright_leaf',
    count: 4, len: [52, 86], spread: 0.95, tilt: 0.7, stem: '#4f4a36', stemW: 3, pups: 2, leafGrowth: 0.15, cap: 5, scroll: '#3f5a3a',
    leaf: { shape: 'regal', L: 44, W: 34, color: '#1a2e1f', vari: '#4f7d44', variType: 'ribs', veins: 5, veinW: 0.7, rib: false },
  },
  ming_aralia: {
    name: 'Ming Aralia', latin: 'Polyscias fruticosa', rig: 'tree', form: 'aralia', drop: 0.5,
    braid: 30, count: 8, trunk: '#b7a787', stem: '#5f7a42',
    leaf: { shape: 'aralia', L: 17, W: 9.5, color: '#2f6634', ribColor: '#4f8a45', stalk: '#5f7a42', gloss: true },
  },
  moss_terrarium: {
    name: 'Moss Terrarium', latin: 'Bryophyta', rig: 'terrarium', container: 'jar', still: true, dryHue: 45,
    moss: ['#5f9e3f', '#4b8634', '#79b24c'], lights: '#ffd56a', lid: '#a8743f',
  },
  million_hearts_variegated: {
    name: 'Variegated Million Hearts', latin: "Dischidia ruscifolia 'Variegata'", rig: 'trailing', form: 'strings',
    arches: 10, hangs: 8, spacing: 8.5, stem: '#7f8a5a', tinyFlowers: '#fbfaf2',
    leaf: { shape: 'heart', L: 8.5, W: 8, color: '#4a8a40', vari: '#efe9cc', variType: 'edge', edgeScale: 0.62, rib: false },
  },

  // Shapes offered for plants without a preset.
  generic_leafy: {
    name: 'Leafy Plant', rig: 'upright_leaf', generic: true,
    count: 7, len: [30, 62], spread: 0.95, tilt: 0.4, stem: '#6c9a45',
    leaf: { shape: 'oval', L: 30, W: 18, color: '#4a8a3c', gloss: true },
  },
  generic_trailing: {
    name: 'Trailing Vine', rig: 'trailing', generic: true,
    top: 8, topLen: 24, vines: 4, vineLen: 74, perVine: 7, stem: '#6a9a3f',
    leaf: { shape: 'heart', L: 20, W: 16, color: '#3f8a3a', gloss: true },
  },
  generic_succulent: {
    name: 'Succulent', rig: 'rosette', generic: true,
    count: 9, len: [30, 50], width: 18, spread: 1.1, dryHue: 12, profile: 'plump',
    strap: { color: '#6a9a70' },
  },
  generic_spiky: {
    name: 'Upright Spiky', rig: 'sword', generic: true,
    count: 7, len: [70, 118], width: 13, spread: 0.4, base: 20, drop: 0,
    strap: { color: '#3f6f45', wrinkle: true },
  },
  generic_tree: {
    name: 'Small Tree', rig: 'tree', form: 'rubber', generic: true,
    h: 108, count: 7, trunk: '#7a6a4f', sheath: '#8fb86a',
    leaf: { shape: 'oval', L: 40, W: 23, color: '#3f7a38', gloss: true },
  },
};
