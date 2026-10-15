import re
import os

html_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public', 'index.html')
print(f"Target file: {html_path}")

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

print(f"Original length: {len(content)} characters")

# 1. Update Header Navigation in HTML (remove hardcoded 4 pages from static header)
old_nav_html = """      <!-- Center Navigation Links (4 Halaman Utama) -->
      <nav class="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-600">
        <a href="/landing" onclick="navigate('landing'); return false;" class="hover:text-brand-500 transition font-semibold flex items-center gap-1.5 text-slate-800">
          <span>🏠</span><span>Landing Page</span>
        </a>
        <a href="/login" onclick="navigate('auth-login'); return false;" class="hover:text-brand-500 transition font-semibold flex items-center gap-1.5 text-slate-700">
          <span>🔑</span><span>Login</span>
        </a>
        <a href="/dashboard" onclick="navigate('dashboard'); return false;" class="hover:text-brand-500 transition font-bold text-brand-600 flex items-center gap-1.5">
          <span>📊</span><span>User Dashboard</span>
          <span class="text-[10px] bg-rose-100 text-brand-600 px-1.5 py-0.2 rounded-full font-bold">App</span>
        </a>
        <a href="/admin" onclick="navigate('admin'); return false;" class="hover:text-slate-900 transition font-medium flex items-center gap-1.5 text-slate-600">
          <span>🛡️</span><span>Admin Dashboard</span>
        </a>
        <button onclick="openFaqHelpModal()" class="hover:text-brand-500 transition flex items-center gap-1 text-slate-600 font-medium">
          <span>❓</span><span>FAQ</span>
        </button>
      </nav>"""

new_nav_html = """      <!-- Center Navigation Links (Dinamis sesuai Halaman & Status Login) -->
      <nav id="header-center-nav" class="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-600">
        <!-- Rendered dynamically by renderHeaderNav() -->
      </nav>"""

if old_nav_html in content:
    content = content.replace(old_nav_html, new_nav_html)
    print("1. Replaced static header navigation with dynamic container #header-center-nav")
else:
    print("Warning: old_nav_html not found exactly, attempting regex")
    content = re.sub(
        r'<!-- Center Navigation Links.*?<\/nav>',
        new_nav_html,
        content,
        flags=re.DOTALL
    )
    print("1. Replaced static header navigation via regex")

# 2. Remove quick-page-dock at bottom
dock_pattern = r'<!-- FLOATING QUICK NAVIGATION DOCK.*?<\/div>\s*<\/body>'
if re.search(dock_pattern, content, flags=re.DOTALL):
    content = re.sub(dock_pattern, '</body>', content, flags=re.DOTALL)
    print("2. Removed floating quick-page-dock from bottom of page")

# 3. Remove "TAUTAN LANGSUNG 4 HALAMAN UTAMA" from Hero section in landing page
hero_cards_pattern = r'<!-- TAUTAN LANGSUNG 4 HALAMAN UTAMA.*?<\/div>\s*<\/div>\s*<!-- Hero Video Demo Placeholder -->'
if re.search(hero_cards_pattern, content, flags=re.DOTALL):
    content = re.sub(hero_cards_pattern, '<!-- Hero Video Demo Placeholder -->', content, flags=re.DOTALL)
    print("3. Removed 4 direct page cards from hero section in landing page")

# 4. In Hero buttons, change "Buka Dashboard" to "Masuk ke Akun"
content = content.replace(
    """            <button onclick="navigate('dashboard')" class="w-full sm:w-auto px-6 py-3.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-brand-600 font-bold rounded-2xl shadow-sm text-sm transition flex items-center justify-center gap-2">
              <span>📊 Buka Dashboard</span>
            </button>""",
    """            <button onclick="navigate('auth-login')" class="w-full sm:w-auto px-6 py-3.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-brand-600 font-bold rounded-2xl shadow-sm text-sm transition flex items-center justify-center gap-2">
              <span>🔑 Masuk ke Akun</span>
            </button>"""
)
print("4. Updated Hero CTA button to point to auth-login")

# Save updated content
with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Updated length: {len(content)} characters")
