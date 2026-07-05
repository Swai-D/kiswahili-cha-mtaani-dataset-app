export function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export const SOURCE_TYPES = [
  "Mazungumzo ya kawaida",
  "Tamthilia",
  "Redio",
  "Filamu/Bongo Movie",
  "Mitandao ya kijamii",
  "Nyingine",
];

export const REGIONS = [
  "Dar es Salaam",
  "Mwanza",
  "Arusha",
  "Dodoma",
  "Mbeya",
  "Zanzibar",
  "Tanga",
  "Sijui / Mchanganyiko",
  "Nyingine",
];

export const TOPICS = [
  "Maisha ya kila siku",
  "Mapenzi",
  "Biashara",
  "Michezo",
  "Siasa",
  "Dini",
  "Elimu",
  "Nyingine",
];

export const QUALITY_FLAGS = ["haijakaguliwa", "nzuri", "ina_shaka"];

export const QUALITY_LABELS = {
  haijakaguliwa: "Haijakaguliwa",
  nzuri: "Nzuri",
  ina_shaka: "Ina shaka",
};

// Deterministic pseudo-random generator (mulberry32) so that the same seed
// always produces the same train/val/test split — reproducible experiments.
export function mulberry32(seed) {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle(array, seed) {
  const rand = mulberry32(seed);
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function splitDataset(entries, trainRatio, valRatio, seed) {
  const shuffled = seededShuffle(entries, seed);
  const n = shuffled.length;
  const trainEnd = Math.round(n * trainRatio);
  const valEnd = trainEnd + Math.round(n * valRatio);
  return {
    train: shuffled.slice(0, trainEnd),
    val: shuffled.slice(trainEnd, valEnd),
    test: shuffled.slice(valEnd),
  };
}
