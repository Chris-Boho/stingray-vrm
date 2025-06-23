import { useConnectionStore } from '../../stores/connectionStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { useDocumentStore } from '../../stores/documentStore';
import { ComponentType } from '../../types/vrm';

export interface ConnectionHandlerOptions {
  componentId: number;
  componentType: ComponentType;
  onConnectionStart?: (componentId: number, type: 'primary' | 'secondary') => void;
  onConnectionEnd?: (targetId: number) => void;
  onConnectionCancel?: () => void;
}

export class ConnectionHandler {
  private static instance: ConnectionHandler;
  private isEnabled = true;

  static getInstance(): ConnectionHandler {
    if (!ConnectionHandler.instance) {
      ConnectionHandler.instance = new ConnectionHandler();
    }
    return ConnectionHandler.instance;
  }

  private constructor() {
    // No global keyboard listeners needed for simplified approach
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  // Check if component can have outgoing connections
  canHaveOutgoingConnection(componentType: ComponentType): boolean {
    const noOutgoingTypes: ComponentType[] = ['ERROR'];
    return !noOutgoingTypes.includes(componentType);
  }

  // Check if component can have secondary connections
  canHaveSecondaryConnection(componentType: ComponentType): boolean {
    const secondaryTypes: ComponentType[] = ['IF', 'SELECTQUERY', 'INSERTUPDATEQUERY'];
    return secondaryTypes.includes(componentType);
  }

  // Simplified click handler for direct connection creation
  handleComponentClick(
    event: React.MouseEvent,
    options: ConnectionHandlerOptions
  ): boolean {
    if (!this.isEnabled) return false;

    const { componentId, componentType } = options;

    console.log('Component clicked:', componentId, {
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      button: event.button,
      componentType
    });

    // Simplified connection creation: Alt+Click to create connection
    if (event.altKey) {
      event.stopPropagation();
      event.preventDefault();
      
      // Get currently selected component from selection store
      const selectionStore = useSelectionStore.getState();
      const { selectedComponents } = selectionStore;
      
      if (selectedComponents.length !== 1) {
        console.log('❌ Please select exactly one component first (currently selected:', selectedComponents.length, ')');
        return true;
      }
      
      const sourceComponentId = selectedComponents[0];
      
      // Can't connect to self
      if (sourceComponentId === componentId) {
        console.log('❌ Cannot connect component to itself');
        return true;
      }
      
      // Get source component to check if it can have outgoing connections
      const documentStore = useDocumentStore.getState();
      const allComponents = [
        ...(documentStore.document?.preproc || []),
        ...(documentStore.document?.postproc || [])
      ];
      const sourceComponent = allComponents.find(c => c.n === sourceComponentId);
      
      if (!sourceComponent) {
        console.log('❌ Source component not found');
        return true;
      }
      
      if (!this.canHaveOutgoingConnection(sourceComponent.t)) {
        console.log(`❌ Source component type ${sourceComponent.t} cannot have outgoing connections`);
        return true;
      }
      
      // Alt+Click = primary connection (we'll handle secondary in context menu)
      const connectionType: 'primary' | 'secondary' = 'primary';
      
      console.log(`🚀 Creating ${connectionType} connection: ${sourceComponentId} -> ${componentId}`);
      
      // Create the connection directly
      const connectionStore = useConnectionStore.getState();
      if (connectionStore.canCreateConnection(sourceComponentId, componentId, connectionType)) {
        // Update the VRM component data directly
        const updates: any = {};
        
        updates.j = [componentId, sourceComponent.j[1] || 0];

        documentStore.updateComponent(sourceComponentId, updates);
        documentStore.markDirty();
        
        console.log(`✅ Connection created: ${sourceComponentId} -> ${componentId} (${connectionType})`);
        console.log('Updated j array:', updates.j);
        
        options.onConnectionEnd?.(componentId);
      } else {
        console.log('❌ Connection validation failed');
      }
      
      return true;
    }

    // Regular click - let ReactFlow handle selection
    console.log('Regular click, letting ReactFlow handle selection');
    return false;
  }

  // Context menu handler for Alt+Right click secondary connections
  handleComponentContextMenu(
    event: React.MouseEvent,
    options: ConnectionHandlerOptions
  ): boolean {
    if (!this.isEnabled) return false;

    const { componentId, componentType } = options;
    
    console.log('Context menu event:', {
      altKey: event.altKey,
      button: event.button,
      componentId,
      componentType
    });

    // Alt + Right Click for secondary connections
    if (event.altKey) {
      event.preventDefault();
      event.stopPropagation();
      
      console.log('🔥 Alt+Right Click detected for secondary connection on component:', componentId);
      
      // Get currently selected component from selection store
      const selectionStore = useSelectionStore.getState();
      const { selectedComponents } = selectionStore;
      
      console.log('Selected components:', selectedComponents);
      
      if (selectedComponents.length !== 1) {
        console.log('❌ Please select exactly one component first (currently selected:', selectedComponents.length, ')');
        return true;
      }
      
      const sourceComponentId = selectedComponents[0];
      
      // Can't connect to self
      if (sourceComponentId === componentId) {
        console.log('❌ Cannot connect component to itself');
        return true;
      }
      
      // Get source component to check capabilities
      const documentStore = useDocumentStore.getState();
      const allComponents = [
        ...(documentStore.document?.preproc || []),
        ...(documentStore.document?.postproc || [])
      ];
      const sourceComponent = allComponents.find(c => c.n === sourceComponentId);
      
      if (!sourceComponent) {
        console.log('❌ Source component not found');
        return true;
      }
      
      console.log('Source component found:', sourceComponent.t, 'can have outgoing:', this.canHaveOutgoingConnection(sourceComponent.t));
      
      if (!this.canHaveOutgoingConnection(sourceComponent.t)) {
        console.log(`❌ Source component type ${sourceComponent.t} cannot have outgoing connections`);
        return true;
      }

      console.log('Can have secondary:', this.canHaveSecondaryConnection(sourceComponent.t));

      if (!this.canHaveSecondaryConnection(sourceComponent.t)) {
        console.log(`❌ Source component type ${sourceComponent.t} cannot have secondary connections`);
        return true;
      }

      const connectionType: 'primary' | 'secondary' = 'secondary';
      
      console.log(`🚀 Creating ${connectionType} connection: ${sourceComponentId} -> ${componentId}`);
      
      // Create the secondary connection directly
      const connectionStore = useConnectionStore.getState();
      const canCreate = connectionStore.canCreateConnection(sourceComponentId, componentId, connectionType);
      
      console.log('Can create connection:', canCreate);
      
      if (canCreate) {
        // Update secondary connection (j[1])
        const updates: any = {
          j: [sourceComponent.j[0] || 0, componentId]
        };

        console.log('Updating component with:', updates);

        documentStore.updateComponent(sourceComponentId, updates);
        documentStore.markDirty();
        
        console.log(`✅ Secondary connection created: ${sourceComponentId} -> ${componentId}`);
        console.log('Updated j array:', updates.j);
        
        options.onConnectionEnd?.(componentId);
      } else {
        console.log('❌ Secondary connection validation failed');
      }
      
      return true;
    }

    // Regular right click - just prevent default for now
    console.log('Regular right click (no Alt key)');
    event.preventDefault();
    return true;
  }

  // Canvas click handler (not needed for simplified approach)
  handleCanvasClick(event: React.MouseEvent): boolean {
    return false;
  }

  // Get current connection state
  getConnectionState() {
    return useConnectionStore.getState();
  }
}

// Export singleton instance
export const connectionHandler = ConnectionHandler.getInstance();

// React hook for using connection handler
export function useConnectionHandler(componentId: number, componentType: ComponentType) {
  const handleClick = (event: React.MouseEvent) => {
    return connectionHandler.handleComponentClick(event, {
      componentId,
      componentType,
    });
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    return connectionHandler.handleComponentContextMenu(event, {
      componentId,
      componentType,
    });
  };

  return {
    handleClick,
    handleContextMenu,
    canHaveOutgoing: connectionHandler.canHaveOutgoingConnection(componentType),
    canHaveSecondary: connectionHandler.canHaveSecondaryConnection(componentType),
  };
}