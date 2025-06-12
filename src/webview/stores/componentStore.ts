import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { VrmComponent, ComponentTemplate, ComponentType, SectionType } from '../types/vrm';
import { COMPONENT_TYPES, COMPONENT_CATEGORIES, COMPONENT_CATEGORY_MAP, GRID_SIZE } from '../../shared/constants';
import { useDocumentStore } from './documentStore';
import { useMemo } from 'react';

interface ComponentStoreState {
  // Component templates for palette
  templates: ComponentTemplate[];
  
  // Drag and drop state
  draggedTemplate: ComponentTemplate | null;
  isDragging: boolean;
  
  // Component editing
  editingComponent: number | null;
  
  // Actions
  setDraggedTemplate: (template: ComponentTemplate | null) => void;
  setIsDragging: (isDragging: boolean) => void;
  setEditingComponent: (componentId: number | null) => void;
  
  // Component operations
  createComponent: (type: ComponentType, position: { x: number; y: number }, section: SectionType) => VrmComponent;
  duplicateComponent: (componentId: number) => void;
  moveComponent: (componentId: number, position: { x: number; y: number }) => void;
  moveComponents: (componentIds: number[], deltaX: number, deltaY: number) => void;
  
  // Grid operations
  snapToGrid: (position: { x: number; y: number }) => { x: number; y: number };
  
  // Helper functions
  getNextComponentId: () => number;
  getComponentTemplate: (type: ComponentType) => ComponentTemplate | null;
}

// Define component templates
const componentTemplates: ComponentTemplate[] = [
  // Database components
  {
    type: 'SQLTRN',
    label: 'SQL Transaction',
    description: 'Begin/Commit/Rollback database transactions',
    category: 'database',
    icon: 'database',
    defaultValues: {
      transactionName: '',
      transactionType: 'BEGIN'
    }
  },
  {
    type: 'SELECTQUERY',
    label: 'Select Query',
    description: 'Execute database select queries',
    category: 'database',
    icon: 'search',
    defaultValues: {
      query: '',
      params: []
    }
  },
  {
    type: 'INSERTUPDATEQUERY',
    label: 'Insert/Update Query',
    description: 'Execute database insert/update queries',
    category: 'database',
    icon: 'edit',
    defaultValues: {
      query: '',
      params: []
    }
  },
  
  // Script components
  {
    type: 'CSF',
    label: 'Script Function',
    description: 'Call script functions with parameters',
    category: 'script',
    icon: 'function',
    defaultValues: {
      functionName: '',
      returnValue: '',
      functionParams: []
    }
  },
  {
    type: 'SCRIPT',
    label: 'Script Block',
    description: 'Execute custom Pascal scripts',
    category: 'script',
    icon: 'code',
    defaultValues: {
      script: '',
      language: 'Pascal'
    }
  },
  
  // Control components
  {
    type: 'IF',
    label: 'Condition',
    description: 'Conditional branching logic',
    category: 'control',
    icon: 'fork',
    defaultValues: {
      condition: ''
    }
  },
  {
    type: 'ERROR',
    label: 'Error',
    description: 'Display errors and halt execution',
    category: 'control',
    icon: 'error',
    defaultValues: {
      errorMessage: ''
    }
  },
  
  // Data components
  {
    type: 'SET',
    label: 'Multi-Set Variables',
    description: 'Variable assignment operations',
    category: 'data',
    icon: 'variable',
    defaultValues: {
      variables: []
    }
  },
  {
    type: 'MATH',
    label: 'Math Operation',
    description: 'Mathematical calculations',
    category: 'data',
    icon: 'calculator',
    defaultValues: {
      mathName: '',
      mathFormat: '',
      mathParam: ''
    }
  },
  
  // Integration components
  {
    type: 'EXTERNAL',
    label: 'External Call',
    description: 'Call external rules/procedures',
    category: 'integration',
    icon: 'external',
    defaultValues: {
      externalValue: ''
    }
  },
  {
    type: 'TEMPLATE',
    label: 'Template',
    description: 'Process and generate templates',
    category: 'integration',
    icon: 'template',
    defaultValues: {
      templateName: '',
      templateTarget: ''
    }
  }
];

const initialState = {
  templates: componentTemplates,
  draggedTemplate: null,
  isDragging: false,
  editingComponent: null
};

export const useComponentStore = create<ComponentStoreState>()(
  immer((set, get) => ({
    ...initialState,

    setDraggedTemplate: (template: ComponentTemplate | null) => {
      set((state) => {
        state.draggedTemplate = template;
      });
    },

    setIsDragging: (isDragging: boolean) => {
      set((state) => {
        state.isDragging = isDragging;
      });
    },

    setEditingComponent: (componentId: number | null) => {
      set((state) => {
        state.editingComponent = componentId;
      });
    },

    createComponent: (type: ComponentType, position: { x: number; y: number }, section: SectionType) => {
      const template = get().getComponentTemplate(type);
      const nextId = get().getNextComponentId();
      const snappedPosition = get().snapToGrid(position);
      
      const newComponent: VrmComponent = {
        n: nextId,
        t: type,
        values: template?.defaultValues || {},
        j: [0, 0], // No connections initially
        x: snappedPosition.x,
        y: snappedPosition.y,
        c: template?.label || type, // Default comment
        wp: null, // No watchpoint initially
        section
      };

      // Add to document store
      useDocumentStore.getState().addComponent(newComponent);
      
      return newComponent;
    },

    duplicateComponent: (componentId: number) => {
      const documentStore = useDocumentStore.getState();
      const allComponents = [...(documentStore.document?.preproc || []), ...(documentStore.document?.postproc || [])];
      const component = allComponents.find(c => c.n === componentId);
      
      if (!component) return;

      const nextId = get().getNextComponentId();
      const duplicatedComponent: VrmComponent = {
        ...component,
        n: nextId,
        x: component.x + GRID_SIZE.x, // Offset position
        y: component.y + GRID_SIZE.y,
        j: [0, 0], // Clear connections
        c: component.c + ' (Copy)'
      };

      documentStore.addComponent(duplicatedComponent);
    },

    moveComponent: (componentId: number, position: { x: number; y: number }) => {
      const snappedPosition = get().snapToGrid(position);
      useDocumentStore.getState().updateComponent(componentId, {
        x: snappedPosition.x,
        y: snappedPosition.y
      });
    },

    moveComponents: (componentIds: number[], deltaX: number, deltaY: number) => {
      const documentStore = useDocumentStore.getState();
      
      componentIds.forEach(componentId => {
        const allComponents = [...(documentStore.document?.preproc || []), ...(documentStore.document?.postproc || [])];
        const component = allComponents.find(c => c.n === componentId);
        
        if (component) {
          const newPosition = {
            x: component.x + deltaX,
            y: component.y + deltaY
          };
          const snappedPosition = get().snapToGrid(newPosition);
          
          documentStore.updateComponent(componentId, {
            x: snappedPosition.x,
            y: snappedPosition.y
          });
        }
      });
    },

    snapToGrid: (position: { x: number; y: number }) => {
      const gridSize = GRID_SIZE;
      return {
        x: Math.round(position.x / gridSize.x) * gridSize.x,
        y: Math.round(position.y / gridSize.y) * gridSize.y
      };
    },

    getNextComponentId: () => {
      const documentStore = useDocumentStore.getState();
      if (!documentStore.document) return 1;
      
      const allComponents = [...documentStore.document.preproc, ...documentStore.document.postproc];
      if (allComponents.length === 0) return 1;
      
      const maxId = Math.max(...allComponents.map(c => c.n));
      return maxId + 1;
    },

    getComponentTemplate: (type: ComponentType) => {
      return get().templates.find(t => t.type === type) || null;
    }
  }))
);

// Selectors for commonly used values
export const useComponentTemplates = () => useComponentStore(state => state.templates);
export const useComponentTemplatesByCategory = () => {
  const templates = useComponentStore(state => state.templates);
  
  return useMemo(() => {
    const grouped: Record<string, ComponentTemplate[]> = {};
    
    templates.forEach(template => {
      if (!grouped[template.category]) {
        grouped[template.category] = [];
      }
      grouped[template.category].push(template);
    });
    
    return grouped;
  }, [templates]); // Only recreate when templates array reference changes
};

export const useDraggedTemplate = () => useComponentStore(state => state.draggedTemplate);
export const useIsDragging = () => useComponentStore(state => state.isDragging);
export const useEditingComponent = () => useComponentStore(state => state.editingComponent);

// Helper hooks
export const useComponentTemplate = (type: ComponentType) => 
  useComponentStore(state => state.getComponentTemplate(type));