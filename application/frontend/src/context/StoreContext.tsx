import React, { createContext, useContext, useState } from 'react';
import { apiService } from '../services/api';

interface StoreContextType {
  activeStoreId: string | null;
  setActiveStoreId: (id: string) => void;
  stores: any[];
  setStores: (stores: any[]) => void;
  fetchStores: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeStoreId, setActiveStoreIdState] = useState<string | null>(localStorage.getItem('activeStoreId'));
  const [stores, setStores] = useState<any[]>([]);

  const setActiveStoreId = (id: string) => {
    localStorage.setItem('activeStoreId', id);
    setActiveStoreIdState(id);
  };

  const fetchStores = async () => {
    try {
      const fetchedStores = await apiService.getStores();
      setStores(fetchedStores);
      if (fetchedStores.length > 0) {
        if (!activeStoreId || !fetchedStores.find(s => s.id === activeStoreId)) {
          setActiveStoreId(fetchedStores[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to fetch stores in context', e);
    }
  };

  return (
    <StoreContext.Provider value={{ activeStoreId, setActiveStoreId, stores, setStores, fetchStores }}>
      {children}
    </StoreContext.Provider>
  );
};
