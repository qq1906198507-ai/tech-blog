const ADMIN_EMAILS = [
  'admin@techblog.com',
  'zhangmy@techblog.com',
  'zhangmingyuan@techblog.com',
]

export function isAdmin(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

export function getAdminEmails(): string[] {
  return [...ADMIN_EMAILS]
}
