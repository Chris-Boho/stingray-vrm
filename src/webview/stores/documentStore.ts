import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { VrmDocument, VrmComponent, FileState, VrmError } from '../types/vrm';
import { VrmParserService } from '../services/vrmParser';
import { vscodeService } from '../services/vscodeService';

interface DocumentState {
  // Document data
  document: VrmDocument | null;
  fileState: FileState | null;
  
  // Parse state
  isLoading: boolean;
  isDirty: boolean;
  lastSaved: Date | null;
  errors: VrmError[];
  
  // Original content for comparison
  originalContent: string;
  
  // Actions
  loadDocument: (content: string, uri: string) => Promise<void>;
  saveDocument: () => Promise<void>;
  updateComponent: (componentId: number, component: Partial<VrmComponent>) => void;
  addComponent: (component: VrmComponent) => void;
  removeComponent: (componentId: number) => void;
  updateHtmlContent: (html: string) => void;
  updateJavaScriptContent: (js: string) => void;
  markDirty: () => void;
  clearErrors: () => void;
  addError: (error: VrmError) => void;
  reset: () => void;
}

const initialState = {
  document: null,
  fileState: null,
  isLoading: false,
  isDirty: false,
  lastSaved: null,
  errors: [],
  originalContent: ''
};

export const useDocumentStore = create<DocumentState>()(
  immer((set, get) => ({
    ...initialState,

    loadDocument: async (content: string, uri: string) => {
      set((state) => {
        state.isLoading = true;
        state.errors = [];
      });

      try {
        const parser = VrmParserService.getInstance();
        const document = parser.parseVrmContent(content);
        
        // Validate the document
        const validationErrors = parser.validateDocument(document);
        const errors: VrmError[] = validationErrors.map((message, index) => ({
          id: `validation-${index}`,
          type: 'validation',
          message,
          timestamp: new Date()
        }));

        const fileName = uri.split('/').pop() || 'unknown.vrm';
        
        set((state) => {
          state.document = document;
          state.fileState = {
            uri,
            fileName,
            content,
            lastModified: new Date(),
            isReadOnly: false
          };
          state.originalContent = content;
          state.isLoading = false;
          state.isDirty = false;
          state.errors = errors;
        });

        vscodeService.sendLog('info', 'Document loaded successfully', { 
          uri, 
          components: document.preproc.length + document.postproc.length,
          errors: errors.length 
        });

      } catch (error) {
        const vrmError: VrmError = {
          id: 'parse-error',
          type: 'parse',
          message: error instanceof Error ? error.message : 'Unknown parse error',
          timestamp: new Date()
        };

        set((state) => {
          state.isLoading = false;
          state.errors = [vrmError];
        });

        vscodeService.sendError('Failed to parse VRM document', error instanceof Error ? error.stack : undefined);
      }
    },

    saveDocument: async () => {
      const { document, fileState } = get();
      
      if (!document || !fileState) {
        throw new Error('No document to save');
      }

      try {
        set((state) => {
          state.isLoading = true;
        });

        const parser = VrmParserService.getInstance();
        const xmlContent = parser.generateVrmXml(document);
        
        // Send save request to VS Code
        vscodeService.sendSave(xmlContent);
        
        set((state) => {
          state.originalContent = xmlContent;
          state.isDirty = false;
          state.lastSaved = new Date();
          state.isLoading = false;
        });

        vscodeService.sendLog('info', 'Document saved successfully');

      } catch (error) {
        set((state) => {
          state.isLoading = false;
        });

        const vrmError: VrmError = {
          id: 'save-error',
          type: 'runtime',
          message: error instanceof Error ? error.message : 'Unknown save error',
          timestamp: new Date()
        };

        set((state) => {
          state.errors.push(vrmError);
        });

        vscodeService.sendError('Failed to save document', error instanceof Error ? error.stack : undefined);
        throw error;
      }
    },

    updateComponent: (componentId: number, updates: Partial<VrmComponent>) => {
      set((state) => {
        if (!state.document) return;

        // Find component in preproc
        const preprocIndex = state.document.preproc.findIndex(c => c.n === componentId);
        if (preprocIndex !== -1) {
          Object.assign(state.document.preproc[preprocIndex], updates);
          state.isDirty = true;
          return;
        }

        // Find component in postproc
        const postprocIndex = state.document.postproc.findIndex(c => c.n === componentId);
        if (postprocIndex !== -1) {
          Object.assign(state.document.postproc[postprocIndex], updates);
          state.isDirty = true;
          return;
        }

        console.warn(`Component ${componentId} not found for update`);
      });
    },

    addComponent: (component: VrmComponent) => {
      set((state) => {
        if (!state.document) return;

        // Check for ID conflicts
        const allComponents = [...state.document.preproc, ...state.document.postproc];
        if (allComponents.some(c => c.n === component.n)) {
          // Generate new ID
          const maxId = Math.max(...allComponents.map(c => c.n), 0);
          component.n = maxId + 1;
        }

        // Add to appropriate section
        if (component.section === 'preproc') {
          state.document.preproc.push(component);
        } else {
          state.document.postproc.push(component);
        }

        state.isDirty = true;
      });
    },

    removeComponent: (componentId: number) => {
      set((state) => {
        if (!state.document) return;

        // Remove from preproc
        const preprocIndex = state.document.preproc.findIndex(c => c.n === componentId);
        if (preprocIndex !== -1) {
          state.document.preproc.splice(preprocIndex, 1);
          state.isDirty = true;
          return;
        }

        // Remove from postproc
        const postprocIndex = state.document.postproc.findIndex(c => c.n === componentId);
        if (postprocIndex !== -1) {
          state.document.postproc.splice(postprocIndex, 1);
          state.isDirty = true;
          return;
        }

        // Remove connections to this component
        const allComponents = [...state.document.preproc, ...state.document.postproc];
        allComponents.forEach(component => {
          component.j = component.j.map(connectionId => 
            connectionId === componentId ? 0 : connectionId
          );
        });
      });
    },

    updateHtmlContent: (html: string) => {
      set((state) => {
        if (!state.document) return;
        
        state.document.html = html;
        state.isDirty = true;
      });
    },

    updateJavaScriptContent: (js: string) => {
      set((state) => {
        if (!state.document) return;

        const parser = VrmParserService.getInstance();
        state.document.html = parser.injectJavaScript(state.document.html, js);
        state.isDirty = true;
      });
    },

    markDirty: () => {
      set((state) => {
        state.isDirty = true;
      });
    },

    clearErrors: () => {
      set((state) => {
        state.errors = [];
      });
    },

    addError: (error: VrmError) => {
      set((state) => {
        state.errors.push(error);
      });
    },

    reset: () => {
      set((state) => {
        Object.assign(state, initialState);
      });
    }
  }))
);

// Selectors for commonly used data
export const useDocument = () => useDocumentStore(state => state.document);
export const useFileState = () => useDocumentStore(state => state.fileState);
export const useDocumentErrors = () => useDocumentStore(state => state.errors);
export const useDocumentLoading = () => useDocumentStore(state => state.isLoading);
export const useDocumentDirty = () => useDocumentStore(state => state.isDirty);

// Helper hooks for specific data
export const usePreprocComponents = () => useDocumentStore(state => state.document?.preproc || []);
export const usePostprocComponents = () => useDocumentStore(state => state.document?.postproc || []);
export const useAllComponents = () => useDocumentStore(state => {
  if (!state.document) return [];
  return [...state.document.preproc, ...state.document.postproc];
});

export const useComponent = (componentId: number) => useDocumentStore(state => {
  if (!state.document) return null;
  return [...state.document.preproc, ...state.document.postproc]
    .find(c => c.n === componentId) || null;
});

export const useHtmlContent = () => useDocumentStore(state => state.document?.html || '');
export const useJavaScriptContent = () => useDocumentStore(state => {
  if (!state.document?.html) return '';
  const parser = VrmParserService.getInstance();
  return parser.extractJavaScript(state.document.html);
});