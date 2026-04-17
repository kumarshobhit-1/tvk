// src/hooks/use-admin-role.ts
'use client';

import { useContext } from 'react';
import { useAuth } from './use-auth';
import type { AdminRole, AdminPermissions } from '@/lib/role-types';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '@/lib/role-types';

interface AdminRoleContext {
  role: AdminRole | undefined;
  permissions: AdminPermissions | undefined;
}

export function useAdminRole(): AdminRoleContext & {
  hasPermission: (permission: keyof AdminPermissions) => boolean;
  hasAnyPermission: (permissions: Array<keyof AdminPermissions>) => boolean;
  hasAllPermissions: (permissions: Array<keyof AdminPermissions>) => boolean;
  isSuperAdmin: () => boolean;
  isExamAdmin: () => boolean;
  isContentAdmin: () => boolean;
  isQAAdmin: () => boolean;
} {
  const { user } = useAuth();
  
  // Get role from user custom claims (you'd need to set this during login)
  const role = (user as any)?.adminRole as AdminRole | undefined;
  
  // For now, we'll need to fetch this from API
  // This should be stored in context/state for better performance
  
  return {
    role,
    permissions: undefined,
    hasPermission: (permission: keyof AdminPermissions) => hasPermission(role, permission),
    hasAnyPermission: (permissions: Array<keyof AdminPermissions>) => 
      hasAnyPermission(role, permissions),
    hasAllPermissions: (permissions: Array<keyof AdminPermissions>) => 
      hasAllPermissions(role, permissions),
    isSuperAdmin: () => role === 'super_admin',
    isExamAdmin: () => role === 'exam_admin' || role === 'super_admin',
    isContentAdmin: () => role === 'content_admin' || role === 'super_admin',
    isQAAdmin: () => role === 'qa_admin' || role === 'super_admin',
  };
}
