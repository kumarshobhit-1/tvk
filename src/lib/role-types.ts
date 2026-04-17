// Role-Based Access Control Types and Constants

export type AdminRole = 
  | 'super_admin'      // Complete control - all features
  | 'isAdmin'          // Full site control except admin-management
  | 'content_admin'    // PDFs only - upload/delete
  | 'exam_admin'       // Exam system - create/edit/delete exams
  | 'qa_admin';        // DSA/CS - manage questions, subjects, playground

export interface AdminPermissions {
  // Super Admin
  canManageAdmins?: boolean;
  canManageRoles?: boolean;
  canViewAnalytics?: boolean;
  canEmergencyStop?: boolean;
  
  // Content Admin
  canManagePDFs?: boolean;
  canUploadPDF?: boolean;
  canDeletePDF?: boolean;
  canViewPDFLibrary?: boolean;
  
  // Exam Admin
  canCreateExam?: boolean;
  canEditExam?: boolean;
  canDeleteExam?: boolean;
  canPublishExam?: boolean;
  canManageExamAttempts?: boolean;
  canViewExamAnalytics?: boolean;
  
  // QA Admin
  canCreateQAQuestion?: boolean;
  canEditQAQuestion?: boolean;
  canDeleteQAQuestion?: boolean;
  canManageSubjects?: boolean;
  canManageTopics?: boolean;
  canManagePlayground?: boolean;
  canViewQAAnalytics?: boolean;
}

// Role to Permissions Mapping
export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermissions> = {
  super_admin: {
    // Super Admin has ALL permissions
    canManageAdmins: true,
    canManageRoles: true,
    canViewAnalytics: true,
    canEmergencyStop: true,
    canManagePDFs: true,
    canUploadPDF: true,
    canDeletePDF: true,
    canViewPDFLibrary: true,
    canCreateExam: true,
    canEditExam: true,
    canDeleteExam: true,
    canPublishExam: true,
    canManageExamAttempts: true,
    canViewExamAnalytics: true,
    canCreateQAQuestion: true,
    canEditQAQuestion: true,
    canDeleteQAQuestion: true,
    canManageSubjects: true,
    canManageTopics: true,
    canManagePlayground: true,
    canViewQAAnalytics: true,
  },
  isAdmin: {
    // isAdmin: Full site control, but cannot manage other admins/roles
    canViewAnalytics: true,
    canEmergencyStop: true,
    canManagePDFs: true,
    canUploadPDF: true,
    canDeletePDF: true,
    canViewPDFLibrary: true,
    canCreateExam: true,
    canEditExam: true,
    canDeleteExam: true,
    canPublishExam: true,
    canManageExamAttempts: true,
    canViewExamAnalytics: true,
    canCreateQAQuestion: true,
    canEditQAQuestion: true,
    canDeleteQAQuestion: true,
    canManageSubjects: true,
    canManageTopics: true,
    canManagePlayground: true,
    canViewQAAnalytics: true,
  },
  content_admin: {
    // Content Admin: PDF management only
    canManagePDFs: true,
    canUploadPDF: true,
    canDeletePDF: true,
    canViewPDFLibrary: true,
  },
  exam_admin: {
    // Exam Admin: Full exam system control
    canCreateExam: true,
    canEditExam: true,
    canDeleteExam: true,
    canPublishExam: true,
    canManageExamAttempts: true,
    canViewExamAnalytics: true,
  },
  qa_admin: {
    // QA Admin: DSA/CS questions and subjects
    canCreateQAQuestion: true,
    canEditQAQuestion: true,
    canDeleteQAQuestion: true,
    canManageSubjects: true,
    canManageTopics: true,
    canManagePlayground: true,
    canViewQAAnalytics: true,
  },
};

// Role descriptions
export const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  super_admin: 'Full system access - can manage all features, admins, and system settings',
  isAdmin: 'Full site access except admin user management',
  content_admin: 'PDF library management - can upload and delete PDFs',
  exam_admin: 'Exam system management - can create, edit, publish exams and view results',
  qa_admin: 'QA content management - can manage DSA/CS questions, subjects, and playground',
};

// Helper function to check permission
export function hasPermission(
  userRole: AdminRole | undefined,
  permission: keyof AdminPermissions
): boolean {
  if (!userRole) return false;
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions[permission] === true;
}

// Helper function to check multiple permissions (any)
export function hasAnyPermission(
  userRole: AdminRole | undefined,
  permissions: Array<keyof AdminPermissions>
): boolean {
  return permissions.some(perm => hasPermission(userRole, perm));
}

// Helper function to check multiple permissions (all)
export function hasAllPermissions(
  userRole: AdminRole | undefined,
  permissions: Array<keyof AdminPermissions>
): boolean {
  return permissions.every(perm => hasPermission(userRole, perm));
}
