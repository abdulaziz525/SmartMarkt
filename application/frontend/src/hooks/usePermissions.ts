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
  const isCashier = role === 'cashier';

  return {
    canAccessPOS: isOwner || isManager || isCashier,
    canManageSuppliers: isOwner || isManager,
    canManagePurchases: isOwner || isManager,
    canManageInventory: isOwner || isManager,
    canManageBranches: isOwner,
    canManageUsers: isOwner,
    canManageStoreSettings: isOwner,
    isOwner,
    role
  };
};
