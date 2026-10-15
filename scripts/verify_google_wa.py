#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verification Script for Google and WhatsApp Integrations in TataDana
"""
import sys
import os
import json
import urllib.request
import urllib.error

# Ensure UTF-8 on Windows
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX_PATH = os.path.join(BASE_DIR, 'public', 'index.html')
SERVER_URL = "http://localhost:3000"

def test_index_file():
    print("[1/5] Memeriksa konten public/index.html...")
    with open(INDEX_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    checks = [
        ("Google Modal", 'id="google-account-modal"'),
        ("WhatsApp OTP Modal", 'id="whatsapp-otp-modal"'),
        ("WhatsApp Chat Modal", 'id="whatsapp-modal"'),
        ("Google Settings Subtab", "switchSettingsSubtab('google')"),
        ("WhatsApp Settings Subtab", "switchSettingsSubtab('whatsapp')"),
        ("Google Account Chooser Function", "function selectGoogleAccount"),
        ("Google Sheets Sync Function", "function syncGoogleSheetsNow"),
        ("WhatsApp OTP Functions", "function sendWhatsAppOtp"),
        ("WhatsApp Chat Assistant Functions", "function sendWhatsAppChatMessage"),
        ("WhatsApp Navbar Button", "openWhatsAppSimulator"),
        ("Dual Auth Buttons", "openGoogleAccountModal")
    ]

    for label, pattern in checks:
        if pattern in content:
            print(f"  ✓ {label}: Ditemukan")
        else:
            print(f"  ✗ {label}: TIDAK DITEMUKAN!")
            return False
    return True

def test_api_google_status():
    print("\n[2/5] Menguji GET /api/google/status...")
    try:
        req = urllib.request.Request(f"{SERVER_URL}/api/google/status")
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print(f"  ✓ Status: HTTP {resp.status}")
            print(f"  ✓ Terhubung: {data.get('isConnected')}")
            print(f"  ✓ Akun Google: {data.get('email')} ({data.get('name')})")
            print(f"  ✓ Spreadsheet: {data.get('spreadsheetName')}")
            assert data.get('ok') is True
            return True
    except Exception as e:
        print(f"  ✗ Gagal: {e}")
        return False

def test_api_google_sync():
    print("\n[3/5] Menguji POST /api/google/sync-sheets...")
    try:
        req = urllib.request.Request(
            f"{SERVER_URL}/api/google/sync-sheets",
            data=json.dumps({"test": True}).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print(f"  ✓ Status: HTTP {resp.status}")
            print(f"  ✓ Respon: {data.get('message')}")
            print(f"  ✓ Synced Rows: {data.get('syncedCount')} baris")
            assert data.get('ok') is True
            return True
    except Exception as e:
        print(f"  ✗ Gagal: {e}")
        return False

def test_api_wa_status():
    print("\n[4/5] Menguji GET /api/whatsapp/status...")
    try:
        req = urllib.request.Request(f"{SERVER_URL}/api/whatsapp/status")
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print(f"  ✓ Status: HTTP {resp.status}")
            print(f"  ✓ Terhubung: {data.get('isConnected')}")
            print(f"  ✓ Nomor Bot WA: {data.get('botPhone')}")
            print(f"  ✓ Gateway: {data.get('gatewayStatus')}")
            assert data.get('ok') is True
            return True
    except Exception as e:
        print(f"  ✗ Gagal: {e}")
        return False

def test_api_wa_assistant():
    print("\n[5/5] Menguji POST /api/whatsapp/send-message (NLP NLP Parser)...")
    try:
        sample_messages = [
            "beli nasi padang 25rb pakai gopay",
            "gajian 6jt masuk bca",
            "saldo",
            "jatah"
        ]
        for msg in sample_messages:
            req = urllib.request.Request(
                f"{SERVER_URL}/api/whatsapp/send-message",
                data=json.dumps({"text": msg}).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                reply_first_line = data.get('reply', '').split('\n')[0]
                print(f"  ✓ Input: '{msg}' -> Bot Reply: '{reply_first_line}'")
                assert data.get('ok') is True
        return True
    except Exception as e:
        print(f"  ✗ Gagal: {e}")
        return False

if __name__ == "__main__":
    print("=" * 65)
    print("  VERIFIKASI INTEGRASI GOOGLE & WHATSAPP (TATADANA)")
    print("=" * 65)
    t1 = test_index_file()
    t2 = test_api_google_status()
    t3 = test_api_google_sync()
    t4 = test_api_wa_status()
    t5 = test_api_wa_assistant()

    print("\n" + "=" * 65)
    if all([t1, t2, t3, t4, t5]):
        print("  🎉 SEMUA 5/5 PENGUJIAN INTEGRASI GOOGLE & WA SUKSES!")
        print("=" * 65)
        sys.exit(0)
    else:
        print("  ❌ ADA PENGUJIAN YANG GAGAL.")
        print("=" * 65)
        sys.exit(1)
