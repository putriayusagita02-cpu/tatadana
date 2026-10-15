"""
TataDana Online Tunnel Runner & Webhook Integrator
Menjalankan TataDana Server di port 3000 dan membuka akses publik HTTPS
menggunakan Cloudflare Tunnel, Pinggy SSH, Localtunnel, atau Serveo.
"""

import os
import sys
import time
import json
import re
import socket
import subprocess
import threading
import urllib.request
import urllib.parse
import shutil

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')
PORT = 3000
TELEGRAM_TOKEN = "8725228830:AAF_56hbKIHdFIO7dWEEBaFo8dsFn5zoqDc"
TELEGRAM_BOT = "PasgtaBot"
ONLINE_URL_FILE = os.path.join(PUBLIC_DIR, "online_url.txt")
ROOT_URL_FILE = os.path.join(BASE_DIR, "public_url.txt")
TUNNEL_INFO_FILE = os.path.join(PUBLIC_DIR, "tunnel_info.json")

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(('127.0.0.1', port)) == 0

def ensure_server_running():
    if is_port_in_use(PORT):
        print(f"[OK] TataDana server sudah aktif di port {PORT}.")
        return None

    print(f"[+] Menjalankan server.py di port {PORT}...")
    server_script = os.path.join(BASE_DIR, 'server.py')
    proc = subprocess.Popen([sys.executable, server_script], cwd=BASE_DIR)

    # Tunggu sampai port siap
    for _ in range(25):
        time.sleep(0.4)
        if is_port_in_use(PORT):
            print(f"[OK] TataDana server berhasil aktif di http://localhost:{PORT}")
            return proc
    print("[!] Peringatan: Server belum merespon di port 3000, melanjutkan...")
    return proc

def set_telegram_webhook(public_url):
    if not public_url or not public_url.startswith("https://"):
        print("[!] Webhook Telegram membutuhkan URL berawalan https://")
        return False

    webhook_url = f"{public_url.rstrip('/')}/api/telegram/webhook"
    api_url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/setWebhook?url={urllib.parse.quote(webhook_url)}"

    try:
        req = urllib.request.Request(api_url, headers={'User-Agent': 'TataDana-Setup/1.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if data.get('ok'):
                print(f"[OK] Telegram Webhook BERHASIL diset ke: {webhook_url}")
                return True
            else:
                print(f"[!] Gagal set webhook: {data.get('description')}")
                return False
    except Exception as e:
        print(f"[!] Pengecualian saat set webhook Telegram: {e}")
        return False

def save_and_announce_url(public_url, method_name):
    clean_url = public_url.strip().rstrip('/')
    # Simpan ke file untuk referensi frontend & backend
    try:
        os.makedirs(PUBLIC_DIR, exist_ok=True)
        with open(ONLINE_URL_FILE, 'w', encoding='utf-8') as f:
            f.write(clean_url + '\n')
        with open(ROOT_URL_FILE, 'w', encoding='utf-8') as f:
            f.write(clean_url + '\n')
        with open(TUNNEL_INFO_FILE, 'w', encoding='utf-8') as f:
            json.dump({
                'public_url': clean_url,
                'method': method_name,
                'telegram_bot': f"@{TELEGRAM_BOT}",
                'webhook_url': f"{clean_url}/api/telegram/webhook",
                'timestamp': time.time()
            }, f, indent=2)
    except Exception as e:
        print(f"[!] Gagal menulis online_url file: {e}")

    # Coba copy ke clipboard Windows
    clip_note = ""
    try:
        subprocess.run(['clip'], input=clean_url.encode('utf-8'), check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        clip_note = "(Tersalin ke Clipboard!)"
    except Exception:
        pass

    print_banner(clean_url, method_name, clip_note)

    # Otomatis hubungkan webhook Telegram
    set_telegram_webhook(clean_url)

def print_banner(public_url=None, method_name=None, extra=""):
    print("\n" + "=" * 76)
    print("           TATADANA FINTECH APP — GERBANG AKSES ONLINE TERBUKA")
    print("=" * 76)
    print(f"  • Local Server        : http://localhost:{PORT}")
    if public_url:
        print(f"  • PUBLIC HTTPS URL    : {public_url} {extra}")
        print(f"  • Portal Superadmin   : {public_url}/admin")
        print(f"  • Pendaftaran Akun    : {public_url}/register")
        print(f"  • Metode Tunneling    : {method_name}")
        print(f"  • Telegram Bot        : @{TELEGRAM_BOT} (https://t.me/{TELEGRAM_BOT})")
        print(f"  • Webhook Endpoint    : {public_url}/api/telegram/webhook")
    print("-" * 76)
    print("  5 FITUR UTAMA TERINTEGRASI PENUH:")
    print("  1. Persetujuan Akun   : Pendaftar baru berstatus 'pending', wajib disetujui Superadmin")
    print("  2. Pemisahan Portal   : Login user (/login) bersih, Superadmin login di /admin")
    print("  3. Telegram Bot OTP   : Link instan ke @PasgtaBot via deep link /start OTP_...")
    print("  4. Default Guest Mode : Membuka / langsung tampil Landing Page (tanpa auto-login)")
    print("  5. Nominal Fleksibel  : Input Rp50.000, 50 rb, 50k, 1,5jt, gocap, 250rb terkonversi")
    print("=" * 76 + "\n")

def find_ssh_executable():
    ssh = shutil.which('ssh')
    if ssh:
        return ssh
    # Cek OpenSSH bawaan Windows
    win_ssh = r"C:\Windows\System32\OpenSSH\ssh.exe"
    if os.path.exists(win_ssh):
        return win_ssh
    return None

def run_tunnel_process(cmd, url_regex, method_name):
    """Menjalankan proses tunnel, membaca output secara real-time, mendeteksi URL HTTPS"""
    print(f"[*] Menjalankan {method_name}...")
    print(f"    Perintah: {' '.join(cmd)}")
    try:
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            cwd=BASE_DIR
        )
    except Exception as e:
        print(f"[!] Gagal memulai proses tunnel: {e}")
        return None, None

    url_found = None
    stop_event = threading.Event()

    def stream_reader():
        nonlocal url_found
        compiled_regex = re.compile(url_regex, re.IGNORECASE)
        for line in iter(proc.stdout.readline, ''):
            if not line:
                break
            clean_line = line.strip()
            if not url_found:
                if "dashboard.pinggy" in clean_line or "localhost.run/docs" in clean_line:
                    continue
                match = compiled_regex.search(clean_line)
                if match:
                    candidate = match.group(0).strip().rstrip('.,;')
                    if "dashboard" in candidate:
                        continue
                    url_found = candidate
                    if not url_found.startswith('https://') and url_found.startswith('http://'):
                        url_found = 'https://' + url_found[7:]
                    save_and_announce_url(url_found, method_name)
                    stop_event.set()
        try:
            proc.stdout.close()
        except Exception:
            pass

    t = threading.Thread(target=stream_reader, daemon=True)
    t.start()

    stop_event.wait(timeout=20)
    return proc, url_found

def ensure_ssh_key():
    try:
        ssh_dir = os.path.expanduser('~/.ssh')
        os.makedirs(ssh_dir, exist_ok=True)
        key_path = os.path.join(ssh_dir, 'id_ed25519')
        if not os.path.exists(key_path):
            subprocess.run(['ssh-keygen', '-t', 'ed25519', '-N', '', '-f', key_path], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        pass

def run_localhost_run():
    ssh = find_ssh_executable()
    if not ssh:
        print("[!] OpenSSH client (ssh.exe) tidak ditemukan.", flush=True)
        return None, None
    ensure_ssh_key()
    cmd = [ssh, "-o", "StrictHostKeyChecking=no", "-o", "ServerAliveInterval=30", "-R", "80:127.0.0.1:3000", "nokey@localhost.run"]
    regex = r"https://[a-zA-Z0-9-]+\.lhr\.life"
    return run_tunnel_process(cmd, regex, "Localhost.run SSH Tunnel")

def run_pinggy():
    ssh = find_ssh_executable()
    if not ssh:
        print("[!] OpenSSH client (ssh.exe) tidak ditemukan.", flush=True)
        return None, None
    ensure_ssh_key()
    cmd = [ssh, "-p", "443", "-R0:127.0.0.1:3000", "-o", "StrictHostKeyChecking=no", "-o", "ServerAliveInterval=30", "-T", "a.pinggy.io"]
    regex = r"https://[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.(?:pinggy\.net|pinggy-free\.link|pinggy\.link)"
    return run_tunnel_process(cmd, regex, "Pinggy SSH Tunnel")

def run_cloudflared():
    cf = shutil.which('cloudflared.exe') or shutil.which('cloudflared')
    if not cf:
        print("[!] cloudflared tidak ditemukan di PATH.", flush=True)
        return None, None
    cmd = [cf, "tunnel", "--url", "http://127.0.0.1:3000"]
    regex = r"https://[a-zA-Z0-9-]+\.trycloudflare\.com"
    return run_tunnel_process(cmd, regex, "Cloudflare Quick Tunnel")

def run_localtunnel():
    npx = shutil.which('npx.cmd') or shutil.which('npx')
    if not npx:
        print("[!] Node.js / npx tidak ditemukan di PATH.", flush=True)
        return None, None
    cmd = [npx, "--yes", "localtunnel", "--port", "3000", "--local-host", "127.0.0.1"]
    regex = r"https://[a-zA-Z0-9-]+\.loca\.lt"
    return run_tunnel_process(cmd, regex, "Localtunnel")

def run_serveo():
    ssh = find_ssh_executable()
    if not ssh:
        return None, None
    cmd = [ssh, "-R", "80:127.0.0.1:3000", "-o", "StrictHostKeyChecking=no", "serveo.net"]
    regex = r"https://[a-zA-Z0-9-]+\.serveo\.net"
    return run_tunnel_process(cmd, regex, "Serveo SSH Tunnel")

def auto_detect_and_run():
    print("[*] Mencari metode tunneling otomatis terbaik yang aktif di sistem...", flush=True)
    ssh = find_ssh_executable()
    # 1. Coba Localhost.run via OpenSSH Windows (Nol konfigurasi, zero interstitial, bersih)
    if ssh:
        print(f"[+] OpenSSH terdeteksi: {ssh}. Memulai tunnel Localhost.run...", flush=True)
        proc, url = run_localhost_run()
        if url: return proc, url

    # 2. Coba Pinggy via OpenSSH Windows
    if ssh:
        print(f"[+] Mencoba Pinggy...", flush=True)
        proc, url = run_pinggy()
        if url: return proc, url

    # 4. Coba Localtunnel via npx
    if shutil.which('npx.cmd') or shutil.which('npx'):
        print("[+] npx terdeteksi.", flush=True)
        proc, url = run_localtunnel()
        if url: return proc, url

    # 5. Coba Serveo
    if ssh:
        proc, url = run_serveo()
        if url: return proc, url

    print("[!] Tidak ada tunnel otomatis yang mendapatkan URL.", flush=True)
    return None, None

def main():
    print_banner()
    server_proc = ensure_server_running()

    # CLI mode
    if len(sys.argv) > 1:
        arg = sys.argv[1].lower()
        if arg in ('--auto', '-a'):
            tunnel_proc, url = auto_detect_and_run()
        elif arg in ('--lhr', '--localhost-run'):
            tunnel_proc, url = run_localhost_run()
        elif arg in ('--pinggy', '-p'):
            tunnel_proc, url = run_pinggy()
        elif arg in ('--cloudflared', '--cf', '-c'):
            tunnel_proc, url = run_cloudflared()
        elif arg in ('--localtunnel', '--lt', '-l'):
            tunnel_proc, url = run_localtunnel()
        elif arg in ('--serveo', '-s'):
            tunnel_proc, url = run_serveo()
        elif arg.startswith('http'):
            save_and_announce_url(sys.argv[1], "Custom Public Tunnel URL")
            tunnel_proc, url = None, sys.argv[1]
        else:
            tunnel_proc, url = auto_detect_and_run()
    else:
        print("\nPilihan Metode Online Tunneling:")
        print("1. [Auto-Detect] Terhubung otomatis via Localhost.run / Cloudflare / OpenSSH (Direkomendasikan)")
        print("2. Localhost.run SSH Tunnel (Zero-Install Windows OpenSSH)")
        print("3. Pinggy SSH Tunnel (qr@a.pinggy.io)")
        print("4. Cloudflare Quick Tunnel (cloudflared)")
        print("5. Localtunnel (npx / Node.js)")
        print("6. Serveo SSH Tunnel (ssh serveo.net)")
        print("7. Hubungkan Webhook Telegram ke URL Publik Kustom")
        print("8. Hanya jalankan server lokal (http://localhost:3000)")

        try:
            choice = input("\nPilih opsi [1-8] (default 1): ").strip() or "1"
        except (EOFError, KeyboardInterrupt):
            choice = "1"

        tunnel_proc, url = None, None
        if choice == '1':
            tunnel_proc, url = auto_detect_and_run()
        elif choice == '2':
            tunnel_proc, url = run_localhost_run()
        elif choice == '3':
            tunnel_proc, url = run_pinggy()
        elif choice == '4':
            tunnel_proc, url = run_cloudflared()
        elif choice == '5':
            tunnel_proc, url = run_localtunnel()
        elif choice == '6':
            tunnel_proc, url = run_serveo()
        elif choice == '7':
            try:
                custom_url = input("Masukkan URL publik HTTPS (contoh: https://xxx.trycloudflare.com): ").strip()
                if custom_url:
                    save_and_announce_url(custom_url, "Custom Public URL")
                    url = custom_url
            except Exception:
                pass
        elif choice == '8':
            print("[*] Mode server lokal saja aktif.")

    print("\n[*] TataDana Online Service AKTIF. Tekan Ctrl+C untuk berhenti.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[*] Menghentikan server & tunnel...")
        if tunnel_proc:
            try: tunnel_proc.terminate()
            except Exception: pass
        if server_proc:
            try: server_proc.terminate()
            except Exception: pass
        print("[OK] Selesai.")

if __name__ == '__main__':
    main()
