/**
 * TATADANA — TATAJATAH SIGNATURE ENGINE
 * Formula Jatah Harian Aman (Safe Daily Allowance), Rollover,
 * Status Indikator (Aman / Hati-hati / Lewat), Streak 🔥,
 * Simulasi "Kalau Aku Beli Ini?", dan Proyeksi Saldo Akhir Bulan.
 */

export interface JatahSettings {
  paydayDate: number; // Tanggal gajian (misal 25)
  monthlySavingsTarget: number; // Target tabungan (misal Rp 500.000)
  enableRollover: boolean;
}

export interface FixedBill {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  isPaidThisCycle: boolean;
}

export interface DailyJatahCalculation {
  totalWalletsBalance: number;
  upcomingBillsTotal: number;
  savingsTarget: number;
  daysLeftToPayday: number;
  safeDailyAllowance: number;
  todaySpent: number;
  remainingToday: number;
  status: 'aman' | 'hati_hati' | 'lewat'; // Aman <70%, Hati-hati 70-100%, Lewat >100%
  spentPercentage: number;
  streakDays: number;
  badges: string[];
}

export interface PurchaseSimulationResult {
  purchaseAmount: number;
  itemDescription: string;
  currentDailyAllowance: number;
  newDailyAllowance: number;
  differencePerDay: number;
  percentImpact: number;
  isSafe: boolean;
  adviceMessage: string;
}

/**
 * Menghitung sisa hari menuju tanggal gajian berikutnya berdasarkan WIB
 */
export function calculateDaysLeftToPayday(paydayDate: number, currentDate: Date = new Date()): number {
  // Normalize to WIB date components without time drift
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentDay = currentDate.getDate();

  if (currentDay === paydayDate) {
    // Hari ini adalah hari gajian!
    return 1;
  }

  let targetDate: Date;
  if (currentDay < paydayDate) {
    targetDate = new Date(currentYear, currentMonth, paydayDate);
  } else {
    // Gajian di bulan depan
    targetDate = new Date(currentYear, currentMonth + 1, paydayDate);
  }

  // Calculate day difference using calendar midnight dates
  const todayMidnight = new Date(currentYear, currentMonth, currentDay);
  const diffTime = targetDate.getTime() - todayMidnight.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

/**
 * Formula Safe Daily Allowance (TataJatah)
 * (Total Saldo Dompet - Tagihan Wajib Belum Terbayar - Target Tabungan) / Sisa Hari Gajian
 */
export function calculateTataJatah(params: {
  walletsBalance: number;
  bills: FixedBill[];
  settings: JatahSettings;
  todaySpent: number;
  currentDate?: Date;
  streakDays?: number;
}): DailyJatahCalculation {
  const date = params.currentDate || new Date();
  const daysLeft = calculateDaysLeftToPayday(params.settings.paydayDate, date);

  // Hitung tagihan yang belum dibayar sebelum gajian
  const upcomingBillsTotal = params.bills
    .filter(b => !b.isPaidThisCycle)
    .reduce((sum, b) => sum + b.amount, 0);

  const usableBalance = Math.max(0, params.walletsBalance - upcomingBillsTotal - params.settings.monthlySavingsTarget);
  const safeDailyAllowance = Math.round(usableBalance / daysLeft);

  let spentPercentage = 0;
  let status: 'aman' | 'hati_hati' | 'lewat' = 'aman';

  if (safeDailyAllowance > 0) {
    spentPercentage = Math.round((params.todaySpent / safeDailyAllowance) * 100);
    if (spentPercentage > 100) {
      status = 'lewat';
    } else if (spentPercentage >= 70) {
      status = 'hati_hati';
    } else {
      status = 'aman';
    }
  } else {
    // Saldo jatah habis atau 0
    if (params.todaySpent > 0) {
      spentPercentage = 999;
      status = 'lewat';
    } else {
      spentPercentage = 0;
      status = 'aman';
    }
  }

  const streak = params.streakDays !== undefined ? params.streakDays : 12;
  const badges: string[] = [];
  if (streak >= 3) badges.push('🔥 3 Hari Konsisten');
  if (streak >= 7) badges.push('⚡ 7 Hari Pejuang Jatah');
  if (streak >= 14) badges.push('🏆 14 Hari Master Budget');
  if (streak >= 30) badges.push('👑 30 Hari Pengendali Finansial');

  return {
    totalWalletsBalance: params.walletsBalance,
    upcomingBillsTotal,
    savingsTarget: params.settings.monthlySavingsTarget,
    daysLeftToPayday: daysLeft,
    safeDailyAllowance,
    todaySpent: params.todaySpent,
    remainingToday: Math.max(0, safeDailyAllowance - params.todaySpent),
    status,
    spentPercentage,
    streakDays: streak,
    badges,
  };
}

/**
 * Simulasi "Kalau Aku Beli Ini?" (Impact simulation)
 */
export function simulatePurchaseImpact(
  currentJatah: DailyJatahCalculation,
  purchaseAmount: number,
  itemDescription: string
): PurchaseSimulationResult {
  const remainingDays = currentJatah.daysLeftToPayday;
  const currentDaily = currentJatah.safeDailyAllowance;

  // Sisa usable balance setelah pembelian
  const currentTotalUsable = currentDaily * remainingDays;
  const newTotalUsable = Math.max(0, currentTotalUsable - purchaseAmount);
  const newDaily = Math.round(newTotalUsable / remainingDays);
  const diffPerDay = currentDaily - newDaily;
  const percentImpact = currentDaily > 0 ? Math.round((diffPerDay / currentDaily) * 100) : 0;

  let adviceMessage = '';
  let isSafe = false;

  if (percentImpact <= 10 && newDaily > 0) {
    isSafe = true;
    adviceMessage = `🟢 Aman dibeli! Jatah harianmu hanya berkurang Rp${diffPerDay.toLocaleString('id-ID')} (${percentImpact}%). Tidak mengganggu arus kas hingga gajian.`;
  } else if (percentImpact <= 25 && newDaily >= 35000) {
    isSafe = true;
    adviceMessage = `🟡 Pertimbangkan kembali. Jatah harian berkurang Rp${diffPerDay.toLocaleString('id-ID')} (${percentImpact}%). Kamu harus hemat di pos jajan lain selama ${remainingDays} hari.`;
  } else {
    isSafe = false;
    adviceMessage = `🔴 Waspada! Pembelian ini memangkas ${percentImpact}% jatah harianmu menjadi sisa Rp${newDaily.toLocaleString('id-ID')}/hari. Sangat berisiko sebelum tanggal gajian!`;
  }

  return {
    purchaseAmount,
    itemDescription,
    currentDailyAllowance: currentDaily,
    newDailyAllowance: newDaily,
    differencePerDay: diffPerDay,
    percentImpact,
    isSafe,
    adviceMessage,
  };
}

/**
 * Proyeksi Saldo Akhir Periode berdasarkan tren belanja 14 hari
 */
export function calculateBalanceProjection(
  currentBalance: number,
  dailyBurnRate: number,
  daysLeft: number,
  fixedBillsDue: number
): {
  projectedEndingBalance: number;
  projectedStatus: 'surplus' | 'defisit' | 'kritis';
} {
  const projectedEndingBalance = currentBalance - (dailyBurnRate * daysLeft) - fixedBillsDue;
  let projectedStatus: 'surplus' | 'defisit' | 'kritis' = 'surplus';

  if (projectedEndingBalance < 0) {
    projectedStatus = 'defisit';
  } else if (projectedEndingBalance < 500000) {
    projectedStatus = 'kritis';
  }

  return {
    projectedEndingBalance,
    projectedStatus,
  };
}
