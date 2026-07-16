const EARTH_TILE_SOURCES = [
  {
    id: 'mapnik',
    label: 'Full basemap',
    maximumZoom: 20,
    path: ({ x, y, z }) => z >= 7
      ? `mapnik/${z}/${y}/tile_${y}_${x}.png`
      : `mapnik/${z}/tile_${y}_${x}.png`
  },
  {
    id: 'physical',
    label: 'Physical',
    maximumZoom: 4,
    path: ({ x, y, z }) => `relief.new/${z + 3}/${y}/${x}.jpg`
  },
  {
    id: 'satellite',
    label: 'Satellite',
    maximumZoom: 13,
    path: ({ x, y, z }) => `mapnik/sat/${z}/${y}/${y}_${x}.png`
  },
  {
    id: 'coastline',
    label: 'Coastline',
    maximumZoom: 7,
    path: ({ x, y, z }) => `plain/${z}/tile_${y}_${x}.png`
  },
  {
    id: 'blue-marble',
    label: 'Blue Marble',
    maximumZoom: 6,
    path: ({ x, y, z }) => `blue_marble/${z + 3}/${y}/${x}.jpg`
  },
  {
    id: 'night',
    label: 'Night on Earth',
    maximumZoom: 6,
    path: ({ x, y, z }) => `black_marble/${z + 3}/${y}/${x}.jpg`
  }
];

export const TILE_SOURCES = Object.freeze(EARTH_TILE_SOURCES.map(Object.freeze));

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

export function tileSourceById(id) {
  return TILE_SOURCES.find((source) => source.id === id) || TILE_SOURCES[0];
}

export function legacyTileSourceUrl(tileBase, source, tile) {
  const base = tileBase.replace(/\/$/, '');
  const columns = 6 * 2 ** tile.z;
  const x = ((tile.x % columns) + columns) % columns;
  return `${base}/${source.path({ ...tile, x })}`;
}
