import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { VrmComponent, SectionType } from '../types/vrm';
import { vscodeService } from '../services/vscodeService';
import { useDocumentStore } from './documentStore';
import { useEditorStore } from './editorStore';
import { useComponentStore } from './componentStore';
import { GRID_SIZE } from '../../shared/constants';

interface ClipboardState {
  // Remote clipboard state (from extension host)
  hasRemoteData: boolean;
  remoteComponentCount: number;
  sourceFile?: string;
  lastClipboardUpdate: number;
  
  // Local operation state
  isOperationInProgress: boolean;
  operationType: 'copy' | 'paste' | null;
  
  // Actions
  copyComponents: (componentIds: number[]) => void;
  pasteComponents: (targetPosition: { x: number; y: number }, section: SectionType) => void;
  pasteAtPosition: (targetPosition: { x: number; y: number }) => void;
  pasteAtCenter: () => void;
  clearClipboard: () => void;
  requestClipboardStatus: () => void;
  
  // Internal handlers (called by vscodeService)
  handleClipboardStatus: (hasData: boolean, componentCount: number, sourceFile?: string) => void;
  handleClipboardData: (data: any) => void;
  handlePasteError: (error: string) => void;
  
  // Helpers
  canPaste: () => boolean;
  getClipboardInfo: () => string;
  hasClipboardData: () => boolean;
}

const initialState = {
  hasRemoteData: false,
  remoteComponentCount: 0,
  sourceFile: undefined,
  lastClipboardUpdate: 0,
  isOperationInProgress: false,
  operationType: null
};

export const useClipboardStore = create<ClipboardState>()(
  immer((set, get) => ({
    ...initialState,

    copyComponents: (componentIds: number[]) => {
      if (!componentIds || componentIds.length === 0) {
        console.log('❌ No components provided to copy');
        return;
      }

      console.log(`🔍 Starting copy operation for component IDs: [${componentIds.join(', ')}]`);

      const documentStore = useDocumentStore.getState();
      if (!documentStore.document) {
        console.warn('❌ No document loaded for copy operation');
        return;
      }

      // Use the new helper function to get components by IDs directly
      const componentsToCopy = documentStore.getComponentsByIds(componentIds);
      
      console.log(`📋 Components found to copy: ${componentsToCopy.length} (requested: ${componentIds.length})`);
      console.log(`📋 Found component IDs: [${componentsToCopy.map(c => c.n).join(', ')}]`);
      console.log(`📋 Found component types: [${componentsToCopy.map(c => c.t).join(', ')}]`);

      if (componentsToCopy.length === 0) {
        console.warn(`❌ No valid components found to copy from IDs: [${componentIds.join(', ')}]`);
        return;
      }

      if (componentsToCopy.length !== componentIds.length) {
        const foundIds = componentsToCopy.map(c => c.n);
        const missingIds = componentIds.filter(id => !foundIds.includes(id));
        console.warn(`⚠️ Mismatch: Requested ${componentIds.length} components, found ${componentsToCopy.length}`);
        console.warn(`⚠️ Missing component IDs: [${missingIds.join(', ')}]`);
      }

      // Calculate bounding box for relative positioning
      const minX = Math.min(...componentsToCopy.map(c => c.x));
      const minY = Math.min(...componentsToCopy.map(c => c.y));
      const copyOrigin = { x: minX, y: minY };

      console.log(`📋 Copy origin calculated: (${copyOrigin.x}, ${copyOrigin.y})`);

      // Clean component data for clipboard - PRESERVE EXACT STRUCTURE
      const cleanedComponents = componentsToCopy.map(component => {
        const cleanedComponent = {
          ...component,
          j: [0, 0], // Clear all connections
          n: 0, // Will be reassigned on paste
          section: component.section // Preserve original section for reference
        };
        
        console.log(`📋 Cleaned component: ID ${component.n} -> Type ${component.t}, Position (${component.x}, ${component.y})`);
        return cleanedComponent;
      });

      console.log(`📋 Final components to copy: ${cleanedComponents.length}`);

      // Set operation in progress
      set((state) => {
        state.isOperationInProgress = true;
        state.operationType = 'copy';
      });

      // Send to extension host
      vscodeService.postMessage({
        type: 'copy-components',
        components: cleanedComponents,
        copyOrigin,
        timestamp: Date.now()
      });

      console.log(`✅ Copy request sent to extension host: ${cleanedComponents.length} components`);

      // Clear operation state after a brief delay
      setTimeout(() => {
        set((state) => {
          state.isOperationInProgress = false;
          state.operationType = null;
        });
      }, 500);
    },

    pasteComponents: (targetPosition: { x: number; y: number }, section: SectionType) => {
      if (!get().hasRemoteData) {
        console.warn('❌ No clipboard data available for paste');
        return;
      }

      console.log(`🎯 Requesting paste at position (${targetPosition.x}, ${targetPosition.y}) in ${section} section`);

      // Set operation in progress
      set((state) => {
        state.isOperationInProgress = true;
        state.operationType = 'paste';
      });

      // Request paste from extension host
      vscodeService.postMessage({
        type: 'paste-components',
        targetPosition,
        section,
        timestamp: Date.now()
      });
    },

    pasteAtPosition: (targetPosition: { x: number; y: number }) => {
      const { activeSection } = useEditorStore.getState();
      get().pasteComponents(targetPosition, activeSection || 'preproc');
    },

    pasteAtCenter: () => {
      // Use a default center position
      const centerPosition = { x: 200, y: 150 };
      get().pasteAtPosition(centerPosition);
    },

    clearClipboard: () => {
      console.log('🗑️ Clearing clipboard');
      
      vscodeService.postMessage({
        type: 'clear-clipboard',
        timestamp: Date.now()
      });

      // Update local state
      set((state) => {
        state.hasRemoteData = false;
        state.remoteComponentCount = 0;
        state.sourceFile = undefined;
        state.lastClipboardUpdate = Date.now();
      });
    },

    requestClipboardStatus: () => {
      vscodeService.postMessage({
        type: 'get-clipboard-status',
        timestamp: Date.now()
      });
    },

    handleClipboardStatus: (hasData: boolean, componentCount: number, sourceFile?: string) => {
      console.log(`📋 Clipboard status updated: hasData=${hasData}, count=${componentCount}, source=${sourceFile}`);
      
      set((state) => {
        state.hasRemoteData = hasData;
        state.remoteComponentCount = componentCount;
        state.sourceFile = sourceFile;
        state.lastClipboardUpdate = Date.now();
      });
    },

    handleClipboardData: (data: any) => {
      const { components, copyOrigin, targetPosition, section } = data;
      
      if (!components || !Array.isArray(components) || components.length === 0) {
        console.warn('❌ Invalid clipboard data received');
        get().handlePasteError('Invalid clipboard data');
        return;
      }

      console.log(`📥 PASTE VERIFICATION: Received clipboard data with ${components.length} components`);
      console.log(`📥 Components to paste:`, components.map((c, i) => ({ 
        index: i + 1, 
        originalId: c.n, 
        type: c.t, 
        x: c.x, 
        y: c.y 
      })));

      // Get required stores
      const documentStore = useDocumentStore.getState();
      const componentStore = useComponentStore.getState();

      if (!documentStore.document) {
        get().handlePasteError('No document loaded');
        return;
      }

      // Get existing components to avoid position conflicts
      const existingComponents = section === 'preproc' 
        ? documentStore.document.preproc 
        : documentStore.document.postproc;

      console.log(`📥 Existing components in ${section}: ${existingComponents.length}`);
      console.log(`📥 Existing component IDs: [${existingComponents.map(c => c.n).join(', ')}]`);

      // Generate new components with proper IDs and positions
      const newComponents: VrmComponent[] = [];

      console.log(`📥 COMPONENT CREATION: Processing ${components.length} components for paste...`);

      components.forEach((component: VrmComponent, index: number) => {
        // Generate new unique ID
        const newId = componentStore.getNextComponentId() + index;
        console.log(`📥 Processing component ${index + 1}/${components.length}: Original ID ${component.n} -> New ID ${newId}`);

        // Calculate relative position from copy origin
        const relativeX = component.x - copyOrigin.x;
        const relativeY = component.y - copyOrigin.y;

        // Calculate final position
        let finalX = targetPosition.x + relativeX;
        let finalY = targetPosition.y + relativeY;

        // Ensure position is not negative
        finalX = Math.max(0, finalX);
        finalY = Math.max(0, finalY);

        // Snap to grid
        const snappedPosition = componentStore.snapToGrid({ x: finalX, y: finalY });

        // Find safe position to avoid overlaps
        let testPosition = snappedPosition;
        let attempts = 0;
        const maxAttempts = 20;

        while (attempts < maxAttempts) {
          const hasConflict = existingComponents.some(existing => 
            Math.abs(existing.x - testPosition.x) < GRID_SIZE.x && 
            Math.abs(existing.y - testPosition.y) < GRID_SIZE.y
          ) || newComponents.some(created =>
            Math.abs(created.x - testPosition.x) < GRID_SIZE.x && 
            Math.abs(created.y - testPosition.y) < GRID_SIZE.y
          );

          if (!hasConflict) {
            break;
          }

          // Try next position (offset by grid size)
          testPosition = {
            x: testPosition.x + GRID_SIZE.x,
            y: testPosition.y
          };
          attempts++;
        }

        const newComponent: VrmComponent = {
          ...component,
          n: newId,
          x: testPosition.x,
          y: testPosition.y,
          section: section,
          j: [0, 0], // Connections cleared
          c: component.c ? component.c + ' (Copy)' : 'Copy'
        };

        console.log(`📥 Created component ${index + 1}: ID ${newId}, Type ${newComponent.t}, Position (${testPosition.x}, ${testPosition.y})`);
        newComponents.push(newComponent);
      });

      console.log(`📥 FINAL VERIFICATION: Created exactly ${newComponents.length} new components`);
      console.log(`📥 New component IDs: [${newComponents.map(c => c.n).join(', ')}]`);

      // Add all new components to the document
      newComponents.forEach((component, index) => {
        console.log(`📥 Adding component ${index + 1} to document: ID ${component.n}, Type ${component.t}`);
        documentStore.addComponent(component);
      });

      // Select the newly pasted components
      const newComponentIds = newComponents.map(c => c.n);
      
      console.log(`📥 Selecting newly pasted components: [${newComponentIds.join(', ')}]`);

      // Import and use selection store directly to avoid stale state
      import('./selectionStore').then(({ useSelectionStore }) => {
        useSelectionStore.getState().selectComponents(newComponentIds);
        console.log(`📥 Selection updated to: [${newComponentIds.join(', ')}]`);
      });

      // Mark document as dirty
      documentStore.markDirty();

      console.log(`✅ PASTE COMPLETE: Successfully pasted ${newComponents.length} components with IDs: [${newComponentIds.join(', ')}]`);

      // Clear operation state
      set((state) => {
        state.isOperationInProgress = false;
        state.operationType = null;
      });

      // Log successful paste
      vscodeService.sendLog('info', `Pasted ${newComponents.length} components`, {
        componentIds: newComponentIds,
        section,
        targetPosition
      });
    },

    handlePasteError: (error: string) => {
      console.error('❌ Paste operation failed:', error);
      
      // Clear operation state
      set((state) => {
        state.isOperationInProgress = false;
        state.operationType = null;
      });

      // Log error
      vscodeService.sendError(`Paste failed: ${error}`);
    },

    canPaste: () => {
      const state = get();
      return state.hasRemoteData && !state.isOperationInProgress;
    },

    getClipboardInfo: () => {
      const state = get();
      if (!state.hasRemoteData) {
        return 'No components in clipboard';
      }

      const count = state.remoteComponentCount;
      const componentText = count === 1 ? 'component' : 'components';
      const sourceText = state.sourceFile ? ` from ${state.sourceFile}` : '';
      
      return `${count} ${componentText}${sourceText}`;
    },

    hasClipboardData: () => {
      return get().hasRemoteData;
    }
  }))
);

// Selectors for commonly used values
export const useHasClipboardData = () => useClipboardStore(state => state.hasRemoteData);
export const useClipboardComponentCount = () => useClipboardStore(state => state.remoteComponentCount);
export const useClipboardSourceFile = () => useClipboardStore(state => state.sourceFile);
export const useClipboardInfo = () => useClipboardStore(state => state.getClipboardInfo());
export const useCanPaste = () => useClipboardStore(state => state.canPaste());
export const useIsClipboardOperationInProgress = () => useClipboardStore(state => state.isOperationInProgress);

// Helper hooks - FIXED to get fresh selection state
export const useClipboardOperations = () => {
  const store = useClipboardStore();
  
  return {
    copySelected: () => {
      // Get fresh selection state directly from selection store
      import('./selectionStore').then(({ useSelectionStore }) => {
        const { selectedComponents } = useSelectionStore.getState();
        console.log(`🎯 copySelected called with selection: [${selectedComponents.join(', ')}]`);
        
        if (selectedComponents.length === 0) {
          console.log('❌ No components selected for copy');
          return;
        }
        
        store.copyComponents(selectedComponents);
      });
    },
    copyComponents: store.copyComponents,
    pasteAtPosition: store.pasteAtPosition,
    pasteAtCenter: store.pasteAtCenter,
    clearClipboard: store.clearClipboard,
    canPaste: store.canPaste(),
    hasData: store.hasRemoteData,
    info: store.getClipboardInfo()
  };
};