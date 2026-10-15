const fs = require('fs');
const path = require('path');

// Pure JS version of parseNominal for instant verification
const INDONESIAN_NUMBERS = {
  nol: 0, kosong: 0, setengah: 0.5, seperempat: 0.25,
  satu: 1, se: 1, dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6,
  tujuh: 7, delapan: 8, sembilan: 9, sepuluh: 10, sebelas: 11,
  seratus: 100, seribu: 1000, sejuta: 1000000
};

const SLANG_BASE = {
  seceng: 1000, noceng: 2000, goceng: 5000, ceban: 10000,
  noban: 20000, gocap: 50000, cepek: 100000, nopek: 200000,
  gopek: 500, secengceng: 1000
};

function wordsToNumber(text) {
  if (!text) return null;
  const clean = text.toLowerCase().trim();
  const tokens = clean.split(/\s+/);
  if (tokens.length === 0) return null;
  let total = 0, group = 0, current = 0, hasValidWord = false;

  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];
    if (word === 'setengah') {
      current = 0.5;
      hasValidWord = true;
    } else if (word === 'seperempat') {
      current = 0.25;
      hasValidWord = true;
    } else if (word === 'juta') {
      const mult = (group + current === 0 && !hasValidWord) ? 1 : (group + current === 0 ? 1 : group + current);
      total += mult * 1000000;
      group = 0;
      current = 0;
      hasValidWord = true;
    } else if (word === 'miliar' || word === 'milyar') {
      const mult = (group + current === 0 && !hasValidWord) ? 1 : (group + current === 0 ? 1 : group + current);
      total += mult * 1000000000;
      group = 0;
      current = 0;
      hasValidWord = true;
    } else if (word === 'seribu') {
      total += 1000;
      group = 0;
      current = 0;
      hasValidWord = true;
    } else if (word === 'ribu') {
      const mult = (group + current === 0 && !hasValidWord) ? 1 : (group + current === 0 ? 1 : group + current);
      total += mult * 1000;
      group = 0;
      current = 0;
      hasValidWord = true;
    } else if (word === 'seratus') {
      group += 100;
      hasValidWord = true;
    } else if (word === 'ratus') {
      const val = (current === 0 ? 1 : current) * 100;
      group += val;
      current = 0;
      hasValidWord = true;
    } else if (word === 'sepuluh') {
      group += 10;
      hasValidWord = true;
    } else if (word === 'sebelas') {
      group += 11;
      hasValidWord = true;
    } else if (word === 'belas') {
      const val = current + 10;
      group += val;
      current = 0;
      hasValidWord = true;
    } else if (word === 'puluh') {
      const val = (current === 0 ? 1 : current) * 10;
      group += val;
      current = 0;
      hasValidWord = true;
    } else if (INDONESIAN_NUMBERS[word] !== undefined) {
      current += INDONESIAN_NUMBERS[word];
      hasValidWord = true;
    } else {
      return null;
    }
  }
  total += group + current;
  return hasValidWord ? Math.round(total) : null;
}

function parseNominal(rawInput) {
  if (!rawInput) return null;
  let text = String(rawInput).trim().toLowerCase();
  text = text.replace(/[,-]\s*$/, '').trim();
  text = text.replace(/^rp\.?\s*/i, '').trim();

  // 1. Combo
  const comboMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:jt|juta)\s*(\d+(?:[.,]\d+)?)\s*(?:rb|ribu|k)/i);
  if (comboMatch) {
    const millions = parseFloat(comboMatch[1].replace(',', '.'));
    const thousands = parseFloat(comboMatch[2].replace(',', '.'));
    return Math.round(millions * 1000000 + thousands * 1000);
  }

  // 2. Slang with multiplier
  const slangMultiplierMatch = text.match(/^(?:seorang|beli|buat)?\s*(\d+|setengah|seperempat|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh)?\s*(seceng|noceng|goceng|ceban|noban|gocap|cepek|nopek|gopek)\b/i);
  if (slangMultiplierMatch) {
    const multStr = slangMultiplierMatch[1];
    const slangWord = slangMultiplierMatch[2].toLowerCase();
    let mult = 1;
    if (multStr) {
      if (multStr === 'setengah') mult = 0.5;
      else if (multStr === 'seperempat') mult = 0.25;
      else if (INDONESIAN_NUMBERS[multStr] !== undefined) mult = INDONESIAN_NUMBERS[multStr];
      else if (/^\d+$/.test(multStr)) mult = parseInt(multStr, 10);
    }
    const baseVal = SLANG_BASE[slangWord] || 0;
    if (baseVal > 0) {
      if (text.includes('cepek ceng') || text.includes('cepekceng')) return 100000;
      return Math.round(mult * baseVal);
    }
  }

  for (const [slang, val] of Object.entries(SLANG_BASE)) {
    const rx = new RegExp(`\\b${slang}\\b`, 'i');
    if (rx.test(text)) {
      if (text.includes('cepek ceng')) return 100000;
      return val;
    }
  }

  const wordsResult = wordsToNumber(text);
  if (wordsResult !== null && wordsResult > 0) return wordsResult;

  const jtMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:jt|juta)\b/i);
  if (jtMatch) return Math.round(parseFloat(jtMatch[1].replace(',', '.')) * 1000000);

  const rbMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:rb|ribu|k)\b/i);
  if (rbMatch) return Math.round(parseFloat(rbMatch[1].replace(',', '.')) * 1000);

  const dottedMatch = text.match(/\b(\d{1,3}(?:\.\d{3})+)(?:,-\b|\b)/);
  if (dottedMatch) return parseInt(dottedMatch[1].replace(/\./g, ''), 10);

  const commaSeparated = text.match(/\b(\d{1,3}(?:,\d{3})+)\b/);
  if (commaSeparated) return parseInt(commaSeparated[1].replace(/,/g, ''), 10);

  const plainMatch = text.match(/\b(\d{3,10})\b/);
  if (plainMatch) return parseInt(plainMatch[1], 10);

  return null;
}

function extractNominalFromSentence(sentence) {
  if (!sentence) return { nominal: null, cleanedText: '' };
  const raw = sentence.trim();
  const direct = parseNominal(raw);
  if (direct !== null) return { nominal: direct, cleanedText: raw };

  const comboRegex = /\b(\d+(?:[.,]\d+)?\s*(?:jt|juta)\s*\d+(?:[.,]\d+)?\s*(?:rb|ribu|k))\b/i;
  const comboM = raw.match(comboRegex);
  if (comboM) {
    const nom = parseNominal(comboM[1]);
    if (nom) return { nominal: nom, cleanedText: raw.replace(comboM[1], '').trim() };
  }

  const slangMultiRegex = /\b((?:\d+|setengah|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh)\s*(?:seceng|noceng|goceng|ceban|noban|gocap|cepek|nopek|gopek)|cepek\s*ceng)\b/i;
  const slangMultiM = raw.match(slangMultiRegex);
  if (slangMultiM) {
    const nom = parseNominal(slangMultiM[1]);
    if (nom) return { nominal: nom, cleanedText: raw.replace(slangMultiM[1], '').trim() };
  }

  const indonesianPhrases = [
    'dua juta lima ratus ribu', 'satu juta lima ratus ribu', 'setengah juta',
    'seratus ribu', 'lima puluh ribu', 'dua puluh ribu', 'tiga puluh ribu',
    'sepuluh ribu', 'lima belas ribu', 'dua puluh lima ribu', 'tujuh puluh lima ribu',
    'seribu', 'dua ribu', 'tiga ribu', 'empat ribu', 'lima ribu'
  ];
  for (const phrase of indonesianPhrases) {
    if (raw.toLowerCase().includes(phrase)) {
      const nom = wordsToNumber(phrase);
      if (nom) return { nominal: nom, cleanedText: raw.replace(new RegExp(phrase, 'i'), '').trim() };
    }
  }

  const rpRegex = /\brp\.?\s*(\d{1,3}(?:\.\d{3})+|\d+)(?:,-\b|\b)/i;
  const rpM = raw.match(rpRegex);
  if (rpM) {
    const nom = parseNominal(rpM[0]);
    if (nom) return { nominal: nom, cleanedText: raw.replace(rpM[0], '').trim() };
  }

  const abbrRegex = /\b(\d+(?:[.,]\d+)?\s*(?:jt|juta|rb|ribu|k))\b/i;
  const abbrM = raw.match(abbrRegex);
  if (abbrM) {
    const nom = parseNominal(abbrM[1]);
    if (nom) return { nominal: nom, cleanedText: raw.replace(abbrM[1], '').trim() };
  }

  const dottedRegex = /\b(\d{1,3}(?:\.\d{3})+|\d{1,3}(?:,\d{3})+)\b/;
  const dottedM = raw.match(dottedRegex);
  if (dottedM) {
    const nom = parseNominal(dottedM[1]);
    if (nom) return { nominal: nom, cleanedText: raw.replace(dottedM[1], '').trim() };
  }

  const plainRegex = /\b(\d{4,9})\b/;
  const plainM = raw.match(plainRegex);
  if (plainM) {
    const nom = parseNominal(plainM[1]);
    if (nom) return { nominal: nom, cleanedText: raw.replace(plainM[1], '').trim() };
  }

  return { nominal: null, cleanedText: raw };
}

const TEST_CASES = [
  { input: 'Rp 50.000', expected: 50000, desc: 'Rp dengan spasi dan titik' },
  { input: 'Rp50.000', expected: 50000, desc: 'Rp rapat dengan titik' },
  { input: 'Rp. 50.000,-', expected: 50000, desc: 'Rp titik spasi titik strip' },
  { input: 'rp 50000', expected: 50000, desc: 'rp kecil polos' },
  { input: '50.000', expected: 50000, desc: '50.000 titik' },
  { input: '50000', expected: 50000, desc: '50000 polos' },
  { input: '50,000', expected: 50000, desc: '50,000 koma' },
  { input: '50 rb', expected: 50000, desc: '50 rb' },
  { input: '50rb', expected: 50000, desc: '50rb' },
  { input: '50 ribu', expected: 50000, desc: '50 ribu' },
  { input: '50k', expected: 50000, desc: '50k' },
  { input: '1,5jt', expected: 1500000, desc: '1,5jt' },
  { input: '1.5 juta', expected: 1500000, desc: '1.5 juta' },
  { input: '2 juta', expected: 2000000, desc: '2 juta' },
  { input: '500k', expected: 500000, desc: '500k' },
  { input: '1jt500rb', expected: 1500000, desc: '1jt500rb' },
  { input: '1 juta 500 ribu', expected: 1500000, desc: '1 juta 500 ribu' },
  { input: 'lima puluh ribu', expected: 50000, desc: 'lima puluh ribu' },
  { input: 'seratus ribu', expected: 100000, desc: 'seratus ribu' },
  { input: 'seribu', expected: 1000, desc: 'seribu' },
  { input: 'dua juta lima ratus ribu', expected: 2500000, desc: 'dua juta lima ratus ribu' },
  { input: 'setengah juta', expected: 500000, desc: 'setengah juta' },
  { input: 'goceng', expected: 5000, desc: 'goceng' },
  { input: 'ceban', expected: 10000, desc: 'ceban' },
  { input: 'gocap', expected: 50000, desc: 'gocap' },
  { input: 'cepek', expected: 100000, desc: 'cepek' },
  { input: '5 ceban', expected: 50000, desc: '5 ceban' },
  { input: 'dua ratus lima puluh ribu', expected: 250000, desc: 'dua ratus lima puluh ribu' },
  { input: 'seratus lima puluh ribu', expected: 150000, desc: 'seratus lima puluh ribu' },
  { input: 'tiga ratus dua puluh lima ribu', expected: 325000, desc: 'tiga ratus dua puluh lima ribu' },
  { input: 'seceng', expected: 1000, desc: 'seceng' },
  { input: 'cepek ceng', expected: 100000, desc: 'cepek ceng' }
];

const SENTENCE_TESTS = [
  { sentence: 'beli bakso 15rb pakai gopay', expected: 15000 },
  { sentence: 'gajian 5jt masuk bca', expected: 5000000 },
  { sentence: 'beli sate padang 25.000 dari mandiri', expected: 25000 },
  { sentence: 'beli kopi gocap via tunai', expected: 50000 },
  { sentence: 'sepatu lari 5 ceban pake bca', expected: 50000 },
  { sentence: 'bayar kos setengah juta', expected: 500000 }
];

let passed = 0, failed = 0;
console.log('Testing Part 14.5 Nominal Parser...');
for (const tc of TEST_CASES) {
  const got = parseNominal(tc.input);
  if (got === tc.expected) {
    passed++;
    console.log(`  [PASS] ${tc.desc.padEnd(28)}: "${tc.input}" => ${got}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${tc.desc.padEnd(28)}: "${tc.input}" => Got: ${got}, Expected: ${tc.expected}`);
  }
}

for (const sc of SENTENCE_TESTS) {
  const { nominal } = extractNominalFromSentence(sc.sentence);
  if (nominal === sc.expected) {
    passed++;
    console.log(`  [PASS] Sentence: "${sc.sentence}" => ${nominal}`);
  } else {
    failed++;
    console.error(`  [FAIL] Sentence: "${sc.sentence}" => Got: ${nominal}, Expected: ${sc.expected}`);
  }
}

console.log(`\nResult: ${passed} Passed, ${failed} Failed`);
if (failed > 0) process.exit(1);
