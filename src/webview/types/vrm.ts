// VRM Component Types
export type ComponentType = 
  | 'SQLTRN'           // SQL Transaction
  | 'SELECTQUERY'      // Select Query
  | 'INSERTUPDATEQUERY' // Insert/Update Query
  | 'CSF'              // Script Function
  | 'SCRIPT'           // Script Block
  | 'IF'               // Condition
  | 'ERROR'            // Error
  | 'SET'              // Multi-Set Variables
  | 'MATH'             // Math Operation
  | 'EXTERNAL'         // External Call
  | 'TEMPLATE';        // Template

export type SectionType = 'preproc' | 'postproc';

export type ParameterType = 'STRING' | 'INTEGER' | 'DECIMAL' | 'BOOLEAN' | 'DATE';

// Component Interfaces
export interface ComponentParameter {
  name: string;
  type: ParameterType;
  value: string;
}

export interface CsfParameter {
  label: string;
  value: string;
}

export interface SetVariable {
  name: string;
  value: string;
}

// Component Values Interface (union of all possible component data)
export interface ComponentValues {
  // Common fields
  conditions?: string[];
  
  // CSF Component
  functionName?: string;
  returnValue?: string;
  functionParams?: CsfParameter[];
  
  // SQL Transaction
  transactionName?: string;
  transactionType?: string;
  
  // Math Component
  mathName?: string;
  mathFormat?: string;
  mathParam?: string;
  
  // Template Component
  templateName?: string;
  templateTarget?: string;
  
  // Query Components (SELECT/INSERT/UPDATE)
  query?: string;
  params?: ComponentParameter[];
  
  // Script Component
  script?: string;
  language?: string;
  
  // Error Component
  errorMessage?: string;
  
  // IF Component
  condition?: string;
  
  // SET Component
  variables?: SetVariable[];
  
  // External Component
  externalValue?: string;
}

// Main VRM Component Interface
export interface VrmComponent {
  n: number;                    // Component ID
  t: ComponentType;             // Component type
  values?: ComponentValues;     // Component-specific data
  j: number[];                  // Jump connections [primary, secondary]
  x: number;                    // X coordinate
  y: number;                    // Y coordinate
  c: string;                    // Comment
  wp: boolean | null;           // Watchpoint (true/false/null for empty)
  section: SectionType;         // Which section this component belongs to
}

// VRM Document Structure
export interface VrmDocument {
  function?: {
    fn: string;
    lockedBy: string;
    DenyURLExecution?: boolean;
    DenyAjaxExecution?: boolean;
    lintMsg?: string;
  };
  preproc: VrmComponent[];
  html: string;
  postproc: VrmComponent[];
  languages?: string;
  scripts?: string;
}

// Grid Configuration
export interface GridConfig {
  width: number;
  height: number;
  cellSize: {
    x: number;
    y: number;
  };
  snapToGrid: boolean;
  showGrid: boolean;
}

// Selection State
export interface SelectionState {
  selectedComponents: number[];
  selectionBox: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  } | null;
  isSelecting: boolean;
}

// Connection State
export interface ConnectionState {
  isCreating: boolean;
  sourceComponent: number | null;
  sourceConnectionType: 'primary' | 'secondary' | null;
  tempConnection: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  } | null;
}

// Editor Modes
export type EditorMode = 'visual' | 'html' | 'javascript';

// Editor State
export interface EditorState {
  mode: EditorMode;
  activeSection: SectionType;
  isLoading: boolean;
  isDirty: boolean;
  lastSaved: Date | null;
  zoom: number;
  pan: { x: number; y: number };
}

// Component Template for insertion
export interface ComponentTemplate {
  type: ComponentType;
  label: string;
  description: string;
  category: 'database' | 'script' | 'control' | 'data' | 'integration';
  icon: string;
  defaultValues: Partial<ComponentValues>;
  defaultSize?: { width: number; height: number };
}

// History State for undo/redo
export interface HistoryEntry {
  id: string;
  timestamp: Date;
  action: string;
  data: any;
  description: string;
}

// Error Types
export interface VrmError {
  id: string;
  type: 'parse' | 'validation' | 'runtime';
  message: string;
  component?: number;
  section?: SectionType;
  timestamp: Date;
}

// File State
export interface FileState {
  uri: string;
  fileName: string;
  content: string;
  lastModified: Date | null;
  isReadOnly: boolean;
}

// Theme and UI State
export interface UIState {
  theme: 'light' | 'dark' | 'high-contrast';
  sidebarCollapsed: boolean;
  propertiesPanelOpen: boolean;
  errorPanelOpen: boolean;
  componentPaletteVisible: boolean;
}