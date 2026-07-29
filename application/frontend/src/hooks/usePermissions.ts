import type { User } from '../types';

export const usePermissions = (user: User | null) => {
  
  if (!user) {
    return {
      canAccessPOS: false,
      canManageSuppliers: false,
      canManagePurchases: false,
      canManageInventory: false,
      canManageBranches: false,
      canManageUsers: false,
      canManageStoreSettings: false,
      isOwner: false,
      role: null
    };
  }

  const role = user.role;
  const isOwner = role === 'owner';
  const isManager = role === 'manager';

  const checkPerm = (key: string, defaultVal: boolean) => {
    if (isOwner) return true;
    if (user.permissions && typeof user.permissions[key] === 'boolean') {
      return user.permissions[key];
    }
    return defaultVal;
  };

  return {
    canAccessPOS: true, // Everyone can access POS
    canViewDashboard: checkPerm('dashboard', isManager),
    canManageSuppliers: checkPerm('suppliers', isManager),
    canManagePurchases: checkPerm('suppliers', isManager),
    canManageInventory: checkPerm('inventory', isManager),
    canViewReports: checkPerm('reports', isManager),
    canAdvancedPOS: checkPerm('advanced_pos', isManager),
    canViewAuditLogs: checkPerm('audit_logs', isManager),
    canManageBranches: checkPerm('branch_management', false),
    canManageUsers: checkPerm('employee_management', false),
    canManageStoreSettings: checkPerm('settings', false),
    canAccessStorefront: checkPerm('storefront_link', false),
    isOwner,
    role
  };
};
