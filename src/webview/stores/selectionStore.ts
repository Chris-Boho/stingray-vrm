import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { SelectionState } from '../types/vrm';

interface SelectionStoreState extends SelectionState {
  // Actions
  selectComponent: (componentId: number, multiSelect?: boolean) => void;
  selectComponents: (componentIds: number[]) => void;
  deselectComponent: (componentId: number) => void;
  clearSelection: () => void;
  selectAll: (componentIds: number[]) => void;
  
  // Box selection
  startBoxSelection: (start: { x: number; y: number }) => void;
  updateBoxSelection: (end: { x: number; y: number }) => void;
  endBoxSelection: (componentIds: number[]) => void;
  
  // Helpers
  isSelected: (componentId: number) => boolean;
  getSelectedCount: () => number;
  hasSelection: () => boolean;
}

const initialState: SelectionState = {
  selectedComponents: [],
  selectionBox: null,
  isSelecting: false
};

export const useSelectionStore = create<SelectionStoreState>()(
  immer((set, get) => ({
    ...initialState,

    selectComponent: (componentId: number, multiSelect = false) => {
      set((state) => {
        if (!multiSelect) {
          // Single selection - replace current selection
          state.selectedComponents = [componentId];
        } else {
          // Multi-selection - toggle component
          const index = state.selectedComponents.indexOf(componentId);
          if (index === -1) {
            state.selectedComponents.push(componentId);
          } else {
            state.selectedComponents.splice(index, 1);
          }
        }
      });
    },

    selectComponents: (componentIds: number[]) => {
      set((state) => {
        state.selectedComponents = [...componentIds];
      });
    },

    deselectComponent: (componentId: number) => {
      set((state) => {
        const index = state.selectedComponents.indexOf(componentId);
        if (index !== -1) {
          state.selectedComponents.splice(index, 1);
        }
      });
    },

    clearSelection: () => {
      set((state) => {
        state.selectedComponents = [];
        state.selectionBox = null;
        state.isSelecting = false;
      });
    },

    selectAll: (componentIds: number[]) => {
      set((state) => {
        state.selectedComponents = [...componentIds];
      });
    },

    startBoxSelection: (start: { x: number; y: number }) => {
      set((state) => {
        state.isSelecting = true;
        state.selectionBox = {
          start,
          end: start
        };
      });
    },

    updateBoxSelection: (end: { x: number; y: number }) => {
      set((state) => {
        if (state.selectionBox) {
          state.selectionBox.end = end;
        }
      });
    },

    endBoxSelection: (componentIds: number[]) => {
      set((state) => {
        state.isSelecting = false;
        state.selectionBox = null;
        state.selectedComponents = [...componentIds];
      });
    },

    isSelected: (componentId: number) => {
      return get().selectedComponents.includes(componentId);
    },

    getSelectedCount: () => {
      return get().selectedComponents.length;
    },

    hasSelection: () => {
      return get().selectedComponents.length > 0;
    }
  }))
);

// Selectors for commonly used values
export const useSelectedComponents = () => useSelectionStore(state => state.selectedComponents);
export const useSelectionBox = () => useSelectionStore(state => state.selectionBox);
export const useIsSelecting = () => useSelectionStore(state => state.isSelecting);
export const useHasSelection = () => useSelectionStore(state => state.selectedComponents.length > 0);
export const useSelectedCount = () => useSelectionStore(state => state.selectedComponents.length);

// Helper hooks
export const useIsComponentSelected = (componentId: number) => 
  useSelectionStore(state => state.selectedComponents.includes(componentId));

export const useFirstSelectedComponent = () => 
  useSelectionStore(state => state.selectedComponents[0] || null);