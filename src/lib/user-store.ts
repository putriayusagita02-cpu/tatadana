export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  plan?: string;
  status?: string;
  approvalStatus?: string;
  rejectionReason?: string;
  joinedAt?: string;
  registeredAt?: string;
  isSuperadmin?: boolean;
}

declare global {
  var __TATADANA_USERS__: AppUser[] | undefined;
}

const DEFAULT_USERS: AppUser[] = [
  {
    id: 'usr-001',
    name: 'Dimas Kurniawan',
    email: 'dimas@tatadana.id',
    phone: '081234567890',
    plan: 'pro',
    status: 'approved',
    approvalStatus: 'approved',
    joinedAt: '01 Okt 2026',
    registeredAt: '01 Okt 2026, 08:00 WIB',
    isSuperadmin: false,
  },
  {
    id: 'usr-admin-01',
    name: 'Putri Ayu Sagita',
    email: 'putriayusagita02@gmail.com',
    phone: '081299990001',
    plan: 'pro',
    status: 'approved',
    approvalStatus: 'approved',
    joinedAt: '01 Okt 2026',
    registeredAt: '01 Okt 2026, 08:00 WIB',
    isSuperadmin: true,
  },
];

export function getSharedUsers(): AppUser[] {
  if (!globalThis.__TATADANA_USERS__) {
    globalThis.__TATADANA_USERS__ = [...DEFAULT_USERS];
  }
  return globalThis.__TATADANA_USERS__;
}

export function saveSharedUser(user: Partial<AppUser>): AppUser {
  const users = getSharedUsers();
  const id = user.id || `usr-${Date.now()}`;
  const email = (user.email || '').toLowerCase().trim();

  let idx = users.findIndex(
    u => u.id === id || (email && u.email && u.email.toLowerCase() === email)
  );

  const fullUser: AppUser = {
    id,
    name: user.name || 'Pengguna Baru',
    email: email || `${id}@tatadana.id`,
    phone: user.phone || '',
    plan: user.plan || 'starter',
    status: user.status || user.approvalStatus || 'pending',
    approvalStatus: user.approvalStatus || user.status || 'pending',
    rejectionReason: user.rejectionReason || '',
    joinedAt: user.joinedAt || '15 Okt 2026',
    registeredAt: user.registeredAt || '15 Okt 2026, WIB',
    isSuperadmin: email === 'putriayusagita02@gmail.com' || Boolean(user.isSuperadmin),
  };

  if (idx >= 0) {
    users[idx] = { ...users[idx], ...fullUser };
    return users[idx];
  } else {
    users.unshift(fullUser);
    return fullUser;
  }
}

export function updateSharedUserStatus(
  identifier: string,
  newStatus: 'approved' | 'rejected',
  reason?: string
): AppUser | null {
  const users = getSharedUsers();
  const clean = identifier.toLowerCase().trim();

  let target = users.find(
    u => u.id === identifier || (u.email && u.email.toLowerCase() === clean)
  );

  if (!target) {
    // If not found, create and set status immediately!
    target = saveSharedUser({
      id: identifier.startsWith('usr-') ? identifier : `usr-${Date.now()}`,
      name: identifier.includes('@') ? identifier.split('@')[0] : identifier,
      email: identifier.includes('@') ? identifier : `${identifier}@tatadana.id`,
      status: newStatus,
      approvalStatus: newStatus,
      rejectionReason: reason || '',
    });
  }

  target.status = newStatus;
  target.approvalStatus = newStatus;
  if (reason) target.rejectionReason = reason;

  return target;
}
