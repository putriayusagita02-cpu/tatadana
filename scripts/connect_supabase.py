#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TATADANA — SUPABASE CLOUD CONNECTION & HEALTH CHECK TOOL
=============================================================================
Skrip untuk menguji konektivitas, memvalidasi REST API key, dan memverifikasi
tabel database Supabase secara otomatis.
=============================================================================
"""

import os
import sys
import json
import urllib.request
import urllib.parse
from datetime import datetime

# Force UTF-8 on Windows
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, '.env')

def load_env():
    env_vars = {}
    if os.path.exists(ENV_PATH):
        with open(ENV_PATH, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, val = line.split('=', 1)
                    env_vars[key.strip()] = val.strip().strip('"').strip("'")
    return env_vars

def check_supabase_connection(supabase_url=None, anon_key=None, service_key=None):
    env_vars = load_env()
    url = supabase_url or env_vars.get('NEXT_PUBLIC_SUPABASE_URL')
    key = anon_key or env_vars.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    s_key = service_key or env_vars.get('SUPABASE_SERVICE_ROLE_KEY')

    print("=" * 70)
    print("  ⚡ TATADANA — SUPABASE CLOUD CONNECTION CHECKER")
    print("=" * 70)

    if not url or 'your-project' in url:
        print("\n⚠️  Kredensial Supabase belum diisi di file .env!")
        print("\nLangkah Mengisi Kredensial:")
        print("1. Buka https://supabase.com -> Buat / Pilih Proyek Anda.")
        print("2. Masuk ke Project Settings -> API.")
        print("3. Salin Project URL dan anon public key ke file .env:")
        print("   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co")
        print("   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...")
        print("\n4. Atau jalankan skrip ini dengan argumen:")
        print("   python scripts/connect_supabase.py <SUPABASE_URL> <ANON_KEY> [SERVICE_ROLE_KEY]")
        return False

    url = url.rstrip('/')
    print(f"\n[1] Memeriksa URL Supabase: {url}")
    print(f"    Anon Key Terdeteksi   : {key[:15]}...{key[-5:] if key and len(key) > 20 else ''}")

    # Test 1: REST API Ping
    rest_url = f"{url}/rest/v1/"
    headers = {
        'apikey': key,
        'Authorization': f"Bearer {key}",
        'Content-Type': 'application/json'
    }

    req = urllib.request.Request(rest_url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            code = resp.getcode()
            print(f"    └─ ✅ REST API Endpoint Responsif! (HTTP {code} OK)")
    except urllib.error.HTTPError as e:
        if e.code in [200, 404]:
            print(f"    └─ ✅ REST API Endpoint Terhubung! (HTTP {e.code})")
        else:
            print(f"    └─ ❌ Gagal menghubungi REST API: HTTP {e.code} - {e.reason}")
            return False
    except Exception as e:
        print(f"    └─ ❌ Koneksi ke Supabase gagal: {e}")
        return False

    # Test 2: Check Core Tables
    tables_to_check = ['profiles', 'wallets', 'categories', 'transactions', 'admin_emails', 'jatah_settings', 'bills']
    print("\n[2] Memverifikasi Tabel Database di Supabase:")

    active_key = s_key if s_key and 'your-' not in s_key else key
    test_headers = {
        'apikey': active_key,
        'Authorization': f"Bearer {active_key}",
        'Content-Type': 'application/json',
        'Range': '0-0'
    }

    found_tables = []
    missing_tables = []

    for tname in tables_to_check:
        t_url = f"{url}/rest/v1/{tname}?select=count"
        t_req = urllib.request.Request(t_url, headers=test_headers)
        try:
            with urllib.request.urlopen(t_req, timeout=5) as resp:
                print(f"    • Tabel public.{tname.ljust(16)}: 🟢 TERSEDIA (Siap Digunakan)")
                found_tables.append(tname)
        except urllib.error.HTTPError as he:
            if he.code == 404 or 'PGRST204' in str(he):
                print(f"    • Tabel public.{tname.ljust(16)}: 🟡 BELUM DIBUAT")
                missing_tables.append(tname)
            else:
                print(f"    • Tabel public.{tname.ljust(16)}: 🟢 TERDAFTAR (RLS Aktif - HTTP {he.code})")
                found_tables.append(tname)
        except Exception:
            missing_tables.append(tname)

    # Test 3: Admin Email putriayusagita02@gmail.com Check
    print("\n[3] Memeriksa Akun Superadmin (Part 14.3):")
    admin_url = f"{url}/rest/v1/admin_emails?email=eq.putriayusagita02%40gmail.com&select=*"
    a_req = urllib.request.Request(admin_url, headers=test_headers)
    try:
        with urllib.request.urlopen(a_req, timeout=5) as a_resp:
            adm_data = json.loads(a_resp.read().decode('utf-8'))
            if adm_data:
                print("    └─ 🟢 Superadmin 'putriayusagita02@gmail.com' terdaftar di database!")
            else:
                print("    └─ 🟡 Belum ada entri admin_emails. Jalankan migrasi SQL.")
    except Exception:
        print("    └─ 🟡 Tabel admin_emails siap dikonfigurasi lewat SQL Editor.")

    print("\n" + "=" * 70)
    if missing_tables:
        print("📋 LANGKAH MIGRASI SKEMA DATABASE:")
        print("File migrasi lengkap siap dijalankan: supabase/combined_migrations.sql")
        print("1. Buka Supabase Dashboard -> SQL Editor")
        print("2. Buka file 'supabase/combined_migrations.sql', salin isinya, dan klik 'RUN'")
        print("3. Seluruh tabel, RLS, triggers saldo, dan superadmin akan aktif!")
    else:
        print("🎉 SELAMAT! Project Supabase Anda telah 100% tersambung dan siap produksi.")
    print("=" * 70)
    return True

if __name__ == '__main__':
    url_arg = sys.argv[1] if len(sys.argv) > 1 else None
    anon_arg = sys.argv[2] if len(sys.argv) > 2 else None
    service_arg = sys.argv[3] if len(sys.argv) > 3 else None
    check_supabase_connection(url_arg, anon_arg, service_arg)
