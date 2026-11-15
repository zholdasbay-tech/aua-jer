// Data sources and static lookup tables.

export const ASF = 'https://api.daac.asf.alaska.edu/services/search/param';
export const POWER = 'https://power.larc.nasa.gov/api/temporal/daily/point';
export const NOMINATIM = 'https://nominatim.openstreetmap.org';
const GIBS = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/';

export const BASES = {
  night: {
    label: 'Night lights',
    url: GIBS + 'VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png',
    max: 8, dim: 1, att: 'Base map: NASA GIBS Black Marble'
  },
  gibs: {
    label: 'Daylight',
    url: GIBS + 'BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg',
    max: 8, dim: 0.5, att: 'Base map: NASA GIBS Blue Marble'
  },
  osm: {
    label: 'Streets',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    max: 12, dim: 0.55, att: 'Base map: © OpenStreetMap contributors'
  }
};

// [name, lat, lon]. Used for map labels and for describing a point as "28 km NE of Astana".
export const CITIES = [
  ['Astana', 51.13, 71.43], ['Karaganda', 49.8, 73.1], ['Temirtau', 50.05, 72.96], ['Kokshetau', 53.28, 69.39],
  ['Kostanay', 53.21, 63.63], ['Rudny', 52.97, 63.12], ['Pavlodar', 52.29, 76.97], ['Ekibastuz', 51.73, 75.32],
  ['Atbasar', 51.82, 68.36], ['Stepnogorsk', 52.35, 71.89], ['Korgalzhyn', 50.58, 70.02], ['Akkol', 51.99, 70.94],
  ['Ereymentau', 51.62, 73.1], ['Osakarovka', 50.56, 72.57], ['Arkalyk', 50.25, 66.91], ['Petropavl', 54.87, 69.14],
  ['Semey', 50.41, 80.23], ['Oskemen', 49.95, 82.61], ['Zhezkazgan', 47.78, 67.71], ['Balkhash', 46.85, 74.98],
  ['Taldykorgan', 45.02, 78.37], ['Almaty', 43.24, 76.89], ['Shymkent', 42.32, 69.6], ['Kyzylorda', 44.85, 65.51],
  ['Aralsk', 46.8, 61.67], ['Aktobe', 50.28, 57.21], ['Atyrau', 47.11, 51.92],
  ['Siem Reap', 13.36, 103.86], ['Battambang', 13.1, 103.2], ['Kampong Thom', 12.71, 104.89], ['Phnom Penh', 11.56, 104.92]
];

export const PRESETS = [
  { id: 'astana', name: 'Astana wheat belt', region: 'Kazakhstan', why: 'Harvest, ploughing and the first frost', lat: 51.13, lon: 71.43 },
  { id: 'tengiz', name: 'Lake Tengiz wetlands', region: 'Kazakhstan', why: 'Water levels in a Ramsar wetland', lat: 50.45, lon: 69.0 },
  { id: 'kostanay', name: 'Kostanay grain fields', region: 'Kazakhstan', why: 'Field by field harvest', lat: 53.2, lon: 63.6 },
  { id: 'aral', name: 'North Aral Sea', region: 'Kazakhstan', why: 'Shoreline and reed beds', lat: 46.3, lon: 60.75 },
  { id: 'balkhash', name: 'Lake Balkhash and Ili delta', region: 'Kazakhstan', why: 'Delta channels and wetlands', lat: 45.6, lon: 74.9 },
  { id: 'tonlesap', name: 'Tonle Sap floodplain', region: 'Cambodia', why: 'The monsoon flood pulse', lat: 12.9, lon: 104.0 }
];

export const GRID_W = 1536;   // width of the common Mercator grid in pixels
export const BLOCK = 32;      // hotspot block size in grid pixels (about 8 km)

export const MODES = [
  { id: 'single', label: 'One pass', key: '1', hint: 'Show pass B on its own' },
  { id: 'swipe', label: 'Swipe', key: '2', hint: 'Drag a divider between A and B' },
  { id: 'blink', label: 'Blink', key: '3', hint: 'Flick between A and B so movement jumps out' },
  { id: 'change', label: 'Change', key: '4', hint: 'Colour what got brighter or darker from A to B' }
];

export const BANDS = [
  { id: 'mix', label: 'Both channels together', hint: 'Average of HH and HV. A good default.' },
  { id: 'hh', label: 'HH only', hint: 'Soil moisture, open water, rough ground, buildings.' },
  { id: 'hv', label: 'HV only', hint: 'Scattering inside vegetation: crops, reeds, trees.' }
];

export const PLAY_SPEEDS = [
  { id: 'slow', label: 'Slow', ms: 2400 },
  { id: 'normal', label: 'Normal', ms: 1300 },
  { id: 'fast', label: 'Fast', ms: 600 }
];

export const SHORTCUTS = [
  { keys: ['1', '2', '3', '4'], what: 'Switch the view: one pass, swipe, blink, change' },
  { keys: ['←', '→'], what: 'Step pass B back or forward' },
  { keys: ['Shift', '←', '→'], what: 'Step pass A back or forward' },
  { keys: ['Space'], what: 'Play or stop the animation through all passes' },
  { keys: ['F'], what: 'Fit the radar footprint on screen' },
  { keys: ['+', '−'], what: 'Zoom in or out' },
  { keys: ['Esc'], what: 'Clear the asked point, close menus' },
  { keys: ['?'], what: 'Show this list' }
];
