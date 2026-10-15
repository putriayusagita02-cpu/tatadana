# -*- coding: utf-8 -*-
"""
Test category detection keywords in Python (ASCII-safe terminal prints)
"""

def detect_category(text):
    t = text.lower()
    
    # 1. Transportasi
    transport_kw = ['bensin', 'pertalite', 'pertamax', 'solar', 'bbm', 'gojek', 'grab', 'maxim', 'ojol', 'taksi', 'taxi', 'parkir', 'tol', 'krl', 'mrt', 'kereta', 'busway', 'transjakarta', 'servis', 'tambal ban', 'oli', 'ongkir', 'transport']
    if any(k in t for k in transport_kw):
        return '🚗 Transportasi'
        
    # 2. Tagihan & Utilitas
    bill_kw = ['listrik', 'pln', 'token', 'air', 'pdam', 'wifi', 'internet', 'indihome', 'biznet', 'pulsa', 'kuota', 'telkomsel', 'xl', 'indosat', 'kos', 'kost', 'kontrakan', 'sewa', 'bpjs', 'pbb', 'tagihan', 'cicilan', 'asuransi']
    if any(k in t for k in bill_kw):
        return '🏠 Tagihan & Utilitas'
        
    # 3. Belanja Kebutuhan
    shop_kw = ['belanja', 'indomaret', 'alfamart', 'supermarket', 'hypermart', 'transmart', 'sabun', 'shampo', 'odol', 'deterjen', 'minyak', 'beras', 'telur', 'pasar', 'sayur', 'bumbu', 'tisu', 'shopee', 'tokopedia', 'tiktok shop', 'lazada', 'baju', 'celana', 'sepatu', 'tas', 'skincare', 'makeup']
    if any(k in t for k in shop_kw):
        return '🛒 Belanja Kebutuhan'
        
    # 4. Kesehatan & Medis
    health_kw = ['obat', 'apotek', 'apotik', 'kimia farma', 'k24', 'dokter', 'rumah sakit', 'klinik', 'rs', 'vitamin', 'masker', 'panadol', 'paracetamol', 'bodrex', 'tolak angin', 'periksa', 'medis']
    if any(k in t for k in health_kw):
        return '💊 Kesehatan & Medis'
        
    # 5. Hiburan & Kopi
    fun_kw = ['kopi', 'coffee', 'starbucks', 'kenangan', 'janji jiwa', 'cafe', 'kafe', 'nongkrong', 'nonton', 'bioskop', 'cinema', 'xxi', 'cgv', 'netflix', 'spotify', 'youtube', 'game', 'steam', 'topup', 'diamond', 'mlbb', 'pubg', 'jalan-jalan', 'liburan', 'karaoke']
    if any(k in t for k in fun_kw):
        return '🎮 Hiburan & Kopi'
        
    # 6. Makanan & Minuman (default expense)
    food_kw = ['makan', 'minum', 'sarapan', 'lunch', 'dinner', 'bakso', 'mie', 'nasi', 'ayam', 'sate', 'geprek', 'padang', 'warteg', 'snack', 'roti', 'kue', 'jajan', 'burger', 'pizza', 'mcd', 'kfc', 'hokben', 'resto', 'restoran', 'gofood', 'grabfood', 'shopeefood']
    if any(k in t for k in food_kw):
        return '🍜 Makanan & Minuman'
        
    return '🍜 Makanan & Minuman'

# Test various sentences
tests = [
    ("beli bensin 50rb", "🚗 Transportasi"),
    ("gojek ke stasiun 18rb", "🚗 Transportasi"),
    ("bayar listrik pln 200rb", "🏠 Tagihan & Utilitas"),
    ("pulsa telkomsel 50rb", "🏠 Tagihan & Utilitas"),
    ("belanja indomaret point 125rb", "🛒 Belanja Kebutuhan"),
    ("beli sabun dan beras di alfamart", "🛒 Belanja Kebutuhan"),
    ("panadol dan obat batuk di apotek k24", "💊 Kesehatan & Medis"),
    ("nongkrong cafe kopi kenangan 35k", "🎮 Hiburan & Kopi"),
    ("nonton xxi berdua 100k", "🎮 Hiburan & Kopi"),
    ("nasi padang rendang 25rb", "🍜 Makanan & Minuman"),
    ("beli sate kambing 35rb", "🍜 Makanan & Minuman"),
]

for text, expected in tests:
    res = detect_category(text)
    assert res == expected, f"Failed for '{text}': got {res}, expected {expected}"

print("[SUCCESS] All 11 natural language test cases classified accurately!")
