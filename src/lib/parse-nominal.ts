/**
 * TATADANA INDONESIAN NOMINAL PARSER (DETERMINISTIC)
 * Sesuai Part 14.5 Spesifikasi TataDana:
 * 1. Dengan "Rp": "Rp 50.000", "Rp50.000", "Rp. 50.000,-", "rp 50000"
 * 2. Tanpa "Rp": "50.000", "50000", "50,000"
 * 3. Singkatan: "50 rb", "50rb", "50 ribu", "50k", "1,5jt", "1.5 juta", "2 juta", "500k", "1jt500rb", "1 juta 500 ribu"
 * 4. Kata (Indonesian words): "lima puluh ribu", "seratus ribu", "seribu", "dua juta lima ratus ribu", "setengah juta"
 * 5. Slang: "goceng" (5.000), "ceban" (10.000), "gocap" (50.000), "cepek" (100.000), "5 ceban" (50.000), "seceng" (1.000), "gopek" (500)
 */

export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rp0';
  const rounded = Math.round(amount);
  const formatted = Math.abs(rounded).toLocaleString('id-ID');
  return rounded < 0 ? `-Rp${formatted}` : `Rp${formatted}`;
}

const INDONESIAN_NUMBERS: Record<string, number> = {
  nol: 0,
  kosong: 0,
  setengah: 0.5,
  seperempat: 0.25,
  satu: 1,
  se: 1,
  dua: 2,
  tiga: 3,
  empat: 4,
  lima: 5,
  enam: 6,
  tujuh: 7,
  delapan: 8,
  sembilan: 9,
  sepuluh: 10,
  sebelas: 11,
  seratus: 100,
  seribu: 1000,
  sejuta: 1000000,
};

const SLANG_BASE: Record<string, number> = {
  seceng: 1000,
  noceng: 2000,
  goceng: 5000,
  ceban: 10000,
  noban: 20000,
  gocap: 50000,
  cepek: 100000,
  nopek: 200000,
  gopek: 500, // gopek in modern monetary context is often 500 or 500.000 if followed by rb/k
  secengceng: 1000,
};

/**
 * Konversi teks kata-kata angka bahasa Indonesia ke angka
 * Contoh: "lima puluh ribu" -> 50000
 * "dua juta lima ratus ribu" -> 2500000
 * "seratus ribu" -> 100000
 * "setengah juta" -> 500000
 */
export function wordsToNumber(text: string): number | null {
  const clean = text.toLowerCase().trim();
  const tokens = clean.split(/\s+/);
  if (tokens.length === 0) return null;

  let total = 0;
  let current = 0;
  let hasValidWord = false;

  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];

    if (word === 'setengah') {
      current = 0.5;
      hasValidWord = true;
    } else if (word === 'seperempat') {
      current = 0.25;
      hasValidWord = true;
    } else if (word === 'juta') {
      if (current === 0 && !hasValidWord) current = 1;
      total += (current === 0 ? 1 : current) * 1000000;
      current = 0;
      hasValidWord = true;
    } else if (word === 'miliar' || word === 'milyar') {
      if (current === 0 && !hasValidWord) current = 1;
      total += (current === 0 ? 1 : current) * 1000000000;
      current = 0;
      hasValidWord = true;
    } else if (word === 'ribu') {
      if (current === 0 && !hasValidWord) current = 1;
      total += (current === 0 ? 1 : current) * 1000;
      current = 0;
      hasValidWord = true;
    } else if (word === 'ratus') {
      current = (current === 0 ? 1 : current) * 100;
      hasValidWord = true;
    } else if (word === 'seratus') {
      current += 100;
      hasValidWord = true;
    } else if (word === 'puluh') {
      current = (current === 0 ? 1 : current) * 10;
      hasValidWord = true;
    } else if (word === 'sepuluh') {
      current += 10;
      hasValidWord = true;
    } else if (word === 'sebelas') {
      current += 11;
      hasValidWord = true;
    } else if (word === 'seribu') {
      if (current > 0) {
        total += current;
        current = 0;
      }
      total += 1000;
      hasValidWord = true;
    } else if (word === 'belas') {
      current += 10;
      hasValidWord = true;
    } else if (INDONESIAN_NUMBERS[word] !== undefined) {
      current += INDONESIAN_NUMBERS[word];
      hasValidWord = true;
    } else {
      // Unrecognized word inside a potential words-to-number phrase
      return null;
    }
  }

  total += current;
  return hasValidWord ? Math.round(total) : null;
}

/**
 * Parser Deterministic Nominal Utama
 * Mendukung teks langsung maupun potongan kalimat
 */
export function parseNominal(rawInput: string | null | undefined): number | null {
  if (!rawInput) return null;

  let text = String(rawInput).trim().toLowerCase();

  // Bersihkan karakter penutup nominal seperti ",-" atau "/-"
  text = text.replace(/[,-]\s*$/, '').trim();

  // Bersihkan awalan "rp." atau "rp"
  text = text.replace(/^rp\.?\s*/i, '').trim();

  // 1. CEK KOMBINASI JUTA DAN RIBU SEKALIGUS
  // Contoh: "1jt500rb", "1jt 500rb", "1 juta 500 ribu", "2jt250k"
  const comboMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:jt|juta)\s*(\d+(?:[.,]\d+)?)\s*(?:rb|ribu|k)/i);
  if (comboMatch) {
    const millions = parseFloat(comboMatch[1].replace(',', '.'));
    const thousands = parseFloat(comboMatch[2].replace(',', '.'));
    return Math.round(millions * 1000000 + thousands * 1000);
  }

  // 2. CEK SLANG DENGAN PENGALI (Contoh: "5 ceban", "2 goceng", "3 gocap", "setengah ceban")
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
      // Special handle: "cepek ceng" = 100.000
      if (text.includes('cepek ceng') || text.includes('cepekceng')) {
        return 100000;
      }
      return Math.round(mult * baseVal);
    }
  }

  // Cek kata slang langsung tunggal: "goceng", "ceban", "gocap", "cepek", "seceng"
  for (const [slang, val] of Object.entries(SLANG_BASE)) {
    const rx = new RegExp(`\\b${slang}\\b`, 'i');
    if (rx.test(text)) {
      if (text.includes('cepek ceng')) return 100000;
      return val;
    }
  }

  // 3. CEK KATA-KATA ANGKA (Contoh: "lima puluh ribu", "seratus ribu", "dua juta lima ratus ribu", "setengah juta")
  // Cari frasa kata angka yang mungkin ada di text
  const wordsResult = wordsToNumber(text);
  if (wordsResult !== null && wordsResult > 0) {
    return wordsResult;
  }

  // 4. CEK SINGKATAN JUTA: "1,5jt", "1.5 juta", "2 juta", "10jt"
  const jtMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:jt|juta)\b/i);
  if (jtMatch) {
    const val = parseFloat(jtMatch[1].replace(',', '.'));
    return Math.round(val * 1000000);
  }

  // 5. CEK SINGKATAN RIBU / K: "50 rb", "50rb", "50 ribu", "50k", "500k"
  const rbMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:rb|ribu|k)\b/i);
  if (rbMatch) {
    const val = parseFloat(rbMatch[1].replace(',', '.'));
    return Math.round(val * 1000);
  }

  // 6. CEK FORMAT DENGAN TITIK / KOMA RIBUAN: "50.000", "1.500.000", "50,000"
  // Format titik Indonesia standard: 50.000, 1.250.000
  const dottedMatch = text.match(/\b(\d{1,3}(?:\.\d{3})+)(?:,-\b|\b)/);
  if (dottedMatch) {
    return parseInt(dottedMatch[1].replace(/\./g, ''), 10);
  }

  // Format koma US/internasional: 50,000, 1,000,000
  const commaSeparated = text.match(/\b(\d{1,3}(?:,\d{3})+)\b/);
  if (commaSeparated) {
    return parseInt(commaSeparated[1].replace(/,/g, ''), 10);
  }

  // 7. CEK ANGKA POLOS: "50000", "15000"
  const plainMatch = text.match(/\b(\d{3,10})\b/);
  if (plainMatch) {
    return parseInt(plainMatch[1], 10);
  }

  return null;
}

/**
 * Ekstraksi nominal dari kalimat natural bebas.
 * Contoh: "beli martabak 35rb pakai gopay" -> 35000
 * "gajian 5.000.000 masuk bca" -> 5000000
 * "sepatu olahraga 5 ceban" -> 50000
 */
export function extractNominalFromSentence(sentence: string): { nominal: number | null; cleanedText: string } {
  if (!sentence) return { nominal: null, cleanedText: '' };

  const raw = sentence.trim();

  // 1. Coba parse kalimat langsung
  const direct = parseNominal(raw);
  if (direct !== null) {
    return { nominal: direct, cleanedText: raw };
  }

  // 2. Cari pola nominal dalam kalimat
  // Pola jutaan-ribuan gabung: "1jt 500rb", "1jt500rb", "1 juta 500 ribu"
  const comboRegex = /\b(\d+(?:[.,]\d+)?\s*(?:jt|juta)\s*\d+(?:[.,]\d+)?\s*(?:rb|ribu|k))\b/i;
  const comboM = raw.match(comboRegex);
  if (comboM) {
    const nom = parseNominal(comboM[1]);
    if (nom) return { nominal: nom, cleanedText: raw.replace(comboM[1], '').trim() };
  }

  // Pola slang bertingkat: "5 ceban", "2 goceng", "3 gocap", "cepek ceng"
  const slangMultiRegex = /\b((?:\d+|setengah|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh)\s*(?:seceng|noceng|goceng|ceban|noban|gocap|cepek|nopek|gopek)|cepek\s*ceng)\b/i;
  const slangMultiM = raw.match(slangMultiRegex);
  if (slangMultiM) {
    const nom = parseNominal(slangMultiM[1]);
    if (nom) return { nominal: nom, cleanedText: raw.replace(slangMultiM[1], '').trim() };
  }

  // Pola slang tunggal: goceng, ceban, gocap, cepek, seceng
  const slangSingleRegex = /\b(seceng|noceng|goceng|ceban|noban|gocap|cepek|nopek|gopek)\b/i;
  const slangSingleM = raw.match(slangSingleRegex);
  if (slangSingleM) {
    const nom = parseNominal(slangSingleM[1]);
    if (nom) return { nominal: nom, cleanedText: raw.replace(slangSingleM[1], '').trim() };
  }

  // Pola kata: "setengah juta", "dua juta lima ratus ribu", "seratus ribu", "lima puluh ribu"
  const wordsRegex = /\b(setengah\s+juta|seperempat\s+juta|(?:satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|seratus|dua\s+ratus|tiga\s+ratus|empat\s+ratus|lima\s+ratus)?\s*(?:puluh|belas|ratus)?\s*(?:ribu|juta|miliar)?(?:\s+(?:satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|seratus|dua\s+ratus|tiga\s+ratus|lima\s+ratus)?\s*(?:puluh|belas|ratus)?\s*(?:ribu|juta)?)?)\b/i;
  // Cek secara spesifik frasa kata angka yang umum
  const indonesianPhrases = [
    'dua juta lima ratus ribu',
    'satu juta lima ratus ribu',
    'setengah juta',
    'seratus ribu',
    'lima puluh ribu',
    'dua puluh ribu',
    'tiga puluh ribu',
    'sepuluh ribu',
    'lima belas ribu',
    'dua puluh lima ribu',
    'tujuh puluh lima ribu',
    'seribu',
    'dua ribu',
    'tiga ribu',
    'empat ribu',
    'lima ribu',
  ];
  for (const phrase of indonesianPhrases) {
    if (raw.toLowerCase().includes(phrase)) {
      const nom = wordsToNumber(phrase);
      if (nom) return { nominal: nom, cleanedText: raw.replace(new RegExp(phrase, 'i'), '').trim() };
    }
  }

  // Pola "Rp 50.000", "Rp. 50.000,-", "rp 50000"
  const rpRegex = /\brp\.?\s*(\d{1,3}(?:\.\d{3})+|\d+)(?:,-\b|\b)/i;
  const rpM = raw.match(rpRegex);
  if (rpM) {
    const nom = parseNominal(rpM[0]);
    if (nom) return { nominal: nom, cleanedText: raw.replace(rpM[0], '').trim() };
  }

  // Pola singkatan "50 rb", "50rb", "50 ribu", "50k", "1,5jt", "1.5 juta", "2 juta", "500k"
  const abbrRegex = /\b(\d+(?:[.,]\d+)?\s*(?:jt|juta|rb|ribu|k))\b/i;
  const abbrM = raw.match(abbrRegex);
  if (abbrM) {
    const nom = parseNominal(abbrM[1]);
    if (nom) return { nominal: nom, cleanedText: raw.replace(abbrM[1], '').trim() };
  }

  // Pola angka bertitik/koma "50.000"
  const dottedRegex = /\b(\d{1,3}(?:\.\d{3})+|\d{1,3}(?:,\d{3})+)\b/;
  const dottedM = raw.match(dottedRegex);
  if (dottedM) {
    const nom = parseNominal(dottedM[1]);
    if (nom) return { nominal: nom, cleanedText: raw.replace(dottedM[1], '').trim() };
  }

  // Pola angka polos 4-9 digit
  const plainRegex = /\b(\d{4,9})\b/;
  const plainM = raw.match(plainRegex);
  if (plainM) {
    const nom = parseNominal(plainM[1]);
    if (nom) return { nominal: nom, cleanedText: raw.replace(plainM[1], '').trim() };
  }

  return { nominal: null, cleanedText: raw };
}
