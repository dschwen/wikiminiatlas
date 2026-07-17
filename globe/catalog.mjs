const BLUE_LABELS = {
  labelColor: '#2255aa',
  labelTextShadow: '1px 0 2px white, 0 -1px 2px white, 0 1px 2px white, -1px 0 2px white'
};
const BLUE_LABELS_WITH_GLOW = {
  labelColor: '#2255aa',
  labelTextShadow: 'white 0 0 2pt'
};
const WHITE_LABELS = {
  labelColor: 'white',
  labelTextShadow: '1px 0 2px black, 0 -1px 2px black, 0 1px 2px black, -1px 0 2px black'
};
const WHITE_LABELS_WITH_GLOW = {
  labelColor: 'white',
  labelTextShadow: 'black 0 0 2pt'
};
const BLACK_LABELS = {
  labelColor: 'black',
  labelTextShadow: '1px 0 2px white, 0 -1px 2px white, 0 1px 2px white, -1px 0 2px white'
};

function padded(value, length) {
  return String(value).padStart(length, '0');
}

const BODY_DEFINITIONS = [
  {
    id: 'earth',
    label: 'Earth',
    labelDataset: 'earth',
    equatorialCircumferenceKm: 40075.0,
    sources: [
      {
        id: 'mapnik', label: 'Full basemap', maximumZoom: 20,
        jsonFromZoom: 13, minimumCameraAltitude: 0.0000625, ...BLUE_LABELS,
        attribution: [
          { label: 'Map data © OpenStreetMap contributors', href: 'https://www.openstreetmap.org/' },
          { label: 'ODbL', href: 'https://opendatacommons.org/licenses/odbl/' }
        ],
        path: ({ x, y, z }) => z >= 7
          ? `mapnik/${z}/${y}/tile_${y}_${x}.png`
          : `mapnik/${z}/tile_${y}_${x}.png`
      },
      {
        id: 'physical', label: 'Physical', maximumZoom: 4,
        longitudeOffsetDegrees: 180, ...BLUE_LABELS_WITH_GLOW,
        attribution: [{ label: 'Natural Earth', href: 'https://www.naturalearthdata.com/' }],
        path: ({ x, y, z }) => `relief.new/${z + 3}/${y}/${x}.jpg`
      },
      {
        id: 'satellite', label: 'Satellite', maximumZoom: 13, ...WHITE_LABELS_WITH_GLOW,
        path: ({ x, y, z }) => `mapnik/sat/${z}/${y}/${y}_${x}.png`
      },
      {
        id: 'coastline', label: 'Coastline', maximumZoom: 7, ...BLUE_LABELS,
        path: ({ x, y, z }) => `plain/${z}/tile_${y}_${x}.png`
      },
      {
        id: 'blue-marble', label: 'Blue Marble', maximumZoom: 6,
        longitudeOffsetDegrees: 180, ...WHITE_LABELS,
        attribution: [{ label: 'NASA Visible Earth', href: 'https://visibleearth.nasa.gov/' }],
        path: ({ x, y, z }) => `blue_marble/${z + 3}/${y}/${x}.jpg`
      },
      {
        id: 'night', label: 'Night on Earth', maximumZoom: 6,
        longitudeOffsetDegrees: 180, ...WHITE_LABELS,
        attribution: [{ label: 'NASA Visible Earth', href: 'https://visibleearth.nasa.gov/' }],
        path: ({ x, y, z }) => `black_marble/${z + 3}/${y}/${x}.jpg`
      }
    ]
  },
  {
    id: 'moon',
    label: 'Moon',
    labelDataset: 'moon',
    equatorialCircumferenceKm: 10940.475,
    sources: [
      {
        id: 'lro', label: 'Physical', maximumZoom: 5, ...BLACK_LABELS,
        path: ({ x, y, z }) =>
          `lro_moon/lromoon_${padded(5 - z, 3)}_${padded(x, 3)}_${padded(y, 3)}.png`
      },
      {
        id: 'satellite', label: 'Satellite', maximumZoom: 5,
        longitudeOffsetDegrees: 180, ...WHITE_LABELS,
        path: ({ x, y, z }) => `moon.new/${z + 3}/${y}/${x}.jpg`
      }
    ]
  },
  {
    id: 'mars',
    label: 'Mars',
    labelDataset: 'mars',
    equatorialCircumferenceKm: 21359.975,
    sources: [{
      id: 'satellite', label: 'Satellite', maximumZoom: 5,
      longitudeOffsetDegrees: 180, ...WHITE_LABELS_WITH_GLOW,
      path: ({ x, y, z }) =>
        `mars/mars_${padded(5 - z, 3)}_${padded(x, 3)}_${padded(y, 3)}.png`
    }]
  },
  {
    id: 'venus',
    label: 'Venus',
    labelDataset: 'venus',
    equatorialCircumferenceKm: 38024.6,
    sources: [{
      id: 'physical', label: 'Physical', maximumZoom: 3, ...WHITE_LABELS,
      path: ({ x, y, z }) =>
        `venus/venus_${padded(3 - z, 3)}_${padded(x, 3)}_${padded(y, 3)}.png`
    }]
  },
  {
    id: 'mercury',
    label: 'Mercury',
    labelDataset: 'mercury',
    equatorialCircumferenceKm: 15329.1,
    sources: [{
      id: 'satellite', label: 'Satellite', maximumZoom: 6,
      longitudeOffsetDegrees: 180, ...WHITE_LABELS,
      path: ({ x, y, z }) => {
        const inverseZoom = 6 - z;
        const zoomFolder = inverseZoom < 3 ? `${inverseZoom}/` : '';
        const columnFolder = inverseZoom === 0 ? `${Math.floor(x / 100)}/` : '';
        return `mercury/${zoomFolder}${columnFolder}merc_${padded(inverseZoom, 3)}_` +
          `${padded(x, 3)}_${padded(y, 3)}.png`;
      }
    }]
  },
  {
    id: 'io',
    label: 'Io',
    labelDataset: 'io',
    equatorialCircumferenceKm: 11443.6,
    sources: [{
      id: 'satellite', label: 'Satellite', maximumZoom: 4,
      longitudeOffsetDegrees: 180, ...BLACK_LABELS,
      path: ({ x, y, z }) =>
        `io/io_${padded(4 - z, 3)}_${padded(x, 3)}_${padded(y, 3)}.png`
    }]
  },
  {
    id: 'titan',
    label: 'Titan',
    labelDataset: 'titan',
    equatorialCircumferenceKm: 16190.3,
    sources: [{
      id: 'satellite', label: 'Satellite', maximumZoom: 3, ...BLACK_LABELS,
      path: ({ x, y, z }) =>
        `titan/titan_${padded(3 - z, 3)}_${padded(x, 3)}_${padded(y, 3)}.png`
    }]
  }
];

export const CELESTIAL_BODIES = Object.freeze(BODY_DEFINITIONS.map((body) => Object.freeze({
  ...body,
  sources: Object.freeze(body.sources.map((source) => Object.freeze({
    ...source,
    attribution: Object.freeze((source.attribution || []).map(Object.freeze))
  })))
})));

export const TILE_SOURCES = CELESTIAL_BODIES[0].sources;

export const LABEL_LANGUAGES = Object.freeze([
  ['af', 'Afrikaans'], ['als', 'Alemannisch'], ['ar', 'العربية'],
  ['ast', 'Asturianu'], ['be', 'Беларуская'], ['bg', 'Български'],
  ['bh', 'भोजपुरी'], ['bn', 'বাংলা'], ['bpy', 'বিষ্ণুপ্রিয়া মণিপুরী'],
  ['ca', 'Català'], ['ceb', 'Cebuano'], ['cs', 'Čeština'], ['da', 'Dansk'],
  ['de', 'Deutsch'], ['el', 'Ελληνικά'], ['en', 'English'], ['eo', 'Esperanto'],
  ['es', 'Español'], ['et', 'Eesti'], ['eu', 'Euskara'], ['fa', 'فارسی'],
  ['fi', 'Suomi'], ['fr', 'Français'], ['fy', 'Frysk'], ['ga', 'Gaeilge'],
  ['gl', 'Galego'], ['he', 'עברית'], ['hi', 'हिन्दी'], ['hr', 'Hrvatski'],
  ['ht', 'Kreyòl ayisyen'], ['hu', 'Magyar'], ['hy', 'Հայերեն'],
  ['id', 'Bahasa Indonesia'], ['ilo', 'Ilokano'], ['it', 'Italiano'], ['ja', '日本語'],
  ['ka', 'ქართული'], ['kk', 'Қазақша'], ['kn', 'ಕನ್ನಡ'], ['ko', '한국어'],
  ['ku', 'Kurdî'], ['la', 'Latina'], ['lb', 'Lëtzebuergesch'], ['lt', 'Lietuvių'],
  ['lv', 'Latviešu'], ['mk', 'Македонски'], ['ml', 'മലയാളം'],
  ['ms', 'Bahasa Melayu'], ['nds', 'Plattdüütsch'], ['new', 'नेपाल भाषा'],
  ['nl', 'Nederlands'], ['nn', 'Norsk nynorsk'], ['no', 'Norsk bokmål'],
  ['nv', 'Diné bizaad'], ['oc', 'Occitan'], ['os', 'Ирон'], ['pam', 'Kapampangan'],
  ['pl', 'Polski'], ['pms', 'Piemontèis'], ['pt', 'Português'], ['ro', 'Română'],
  ['ru', 'Русский'], ['sco', 'Scots'], ['sh', 'Srpskohrvatski / српскохрватски'],
  ['simple', 'Simple English'], ['sk', 'Slovenčina'], ['sl', 'Slovenščina'],
  ['sr', 'Српски / srpski'], ['sv', 'Svenska'], ['sw', 'Kiswahili'],
  ['ta', 'தமிழ்'], ['te', 'తెలుగు'], ['th', 'ไทย'], ['tl', 'Tagalog'],
  ['tr', 'Türkçe'], ['uk', 'Українська'], ['uz', 'Oʻzbekcha/ўзбекча'],
  ['vec', 'Vèneto'], ['vi', 'Tiếng Việt'], ['vo', 'Volapük'], ['war', 'Winaray'],
  ['zh', '中文'], ['zh-hans', '中文（简体）'], ['zh-hant', '中文（繁體）'],
  ['zh-cn', '中文（中国大陆）'], ['zh-hk', '中文（香港）'],
  ['zh-mo', '中文（澳門）'], ['zh-sg', '中文（新加坡）'],
  ['zh-tw', '中文（台灣）']
].map(Object.freeze));

export function celestialBodyById(id) {
  const normalizedId = String(id || '').toLowerCase();
  return CELESTIAL_BODIES.find((body) => body.id === normalizedId) || CELESTIAL_BODIES[0];
}

export function tileSourceById(id, body = CELESTIAL_BODIES[0]) {
  const selectedBody = typeof body === 'string' ? celestialBodyById(body) : body;
  return selectedBody.sources.find((source) => source.id === id) || selectedBody.sources[0];
}

export function legacyTileSourceUrl(tileBase, source, tile) {
  const base = tileBase.replace(/\/$/, '');
  const columns = 6 * 2 ** tile.z;
  const offset = Math.round(columns * (source.longitudeOffsetDegrees || 0) / 360);
  const x = (((tile.x + offset) % columns) + columns) % columns;
  return `${base}/${source.path({ ...tile, x })}`;
}
