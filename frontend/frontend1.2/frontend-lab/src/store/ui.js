import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUiStore = create(
  persist(
    (set) => ({
      view: 'grid',
      search: '',
      setView: (view) => set({ view }),
      setSearch: (search) => set({ search }),
    }),
    { name: 'ui-store', partialize: (state) => ({ view: state.view }) },
  ),
);
