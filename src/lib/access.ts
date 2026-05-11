import type { Access, FieldAccess, Where } from 'payload'

export type UserRole = 'admin' | 'operator' | 'user'

type AnyUser = { id: string | number; role?: UserRole }

const hasRole = (user: AnyUser | null | undefined, ...roles: UserRole[]) =>
  !!user && !!user.role && roles.includes(user.role)

export const isAdmin: Access = ({ req: { user } }) =>
  hasRole(user as AnyUser | null, 'admin')

// Keep old names as aliases for backwards compatibility during migration
export const isSuperAdmin = isAdmin

export const isStaff: Access = ({ req: { user } }) =>
  hasRole(user as AnyUser | null, 'admin', 'operator')

export const isOperatorOrAbove: Access = ({ req: { user } }) =>
  hasRole(user as AnyUser | null, 'admin', 'operator')

export const isAuthenticated: Access = ({ req: { user } }) => !!user

export const anyone: Access = () => true

export const publishedOrStaff: Access = ({ req: { user } }) => {
  if (hasRole(user as AnyUser | null, 'admin', 'operator')) return true
  return {
    and: [
      { _status: { equals: 'published' } as const },
      { publishedAt: { less_than_equal: new Date().toISOString() } },
    ],
  } as Where
}

export const isOwnerOrStaff: Access = ({ req: { user } }) => {
  if (!user) return false
  if (hasRole(user as AnyUser | null, 'admin', 'operator')) return true
  return { user: { equals: user.id } }
}

export const isOwnerOrSuperAdmin: Access = ({ req: { user } }) => {
  if (!user) return false
  if (hasRole(user as AnyUser | null, 'admin')) return true
  return { id: { equals: user.id } }
}

export const isAdminField: FieldAccess = ({ req: { user } }) =>
  hasRole(user as AnyUser | null, 'admin')

export const isSuperAdminField = isAdminField

export const isStaffField: FieldAccess = ({ req: { user } }) =>
  hasRole(user as AnyUser | null, 'admin', 'operator')
