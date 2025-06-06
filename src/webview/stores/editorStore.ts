import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { EditorMode, EditorState, SectionType, GridConfig, UIState } from '../types/vrm';
import { CANVAS_DEFAULTS, GRID_SIZE } from '../../shared/constants';

interface EditorStoreState extends EditorState, UIState {
  // Grid configuration
  grid: GridConfig;
  
  // Actions
  setMode: (mode: EditorMode) => void;
  setActiveSection: (section: SectionType) => void;
  setLoading: (isLoading: boolean) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  resetView: () => void;
  
  // Grid actions
  setGridVisible: (visible: boolean) => void;
  setSnapToGrid: (snap: boolean) => void;
  setGridSize: (size: { x: number; y: number }) => void;
  
  // UI actions
  setTheme: (theme: 'light' | 'dark' | 'high-contrast') => void;
  toggleSidebar: () => void;
  togglePropertiesPanel: () => void;
  toggleErrorPanel: () => void;
  toggleComponentPalette: () => void;
}

const initialDataState = {
  // Editor state
  mode: 'visual' as EditorMode,
  activeSection: 'preproc' as SectionType,
  isLoading: false,
  isDirty: false,
  lastSaved: null,
  zoom: CANVAS_DEFAULTS.ZOOM_DEFAULT,
  pan: { x: 0, y: 0 },
  
  // Grid configuration
  grid: {
    width: 1200,
    height: 800,
    cellSize: GRID_SIZE,
    snapToGrid: CANVAS_DEFAULTS.SNAP_TO_GRID,
    showGrid: CANVAS_DEFAULTS.GRID_VISIBLE
  },
  
  // UI state
  theme: 'dark' as 'light' | 'dark' | 'high-contrast',
  sidebarCollapsed: false,
  propertiesPanelOpen: true,
  errorPanelOpen: false,
  componentPaletteVisible: true
};

export const useEditorStore = create<EditorStoreState>()(
  immer((set, get) => ({
    ...initialDataState,

    setMode: (mode: EditorMode) => {
      set((state) => {
        state.mode = mode;
      });
    },

    setActiveSection: (section: SectionType) => {
      set((state) => {
        state.activeSection = section;
      });
    },

    setLoading: (isLoading: boolean) => {
      set((state) => {
        state.isLoading = isLoading;
      });
    },

    setZoom: (zoom: number) => {
      const clampedZoom = Math.max(
        CANVAS_DEFAULTS.ZOOM_MIN,
        Math.min(CANVAS_DEFAULTS.ZOOM_MAX, zoom)
      );
      
      set((state) => {
        state.zoom = clampedZoom;
      });
    },

    setPan: (pan: { x: number; y: number }) => {
      set((state) => {
        state.pan = pan;
      });
    },

    resetView: () => {
      set((state) => {
        state.zoom = CANVAS_DEFAULTS.ZOOM_DEFAULT;
        state.pan = { x: 0, y: 0 };
      });
    },

    setGridVisible: (visible: boolean) => {
      set((state) => {
        state.grid.showGrid = visible;
      });
    },

    setSnapToGrid: (snap: boolean) => {
      set((state) => {
        state.grid.snapToGrid = snap;
      });
    },

    setGridSize: (size: { x: number; y: number }) => {
      set((state) => {
        state.grid.cellSize = size;
      });
    },

    setTheme: (theme: 'light' | 'dark' | 'high-contrast') => {
      set((state) => {
        state.theme = theme;
      });
    },

    toggleSidebar: () => {
      set((state) => {
        state.sidebarCollapsed = !state.sidebarCollapsed;
      });
    },

    togglePropertiesPanel: () => {
      set((state) => {
        state.propertiesPanelOpen = !state.propertiesPanelOpen;
      });
    },

    toggleErrorPanel: () => {
      set((state) => {
        state.errorPanelOpen = !state.errorPanelOpen;
      });
    },

    toggleComponentPalette: () => {
      set((state) => {
        state.componentPaletteVisible = !state.componentPaletteVisible;
      });
    }
  }))
);

// Selectors for commonly used values
export const useEditorMode = () => useEditorStore(state => state.mode);
export const useActiveSection = () => useEditorStore(state => state.activeSection);
export const useEditorLoading = () => useEditorStore(state => state.isLoading);
export const useZoom = () => useEditorStore(state => state.zoom);
export const usePan = () => useEditorStore(state => state.pan);
export const useGrid = () => useEditorStore(state => state.grid);
export const useTheme = () => useEditorStore(state => state.theme);
export const useUIState = () => useEditorStore(state => ({
  sidebarCollapsed: state.sidebarCollapsed,
  propertiesPanelOpen: state.propertiesPanelOpen,
  errorPanelOpen: state.errorPanelOpen,
  componentPaletteVisible: state.componentPaletteVisible
}));