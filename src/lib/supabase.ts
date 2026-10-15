/**
 * SUPABASE CLIENT & DATA PROVIDER
 * Mendukung live Supabase client serta fallback offline/mock store
 * untuk pengujian instan di localhost out-of-the-box.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  wallet_name: string;
  category_id: string;
  category_name: string;
  category_emoji: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  notes: string;
  transaction_date: string;
  source: 'telegram' | 'web' | 'receipt_ocr' | 'voice_note';
  receipt_items?: Array<{
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
}

export interface Wallet {
  id: string;
  name: string;
  alias?: string;
  type: 'bank' | 'ewallet' | 'cash';
  balance: number;
  is_default_telegram: boolean;
  is_archived?: boolean;
  color: string;
  icon: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  emoji: string;
  color: string;
  budget_amount?: number;
  spent_amount?: number;
}

export interface FixedBill {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_day: number;
  is_paid_this_cycle: boolean;
}

export interface JatahSettingsRecord {
  user_id: string;
  payday_date: number;
  monthly_savings_target: number;
  enable_rollover: boolean;
}

export interface StreakRecord {
  user_id: string;
  current_streak_days: number;
  longest_streak_days: number;
  last_logged_date: string;
  badges: string[];
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  phone_verified: boolean;
  subscription_plan: 'starter' | 'pro';
  default_currency: string;
  monthly_tx_count: number;
  is_superadmin: boolean;
}

// Initial mock data store for localhost run
export const INITIAL_USER: UserProfile = {
  id: 'usr-001',
  full_name: 'Dimas Kurniawan',
  email: 'dimas@tatadana.id',
  phone_number: '+6281234567890',
  phone_verified: true,
  subscription_plan: 'pro',
  default_currency: 'IDR',
  monthly_tx_count: 18,
  is_superadmin: true,
};

export const INITIAL_WALLETS: Wallet[] = [
  { id: 'w-1', name: 'BCA Utama', alias: 'bca', type: 'bank', balance: 5240000, is_default_telegram: true, is_archived: false, color: '#F43F5E', icon: 'building' },
  { id: 'w-2', name: 'GoPay', alias: 'gopay', type: 'ewallet', balance: 420000, is_default_telegram: false, is_archived: false, color: '#FB7185', icon: 'smartphone' },
  { id: 'w-3', name: 'Uang Tunai (Cash)', alias: 'cash', type: 'cash', balance: 250000, is_default_telegram: false, is_archived: false, color: '#FDA4AF', icon: 'banknote' },
  { id: 'w-4', name: 'Mandiri Livin', alias: 'mandiri', type: 'bank', balance: 1850000, is_default_telegram: false, is_archived: false, color: '#E11D48', icon: 'credit-card' },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'c-1', name: 'Makanan & Minuman', type: 'expense', emoji: '🍜', color: '#F43F5E', budget_amount: 2000000, spent_amount: 1420000 },
  { id: 'c-2', name: 'Transportasi', type: 'expense', emoji: '🚗', color: '#FB7185', budget_amount: 900000, spent_amount: 450000 },
  { id: 'c-3', name: 'Belanja Kebutuhan', type: 'expense', emoji: '🛒', color: '#F472B6', budget_amount: 1500000, spent_amount: 1250000 },
  { id: 'c-4', name: 'Tagihan & Utilitas', type: 'expense', emoji: '🏠', color: '#E11D48', budget_amount: 1200000, spent_amount: 1100000 },
  { id: 'c-5', name: 'Hiburan & Kopi', type: 'expense', emoji: '🎮', color: '#BE123C', budget_amount: 600000, spent_amount: 510000 },
  { id: 'c-6', name: 'Kesehatan & Medis', type: 'expense', emoji: '💊', color: '#FDA4AF', budget_amount: 500000, spent_amount: 120000 },
  { id: 'c-7', name: 'Gaji Bulanan', type: 'income', emoji: '💰', color: '#10B981' },
  { id: 'c-8', name: 'Freelance & Side Hustle', type: 'income', emoji: '💻', color: '#059669' },
];

export const INITIAL_BILLS: FixedBill[] = [
  { id: 'b-1', user_id: 'usr-001', name: 'Kos Bulanan', amount: 1800000, due_day: 20, is_paid_this_cycle: false },
  { id: 'b-2', user_id: 'usr-001', name: 'Listrik PLN & Air', amount: 350000, due_day: 18, is_paid_this_cycle: false },
  { id: 'b-3', user_id: 'usr-001', name: 'Internet Wifi Fiber', amount: 300000, due_day: 15, is_paid_this_cycle: true },
];

export const INITIAL_JATAH_SETTINGS: JatahSettingsRecord = {
  user_id: 'usr-001',
  payday_date: 25,
  monthly_savings_target: 500000,
  enable_rollover: true,
};

export const INITIAL_STREAKS: StreakRecord = {
  user_id: 'usr-001',
  current_streak_days: 12,
  longest_streak_days: 18,
  last_logged_date: '2026-10-13',
  badges: ['streak_3', 'streak_7'],
};

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-101',
    user_id: 'usr-001',
    wallet_id: 'w-1',
    wallet_name: 'BCA Utama',
    category_id: 'c-1',
    category_name: 'Makanan & Minuman',
    category_emoji: '🍜',
    type: 'expense',
    amount: 35000,
    description: 'Nasi Goreng Kambing',
    notes: 'Ketik via Telegram: "nasi goreng kambing 35rb"',
    transaction_date: '2026-10-13 13:15 WIB',
    source: 'telegram',
  },
  {
    id: 'tx-102',
    user_id: 'usr-001',
    wallet_id: 'w-2',
    wallet_name: 'GoPay',
    category_id: 'c-2',
    category_name: 'Transportasi',
    category_emoji: '🚗',
    type: 'expense',
    amount: 18000,
    description: 'Gojek ke Stasiun',
    notes: 'Voice note: "gojek ke stasiun 18 ribu"',
    transaction_date: '2026-10-13 08:30 WIB',
    source: 'voice_note',
  },
  {
    id: 'tx-103',
    user_id: 'usr-001',
    wallet_id: 'w-1',
    wallet_name: 'BCA Utama',
    category_id: 'c-3',
    category_name: 'Belanja Kebutuhan',
    category_emoji: '🛒',
    type: 'expense',
    amount: 184500,
    description: 'Struk Indomaret Point',
    notes: 'Scan Foto Struk (AI OCR Multimodal)',
    transaction_date: '2026-10-12 19:40 WIB',
    source: 'receipt_ocr',
    receipt_items: [
      { name: 'Minyak Goreng 2L', quantity: 1, price: 34000, subtotal: 34000 },
      { name: 'Beras Premium 5kg', quantity: 1, price: 74500, subtotal: 74500 },
      { name: 'Kopi Susu Kaleng', quantity: 4, price: 9000, subtotal: 36000 },
      { name: 'Sabun Cuci Piring', quantity: 2, price: 20000, subtotal: 40000 },
    ],
  },
  {
    id: 'tx-104',
    user_id: 'usr-001',
    wallet_id: 'w-1',
    wallet_name: 'BCA Utama',
    category_id: 'c-7',
    category_name: 'Gaji Bulanan',
    category_emoji: '💰',
    type: 'income',
    amount: 8500000,
    description: 'Transfer Gaji Perusahaan',
    notes: 'Ketik via Telegram: "gajian bca 8.5jt"',
    transaction_date: '2026-10-01 09:00 WIB',
    source: 'telegram',
  },
  {
    id: 'tx-105',
    user_id: 'usr-001',
    wallet_id: 'w-4',
    wallet_name: 'Mandiri Livin',
    category_id: 'c-8',
    category_name: 'Freelance & Side Hustle',
    category_emoji: '💻',
    type: 'income',
    amount: 2300000,
    description: 'Project Web Design Client',
    notes: 'Input manual via Web Dashboard',
    transaction_date: '2026-10-05 15:20 WIB',
    source: 'web',
  },
];

// ==============================================================================
// SUPABASE CLIENT INITIALIZATION (Browser, Server, Admin)
// ==============================================================================

import { sanitizeSupabaseUrl, sanitizeSupabaseKey } from './supabase/server';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawUrl.trim().length > 8 &&
  !rawUrl.includes('your-project') &&
  !rawUrl.includes('sb_publishable') &&
  rawUrl.includes('.supabase.co') &&
  rawAnonKey &&
  rawAnonKey !== 'your-anon-key'
);

const supabaseUrl = sanitizeSupabaseUrl(rawUrl);
const supabaseAnonKey = sanitizeSupabaseKey(rawAnonKey);
const supabaseServiceRoleKey = sanitizeSupabaseKey(rawServiceKey, supabaseAnonKey);

/**
 * Browser Supabase Client Singleton
 */
let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!browserClient) {
    try {
      browserClient = createClient(supabaseUrl, supabaseAnonKey);
    } catch {
      browserClient = null;
    }
  }
  return browserClient;
}

export const supabase: SupabaseClient = (function () {
  try {
    return createClient(supabaseUrl, supabaseAnonKey);
  } catch {
    return null as unknown as SupabaseClient;
  }
})();

/**
 * Server-side Supabase Client
 */
export function createSupabaseServerClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  try {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });
  } catch {
    return null;
  }
}

/**
 * Service Role / Admin Supabase Client
 */
export function createSupabaseAdminClient(): SupabaseClient | null {
  const serviceKey = supabaseServiceRoleKey || supabaseAnonKey;
  if (!isSupabaseConfigured) return null;
  try {
    return createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch {
    return null;
  }
}

// ==============================================================================
// LOCAL FALLBACK STORAGE ADAPTER
// Berfungsi 100% tanpa konfigurasi Supabase untuk preview lokal instan
// ==============================================================================

class LocalStorageStore {
  private user: UserProfile = { ...INITIAL_USER };
  private wallets: Wallet[] = [...INITIAL_WALLETS];
  private categories: Category[] = [...INITIAL_CATEGORIES];
  private bills: FixedBill[] = [...INITIAL_BILLS];
  private jatahSettings: JatahSettingsRecord = { ...INITIAL_JATAH_SETTINGS };
  private streaks: StreakRecord = { ...INITIAL_STREAKS };
  private transactions: Transaction[] = [...INITIAL_TRANSACTIONS];

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    if (typeof window === 'undefined') return;
    try {
      const savedUser = localStorage.getItem('tatadana_user');
      if (savedUser) this.user = JSON.parse(savedUser);
      const savedWallets = localStorage.getItem('tatadana_wallets');
      if (savedWallets) this.wallets = JSON.parse(savedWallets);
      const savedCategories = localStorage.getItem('tatadana_categories');
      if (savedCategories) this.categories = JSON.parse(savedCategories);
      const savedTxs = localStorage.getItem('tatadana_transactions');
      if (savedTxs) this.transactions = JSON.parse(savedTxs);
      const savedBills = localStorage.getItem('tatadana_bills');
      if (savedBills) this.bills = JSON.parse(savedBills);
      const savedJatah = localStorage.getItem('tatadana_jatah');
      if (savedJatah) this.jatahSettings = JSON.parse(savedJatah);
      const savedStreaks = localStorage.getItem('tatadana_streaks');
      if (savedStreaks) this.streaks = JSON.parse(savedStreaks);
    } catch {
      // Ignore parse error
    }
  }

  private saveToLocalStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('tatadana_user', JSON.stringify(this.user));
      localStorage.setItem('tatadana_wallets', JSON.stringify(this.wallets));
      localStorage.setItem('tatadana_categories', JSON.stringify(this.categories));
      localStorage.setItem('tatadana_transactions', JSON.stringify(this.transactions));
      localStorage.setItem('tatadana_bills', JSON.stringify(this.bills));
      localStorage.setItem('tatadana_jatah', JSON.stringify(this.jatahSettings));
      localStorage.setItem('tatadana_streaks', JSON.stringify(this.streaks));
    } catch {
      // Ignore quota error
    }
  }

  // --- Transactions ---
  getTransactions(): Transaction[] {
    return [...this.transactions];
  }

  addTransaction(tx: Omit<Transaction, 'id' | 'user_id'>): Transaction {
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}`,
      user_id: this.user.id,
    };

    // Auto-update wallet balance (Mirrors Postgres trigger)
    const wallet = this.wallets.find(w => w.id === newTx.wallet_id || w.name === newTx.wallet_name);
    if (wallet) {
      if (newTx.type === 'expense') {
        wallet.balance -= newTx.amount;
      } else if (newTx.type === 'income') {
        wallet.balance += newTx.amount;
      }
    }

    // Auto-update streak
    this.streaks.current_streak_days += 1;
    if (this.streaks.current_streak_days > this.streaks.longest_streak_days) {
      this.streaks.longest_streak_days = this.streaks.current_streak_days;
    }
    this.streaks.last_logged_date = new Date().toISOString().split('T')[0];

    this.transactions.unshift(newTx);
    this.user.monthly_tx_count += 1;
    this.saveToLocalStorage();
    return newTx;
  }

  deleteTransaction(id: string): boolean {
    const idx = this.transactions.findIndex(t => t.id === id);
    if (idx === -1) return false;
    const removed = this.transactions[idx];

    // Rollback wallet balance
    const wallet = this.wallets.find(w => w.id === removed.wallet_id || w.name === removed.wallet_name);
    if (wallet) {
      if (removed.type === 'expense') {
        wallet.balance += removed.amount;
      } else if (removed.type === 'income') {
        wallet.balance -= removed.amount;
      }
    }

    this.transactions.splice(idx, 1);
    this.saveToLocalStorage();
    return true;
  }

  // --- Wallets ---
  getWallets(): Wallet[] {
    return [...this.wallets];
  }

  updateWallet(id: string, updates: Partial<Wallet>): Wallet | null {
    const wallet = this.wallets.find(w => w.id === id);
    if (!wallet) return null;
    Object.assign(wallet, updates);
    this.saveToLocalStorage();
    return wallet;
  }

  transferBetweenWallets(fromWalletId: string, toWalletId: string, amount: number, fee = 0): boolean {
    const fromW = this.wallets.find(w => w.id === fromWalletId);
    const toW = this.wallets.find(w => w.id === toWalletId);
    if (!fromW || !toW) return false;

    fromW.balance -= (amount + fee);
    toW.balance += amount;

    const tx: Transaction = {
      id: `tx-tf-${Date.now()}`,
      user_id: this.user.id,
      wallet_id: fromW.id,
      wallet_name: fromW.name,
      category_id: 'transfer',
      category_name: 'Transfer Antar Dompet',
      category_emoji: '🔄',
      type: 'transfer',
      amount,
      description: `Transfer dari ${fromW.name} ke ${toW.name}`,
      notes: fee > 0 ? `Biaya admin: Rp${fee.toLocaleString('id-ID')}` : 'Bebas biaya',
      transaction_date: formatWIBTimestamp(),
      source: 'web',
    };
    this.transactions.unshift(tx);
    this.saveToLocalStorage();
    return true;
  }

  // --- Categories ---
  getCategories(): Category[] {
    return [...this.categories];
  }

  // --- Bills ---
  getBills(): FixedBill[] {
    return [...this.bills];
  }

  // --- Jatah Settings ---
  getJatahSettings(): JatahSettingsRecord {
    return { ...this.jatahSettings };
  }

  updateJatahSettings(settings: Partial<JatahSettingsRecord>): JatahSettingsRecord {
    Object.assign(this.jatahSettings, settings);
    this.saveToLocalStorage();
    return { ...this.jatahSettings };
  }

  // --- Streaks ---
  getStreaks(): StreakRecord {
    return { ...this.streaks };
  }

  // --- User Profile & Authentication ---
  getUser(): UserProfile {
    return { ...this.user };
  }

  updateUser(updates: Partial<UserProfile>): UserProfile {
    Object.assign(this.user, updates);
    this.saveToLocalStorage();
    return { ...this.user };
  }

  getRegisteredUsers(): UserProfile[] {
    if (typeof window === 'undefined') return [{ ...INITIAL_USER }];
    try {
      const raw = localStorage.getItem('tatadana_registered_users');
      if (raw) {
        const users = JSON.parse(raw);
        if (Array.isArray(users) && users.length > 0) return users;
      }
    } catch {}
    const initial = [{ ...INITIAL_USER }];
    try {
      localStorage.setItem('tatadana_registered_users', JSON.stringify(initial));
    } catch {}
    return initial;
  }

  registerUser(name: string, email: string, phone: string, password?: string): UserProfile {
    const users = this.getRegisteredUsers();
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      full_name: name,
      email: email.toLowerCase(),
      phone_number: phone,
      phone_verified: true,
      subscription_plan: 'starter',
      default_currency: 'IDR',
      monthly_tx_count: 0,
      is_superadmin: false,
    };
    users.push(newUser);
    const zeroWallets: Wallet[] = [
      { id: `w-${Date.now()}-1`, name: 'BCA Utama', alias: 'bca', type: 'bank', balance: 0, is_default_telegram: true, is_archived: false, color: '#f43f5e', icon: 'landmark' },
      { id: `w-${Date.now()}-2`, name: 'GoPay', alias: 'gopay', type: 'ewallet', balance: 0, is_default_telegram: false, is_archived: false, color: '#fb7185', icon: 'smartphone' },
      { id: `w-${Date.now()}-3`, name: 'Uang Tunai (Cash)', alias: 'cash', type: 'cash', balance: 0, is_default_telegram: false, is_archived: false, color: '#fda4af', icon: 'wallet' },
      { id: `w-${Date.now()}-4`, name: 'Mandiri Livin', alias: 'mandiri', type: 'bank', balance: 0, is_default_telegram: false, is_archived: false, color: '#e11d48', icon: 'credit-card' },
    ];
    this.user = newUser;
    this.wallets = zeroWallets;
    this.transactions = [];
    this.bills = [];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('tatadana_registered_users', JSON.stringify(users));
        localStorage.setItem('tatadana_active_user_id', newUser.id);
        localStorage.setItem('tatadana_user', JSON.stringify(newUser));
        localStorage.setItem('tatadana_wallets', JSON.stringify(zeroWallets));
        localStorage.setItem('tatadana_transactions', JSON.stringify([]));
        localStorage.setItem('tatadana_bills', JSON.stringify([]));
      } catch {}
    }
    return newUser;
  }

  loginUser(identifier: string, password?: string): UserProfile | null {
    const users = this.getRegisteredUsers();
    const cleanPhone = identifier.replace(/[^0-9]/g, '');
    const found = users.find(u => {
      const emailMatch = u.email && u.email.toLowerCase() === identifier.toLowerCase();
      const phoneMatch = cleanPhone.length >= 8 && u.phone_number && u.phone_number.replace(/[^0-9]/g, '') === cleanPhone;
      return emailMatch || phoneMatch;
    });
    if (!found) return null;
    this.user = found;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('tatadana_active_user_id', found.id);
        localStorage.setItem('tatadana_user', JSON.stringify(found));
      } catch {}
    }
    return found;
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('tatadana_active_user_id');
        localStorage.removeItem('tatadana_user');
      } catch {}
    }
    this.user = { id: '', full_name: '', email: '', phone_number: '', phone_verified: false, subscription_plan: 'starter', default_currency: 'IDR', monthly_tx_count: 0, is_superadmin: false };
  }
}

export const tatadanaStore = new LocalStorageStore();

// ==============================================================================
// TIMEZONE & CURRENCY FORMATTERS (WIB Asia/Jakarta & Rupiah)
// ==============================================================================

export function formatWIBTimestamp(date: Date = new Date()): string {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const wibDate = new Date(utc + 3600000 * 7);

  const dayName = days[wibDate.getDay()];
  const dayNum = wibDate.getDate();
  const monthName = months[wibDate.getMonth()];
  const year = wibDate.getFullYear();
  const hours = String(wibDate.getHours()).padStart(2, '0');
  const minutes = String(wibDate.getMinutes()).padStart(2, '0');

  return `${dayNum} ${monthName} ${year}, ${hours}:${minutes} WIB`;
}

export function formatRupiah(amount: number): string {
  return 'Rp' + Math.round(amount).toLocaleString('id-ID');
}
