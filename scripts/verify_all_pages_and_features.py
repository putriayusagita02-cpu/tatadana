import urllib.request
import json
import sys

def run_tests():
    print("=================================================================")
    print("  TEST 1: SPA DIRECT HTML5 ROUTES (MUST RETURN HTTP 200)")
    print("=================================================================")
    routes = [
        ('/', 'Beranda'),
        ('/landing', 'Landing Page'),
        ('/dashboard', 'User Dashboard'),
        ('/admin', 'Admin Dashboard'),
        ('/login', 'Halaman Login'),
        ('/register', 'Halaman Register'),
        ('/google', 'Integrasi Google & Sheets'),
        ('/whatsapp', 'WhatsApp Assistant Full'),
        ('/wa', 'WhatsApp Assistant Alias'),
        ('/telegram', 'Telegram Bot Integration')
    ]

    for route, label in routes:
        url = f"http://localhost:3000{route}"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as resp:
            status = resp.getcode()
            ctype = resp.headers.get('Content-Type', '')
            body = resp.read()[:50].decode('utf-8', errors='ignore')
            assert status == 200, f"Expected 200 for {route}, got {status}"
            assert 'text/html' in ctype, f"Expected text/html for {route}, got {ctype}"
            assert '<!DOCTYPE html>' in body, f"Expected HTML content for {route}"
            print(f"  [PASS] {label:28} -> {route:12} : HTTP {status} (HTML5 SPA Served Directly)")

    print("\n=================================================================")
    print("  TEST 2: API STATUS & REALTIME ENDPOINTS")
    print("=================================================================")
    apis = [
        ('/api/telegram/status', 'Telegram Bot Status'),
        ('/api/live-sync', 'Realtime Transaksi Sync'),
        ('/api/google/status', 'Google OAuth & Sheets Status'),
        ('/api/whatsapp/status', 'WhatsApp Assistant Gateway Status')
    ]

    for ep, label in apis:
        url = f"http://localhost:3000{ep}"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as resp:
            status = resp.getcode()
            data = json.loads(resp.read().decode('utf-8'))
            assert status == 200, f"Expected 200 for {ep}, got {status}"
            assert data.get('ok') is True, f"Expected ok=True for {ep}"
            print(f"  [PASS] {label:32} -> {ep:22} : HTTP {status} | ok=True")

    print("\n=================================================================")
    print("  TEST 3: WHATSAPP OTP & CHAT SIMULATOR NLP")
    print("=================================================================")
    # 3.1 Send OTP
    otp_req = urllib.request.Request(
        'http://localhost:3000/api/whatsapp/send-otp',
        data=json.dumps({'phone': '+6281234567890'}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(otp_req, timeout=5) as resp:
        otp_res = json.loads(resp.read().decode('utf-8'))
        assert otp_res.get('ok') is True
        assert otp_res.get('otp') == '728491'
        print(f"  [PASS] WhatsApp Send OTP          -> Kode OTP: {otp_res.get('otp')} (Target: {otp_res.get('phone')})")

    # 3.2 Verify OTP
    verify_req = urllib.request.Request(
        'http://localhost:3000/api/whatsapp/verify-otp',
        data=json.dumps({'code': '728491'}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(verify_req, timeout=5) as resp:
        v_res = json.loads(resp.read().decode('utf-8'))
        assert v_res.get('ok') is True
        print(f"  [PASS] WhatsApp Verify OTP        -> Berhasil diverifikasi!")

    # 3.3 Chat Simulator
    chat_req = urllib.request.Request(
        'http://localhost:3000/api/whatsapp/send-message',
        data=json.dumps({'text': 'beli makan 25rb pakai gopay'}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(chat_req, timeout=5) as resp:
        c_res = json.loads(resp.read().decode('utf-8'))
        assert c_res.get('ok') is True
        reply_safe = c_res.get('reply', '').encode('ascii', errors='ignore').decode('ascii')
        print(f"  [PASS] WhatsApp Chat Simulator    -> Sukses membalas pencatatan: {reply_safe[:45].strip()}...")

    print("\n=================================================================")
    print("  TEST 4: GOOGLE SHEETS 2-WAY SYNC")
    print("=================================================================")
    g_req = urllib.request.Request('http://localhost:3000/api/google/sync-sheets', data=b'{}', headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(g_req, timeout=5) as resp:
        g_res = json.loads(resp.read().decode('utf-8'))
        assert g_res.get('ok') is True
        print(f"  [PASS] Google Sheets Sync         -> {g_res.get('message')}")

    print("\n=================================================================")
    print("  [SUCCESS] SEMUA 10 TAUTAN HALAMAN, API, GOOGLE & WA BERJALAN 100%!")
    print("=================================================================")

if __name__ == '__main__':
    run_tests()
