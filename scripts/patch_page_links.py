# -*- coding: utf-8 -*-
"""
Patch public/index.html to add:
1. Prominent navigation links in header navbar for Landing Page, Login, User Dashboard, and Admin Dashboard
2. Floating quick-nav dock at the bottom of the screen with 1-click switcher between the 4 pages
"""

INDEX_PATH = r"C:\Users\Asus\.gemini\antigravity\scratch\tatadana\public\index.html"

def main():
    with open(INDEX_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update Center Navigation in Header
    old_nav = '''      <!-- Center Navigation Links -->
      <nav class="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
        <button onclick="navigate('landing', 'features')" class="hover:text-brand-500 transition">Fitur Unggulan</button>
        <button onclick="navigate('landing', 'tatajatah-preview')" class="hover:text-brand-500 transition font-semibold text-brand-600 flex items-center gap-1">
          <span>TataJatah</span>
          <span class="text-[10px] bg-rose-100 text-brand-600 px-1.5 py-0.2 rounded font-bold">Signature</span>
        </button>
        <button onclick="navigate('landing', 'pricing')" class="hover:text-brand-500 transition">Harga</button>
        <button onclick="openFaqHelpModal()" class="hover:text-brand-500 transition flex items-center gap-1 text-slate-700 font-medium"><span>❓</span><span>FAQ & Help Center</span></button>
        <button onclick="navigate('dashboard')" class="text-brand-600 font-bold hover:text-brand-700 transition flex items-center gap-1.5">
          <span>Web App</span>
          <span class="text-[11px] bg-rose-50 border border-rose-200 text-brand-600 px-2 py-0.5 rounded-full">Live Demo</span>
        </button>
        <button onclick="navigate('admin')" class="text-slate-500 hover:text-slate-900 transition flex items-center gap-1">
          <span>Superadmin</span>
        </button>
      </nav>'''

    new_nav = '''      <!-- Center Navigation Links (4 Halaman Utama) -->
      <nav class="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-600">
        <button onclick="navigate('landing')" class="hover:text-brand-500 transition font-semibold flex items-center gap-1 text-slate-800">
          <span>🏠</span><span>Landing Page</span>
        </button>
        <button onclick="navigate('dashboard')" class="hover:text-brand-500 transition font-bold text-brand-600 flex items-center gap-1">
          <span>📊</span><span>User Dashboard</span>
          <span class="text-[10px] bg-rose-100 text-brand-600 px-1.5 py-0.2 rounded-full font-bold">App</span>
        </button>
        <button onclick="navigate('admin')" class="hover:text-slate-900 transition font-medium flex items-center gap-1 text-slate-600">
          <span>🛡️</span><span>Admin Dashboard</span>
        </button>
        <button onclick="openFaqHelpModal()" class="hover:text-brand-500 transition flex items-center gap-1 text-slate-600 font-medium">
          <span>❓</span><span>FAQ</span>
        </button>
      </nav>'''

    if old_nav in content:
        content = content.replace(old_nav, new_nav)

    # 2. Add Floating Quick-Nav Dock right before </body>
    floating_dock = '''
  <!-- FLOATING QUICK NAVIGATION DOCK (TAUTAN CEPAT HALAMAN) -->
  <div id="quick-page-dock" class="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md border border-rose-200 shadow-xl rounded-full px-3 sm:px-5 py-2 flex items-center space-x-1.5 sm:space-x-2 text-xs font-bold transition-all">
    <span class="text-[10px] text-slate-400 font-semibold hidden lg:inline-block border-r border-slate-200 pr-2">Navigasi Halaman:</span>
    <button onclick="navigate('landing')" class="px-2.5 sm:px-3 py-1.5 rounded-full hover:bg-rose-50 text-slate-700 hover:text-brand-600 transition flex items-center gap-1 whitespace-nowrap">
      <span>🏠</span><span>Landing Page</span>
    </button>
    <button onclick="navigate('auth-login')" class="px-2.5 sm:px-3 py-1.5 rounded-full hover:bg-rose-50 text-slate-700 hover:text-brand-600 transition flex items-center gap-1 whitespace-nowrap">
      <span>🔑</span><span>Login</span>
    </button>
    <button onclick="navigate('dashboard')" class="px-2.5 sm:px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-brand-600 transition flex items-center gap-1 border border-rose-200 whitespace-nowrap">
      <span>📊</span><span>User Dashboard</span>
    </button>
    <button onclick="navigate('admin')" class="px-2.5 sm:px-3 py-1.5 rounded-full hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition flex items-center gap-1 whitespace-nowrap">
      <span>🛡️</span><span>Admin Dashboard</span>
    </button>
  </div>
'''

    if 'id="quick-page-dock"' not in content:
        content = content.replace('</body>', floating_dock + '\n</body>')

    with open(INDEX_PATH, 'w', encoding='utf-8') as f:
        f.write(content)

    print("Successfully patched quick page dock and header links!")

if __name__ == '__main__':
    main()
