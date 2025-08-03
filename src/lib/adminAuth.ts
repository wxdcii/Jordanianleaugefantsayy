import { User } from 'firebase/auth'

// Your admin email - updated to correct format
const ADMIN_EMAIL = 'ammar.mkld67@yahoo.com'

export function isAdminUser(user: User | null): boolean {
  if (!user || !user.email) return false
  return user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
}

export function requireAdminAccess(user: User | null): void {
  if (!isAdminUser(user)) {
    throw new Error('Admin access denied - Only authorized admin can access this panel')
  }
}

// Get admin dashboard URL
export function getAdminDashboardUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/admin-dashboard`
  }
  return '/admin-dashboard'
}
