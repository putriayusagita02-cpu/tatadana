import sys
import os

# Add scratch/tatadana to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import server

test_cases = [
    ('Rp 50.000', 50000),
    ('Rp50.000', 50000),
    ('Rp. 50.000,-', 50000),
    ('rp 50000', 50000),
    ('50.000', 50000),
    ('50000', 50000),
    ('50,000', 50000),
    ('50 rb', 50000),
    ('50rb', 50000),
    ('50 ribu', 50000),
    ('50k', 50000),
    ('1,5jt', 1500000),
    ('1.5 juta', 1500000),
    ('2 juta', 2000000),
    ('500k', 500000),
    ('1jt500rb', 1500000),
    ('1 juta 500 ribu', 1500000),
    ('lima puluh ribu', 50000),
    ('seratus ribu', 100000),
    ('seribu', 1000),
    ('dua juta lima ratus ribu', 2500000),
    ('setengah juta', 500000),
    ('goceng', 5000),
    ('ceban', 10000),
    ('gocap', 50000),
    ('cepek', 100000),
    ('cepek ceng', 100000),
    ('5 ceban', 50000),
    ('beli bakso 15rb pakai gopay', 15000),
    ('kopi susu 20k', 20000),
    ('gajian 5jt masuk bca', 5000000),
    ('bayar listrik 200rb dari mandiri', 200000),
    ('transfer 500rb dari bca ke gopay', 500000)
]

print("=== UNIT TEST: INDONESIAN NOMINAL PARSER (PART 14.5 SPEC) ===")
passed = 0
failed = 0

for text, expected in test_cases:
    result = server.parse_indonesian_amount(text)
    if result == expected:
        print(f"  [PASS] '{text}' => Rp{result:,}".replace(',', '.'))
        passed += 1
    else:
        print(f"  [FAIL] '{text}' => Got: {result}, Expected: {expected}")
        failed += 1

print(f"\nResults: {passed} PASSED, {failed} FAILED out of {len(test_cases)} tests.")
if failed > 0:
    sys.exit(1)
print("ALL TESTS PASSED SUCCESSFULLY!")
