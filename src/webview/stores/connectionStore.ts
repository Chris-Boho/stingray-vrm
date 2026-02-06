import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ConnectionState, ComponentType } from '../types/vrm';
import { useDocumentStore } from './documentStore';

interface ConnectionStoreState extends ConnectionState {
  // Actions
  startConnection: (componentId: number, connectionType: 'primary' | 'secondary') => void;
  endConnection: (targetComponentId: number) => void;
  cancelConnection: () => void;
  updateTempConnection: (position: { x: number; y: number }) => void;
  
  // Validation
  canCreateConnection: (sourceId: number, targetId: number, connectionType: 'primary' | 'secondary') => boolean;
  canComponentHaveSecondaryConnection: (componentType: ComponentType) => boolean;
  canComponentHaveOutgoingConnection: (componentType: ComponentType) => boolean;
  
  // Helpers
  isInConnectionMode: () => boolean;
  getConnectionModeInfo: () => { sourceId: number; connectionType: 'primary' | 'secondary' } | null;
}

// Components that can have secondary connections
const SECONDARY_CONNECTION_COMPONENTS: ComponentType[] = ['IF', 'SELECTQUERY', 'INSERTUPDATEQUERY'];

// Components that cannot have outgoing connections
const NO_OUTGOING_CONNECTION_COMPONENTS: ComponentType[] = ['ERROR'];

const initialState: ConnectionState = {
  isCreating: false,
  sourceComponent: null,
  sourceConnectionType: null,
  tempConnection: null
};

export const useConnectionStore = create<ConnectionStoreState>()(
  immer((set, get) => ({
    ...initialState,

    startConnection: (componentId: number, connectionType: 'primary' | 'secondary') => {
      console.log(`Starting connection from component ${componentId}, type: ${connectionType}`);
      
      set((state) => {
        state.isCreating = true;
        state.sourceComponent = componentId;
        state.sourceConnectionType = connectionType;
        state.tempConnection = null;
      });
    },

    endConnection: (targetComponentId: number) => {
      const { sourceComponent, sourceConnectionType } = get();
      
      if (!sourceComponent || !sourceConnectionType) {
        console.warn('No active connection to complete');
        return;
      }

      // Validate the connection
      if (!get().canCreateConnection(sourceComponent, targetComponentId, sourceConnectionType)) {
        console.warn('Invalid connection attempt');
        get().cancelConnection();
        return;
      }

      console.log(`Creating connection: ${sourceComponent} -> ${targetComponentId} (${sourceConnectionType})`);

      // Update the VRM component data
      const documentStore = useDocumentStore.getState();
      const sourceComponentData = documentStore.getComponentsByIds([sourceComponent])[0];

      if (sourceComponentData) {
        const updates: any = {};
        
        if (sourceConnectionType === 'primary') {
          // Update primary connection (j[0])
          updates.j = [targetComponentId, sourceComponentData.j[1] || 0];
        } else {
          // Update secondary connection (j[1])
          updates.j = [sourceComponentData.j[0] || 0, targetComponentId];
        }

        documentStore.updateComponent(sourceComponent, updates);
        documentStore.markDirty();
        
        console.log(`Updated component ${sourceComponent} connections:`, updates.j);
      }

      // Clear connection state
      set((state) => {
        state.isCreating = false;
        state.sourceComponent = null;
        state.sourceConnectionType = null;
        state.tempConnection = null;
      });
    },

    cancelConnection: () => {
      console.log('Cancelling connection creation');
      
      set((state) => {
        state.isCreating = false;
        state.sourceComponent = null;
        state.sourceConnectionType = null;
        state.tempConnection = null;
      });
    },

    updateTempConnection: (position: { x: number; y: number }) => {
      const { sourceComponent } = get();
      
      if (!sourceComponent) {
        console.warn('No source component for temp connection update');
        return;
      }

      // Get source component position using the simplified helper
      const documentStore = useDocumentStore.getState();
      const sourceComponentData = documentStore.getComponentsByIds([sourceComponent])[0];

      if (!sourceComponentData) {
        console.warn('Source component not found for temp connection');
        return;
      }

      set((state) => {
        state.tempConnection = {
          start: { 
            x: sourceComponentData.x + 16, // Center of 32px component
            y: sourceComponentData.y + 32   // Bottom of component
          },
          end: position // Use the position provided by the mouse hook
        };
      });
    },

    canCreateConnection: (sourceId: number, targetId: number, connectionType: 'primary' | 'secondary') => {
      // Can't connect to self
      if (sourceId === targetId) {
        console.log('Cannot connect component to itself');
        return false;
      }

      // Get component data using the simplified helper
      const documentStore = useDocumentStore.getState();
      const sourceComponent = documentStore.getComponentsByIds([sourceId])[0];
      const targetComponent = documentStore.getComponentsByIds([targetId])[0];

      if (!sourceComponent || !targetComponent) {
        console.log('Source or target component not found');
        return false;
      }

      // Check if source component can have outgoing connections
      if (!get().canComponentHaveOutgoingConnection(sourceComponent.t)) {
        console.log(`Component type ${sourceComponent.t} cannot have outgoing connections`);
        return false;
      }

      // Check if source component can have secondary connections
      if (connectionType === 'secondary' && !get().canComponentHaveSecondaryConnection(sourceComponent.t)) {
        console.log(`Component type ${sourceComponent.t} cannot have secondary connections`);
        return false;
      }

      // Check if connection already exists
      const connectionIndex = connectionType === 'primary' ? 0 : 1;
      if (sourceComponent.j[connectionIndex] === targetId) {
        console.log('Connection already exists');
        return false;
      }

      return true;
    },

    canComponentHaveSecondaryConnection: (componentType: ComponentType) => {
      return SECONDARY_CONNECTION_COMPONENTS.includes(componentType);
    },

    canComponentHaveOutgoingConnection: (componentType: ComponentType) => {
      return !NO_OUTGOING_CONNECTION_COMPONENTS.includes(componentType);
    },

    isInConnectionMode: () => {
      return get().isCreating;
    },

    getConnectionModeInfo: () => {
      const { isCreating, sourceComponent, sourceConnectionType } = get();
      
      if (!isCreating || !sourceComponent || !sourceConnectionType) {
        return null;
      }

      return {
        sourceId: sourceComponent,
        connectionType: sourceConnectionType
      };
    }
  }))
);

// Selectors for commonly used values
export const useIsCreatingConnection = () => useConnectionStore(state => state.isCreating);
export const useConnectionSource = () => useConnectionStore(state => state.sourceComponent);
export const useConnectionType = () => useConnectionStore(state => state.sourceConnectionType);
export const useTempConnection = () => useConnectionStore(state => state.tempConnection);
export type { ConnectionStoreState };
// Helper hooks
export const useConnectionModeInfo = () => useConnectionStore(state => 
  state.isCreating && state.sourceComponent && state.sourceConnectionType
    ? { sourceId: state.sourceComponent, connectionType: state.sourceConnectionType }
    : null
);