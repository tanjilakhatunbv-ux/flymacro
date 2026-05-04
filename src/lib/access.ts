import type { Access, FieldAccess } from 'payload'

export type UserRole = 'super-admin' | 'operator' | 'support' | 'user'

type AnyUser = { id: string | number; role?: UserRole }

const hasRole = (user: AnyUser | null | undefined, ...roles: UserRole[]) =>
  !!user && !!user.role && roles.includes(user.role)

export const isSuperAdmin: Access = ({ req: { user } }) =>
  hasRole(user as AnyUser | null, 'super-admin')

export const isStaff: Access = ({ req: { user } }) =>
  hasRole(user as AnyUser | null, 'super-admin', 'operator', 'support')

export const isOperatorOrAbove: Access = ({ req: { user } }) =>
  hasRole(user as AnyUser | null, 'super-admin', 'operator')

export const isAuthenticated: Access = ({ req: { user } }) => !!user

export const anyone: Access = () => true

export const publishedOrStaff: Access = ({ req: { user } }) => {
  if (hasRole(user as AnyUser | null, 'super-admin', 'operator', 'support')) return true
  return {
    and: [
      { _status: { equals: 'published' } },
      { publishedAt: { less_than_equal: new Date().toISOString() } },
    ],
  } as any
}

export const isOwnerOrStaff: Access = ({ req: { user } }) => {
  if (!user) return false
  if (hasRole(user as AnyUser | null, 'super-admin', 'operator', 'support')) return true
  return { user: { equals: user.id } }
}

export const isOwnerOrSuperAdmin: Access = ({ req: { user } }) => {
  if (!user) return false
  if (hasRole(user as AnyUser | null, 'super-admin')) return true
  return { id: { equals: user.id } }
}

export const isSuperAdminField: FieldAccess = ({ req: { user } }) =>
  hasRole(user as AnyUser | null, 'super-admin')

export const isStaffField: FieldAccess = ({ req: { user } }) =>
  hasRole(user as AnyUser | null, 'super-admin', 'operator', 'support')
