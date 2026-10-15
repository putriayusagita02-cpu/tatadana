/**
 * UNIT TESTS: PARSE-NOMINAL (PART 14.5)
 * Memvalidasi kepatuhan penuh terhadap semua bentuk penyebutan uang di Indonesia.
 */

import { parseNominal, extractNominalFromSentence, formatRupiah } from '../src/lib/parse-nominal';

interface TestCase {
  input: string;
  expected: number | null;
  description: string;
}

export const TEST_CASES: TestCase[] = [
  // 1. Dengan "Rp"
  { input: 'Rp 50.000', expected: 50000, description: 'Rp dengan spasi dan titik' },
  { input: 'Rp50.000', expected: 50000, description: 'Rp rapat dengan titik' },
  { input: 'Rp. 50.000,-', expected: 50000, description: 'Rp titik spasi titik strip' },
  { input: 'rp 50000', expected: 50000, description: 'rp kecil polos' },

  // 2. Tanpa "Rp"
  { input: '50.000', expected: 50000, description: 'Titik ribuan Indonesia' },
  { input: '50000', expected: 50000, description: 'Angka polos 5 digit' },
  { input: '50,000', expected: 50000, description: 'Koma ribuan' },

  // 3. Singkatan
  { input: '50 rb', expected: 50000, description: '50 rb dengan spasi' },
  { input: '50rb', expected: 50000, description: '50rb rapat' },
  { input: '50 ribu', expected: 50000, description: '50 ribu' },
  { input: '50k', expected: 50000, description: '50k' },
  { input: '1,5jt', expected: 1500000, description: '1,5jt koma' },
  { input: '1.5 juta', expected: 1500000, description: '1.5 juta titik' },
  { input: '2 juta', expected: 2000000, description: '2 juta' },
  { input: '500k', expected: 500000, description: '500k' },
  { input: '1jt500rb', expected: 1500000, description: '1jt500rb gabungan' },
  { input: '1 juta 500 ribu', expected: 1500000, description: '1 juta 500 ribu gabungan kata' },

  // 4. Kata (Spelled-out words)
  { input: 'lima puluh ribu', expected: 50000, description: 'lima puluh ribu' },
  { input: 'seratus ribu', expected: 100000, description: 'seratus ribu' },
  { input: 'seribu', expected: 1000, description: 'seribu' },
  { input: 'dua juta lima ratus ribu', expected: 2500000, description: 'dua juta lima ratus ribu' },
  { input: 'setengah juta', expected: 500000, description: 'setengah juta' },

  // 5. Slang
  { input: 'goceng', expected: 5000, description: 'goceng (5.000)' },
  { input: 'ceban', expected: 10000, description: 'ceban (10.000)' },
  { input: 'gocap', expected: 50000, description: 'gocap (50.000)' },
  { input: 'cepek', expected: 100000, description: 'cepek (100.000)' },
  { input: '5 ceban', expected: 50000, description: '5 ceban (5 x 10.000 = 50.000)' },
  { input: 'seceng', expected: 1000, description: 'seceng (1.000)' },
  { input: 'cepek ceng', expected: 100000, description: 'cepek ceng (100.000)' },
];

export const SENTENCE_TEST_CASES = [
  { sentence: 'beli bakso 15rb pakai gopay', expectedNominal: 15000 },
  { sentence: 'gajian 5jt masuk bca', expectedNominal: 5000000 },
  { sentence: 'beli sate padang 25.000 dari mandiri', expectedNominal: 25000 },
  { sentence: 'beli kopi gocap via tunai', expectedNominal: 50000 },
  { sentence: 'sepatu lari 5 ceban pake bca', expectedNominal: 50000 },
  { sentence: 'bayar kos setengah juta', expectedNominal: 500000 },
];

export function runTests(): { total: number; passed: number; failed: number } {
  let passed = 0;
  let failed = 0;

  console.log('=================================================================');
  console.log('  UNIT TEST: INDONESIAN NOMINAL PARSER (PART 14.5 SPEC)');
  console.log('=================================================================');

  for (const tc of TEST_CASES) {
    const res = parseNominal(tc.input);
    const ok = res === tc.expected;
    if (ok) {
      passed++;
      console.log(`  [PASS] ${tc.description.padEnd(32)} -> "${tc.input}" => ${formatRupiah(res || 0)}`);
    } else {
      failed++;
      console.error(`  [FAIL] ${tc.description.padEnd(32)} -> "${tc.input}" => Got: ${res}, Expected: ${tc.expected}`);
    }
  }

  console.log('\n--- Uji Kalimat Percakapan Bebas ---');
  for (const stc of SENTENCE_TEST_CASES) {
    const { nominal } = extractNominalFromSentence(stc.sentence);
    const ok = nominal === stc.expectedNominal;
    if (ok) {
      passed++;
      console.log(`  [PASS] "${stc.sentence}" => ${formatRupiah(nominal || 0)}`);
    } else {
      failed++;
      console.error(`  [FAIL] "${stc.sentence}" => Got: ${nominal}, Expected: ${stc.expectedNominal}`);
    }
  }

  console.log('=================================================================');
  console.log(`  HASIL: ${passed} Passed, ${failed} Failed / Total: ${passed + failed}`);
  console.log('=================================================================');

  return { total: passed + failed, passed, failed };
}

if (typeof require !== 'undefined' && require.main === module) {
  runTests();
}
