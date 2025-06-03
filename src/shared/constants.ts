// Extension configuration
export const EXTENSION_ID = 'vrmEditor';
export const CUSTOM_EDITOR_VIEW_TYPE = 'vrmEditor.editor';

// File extensions and patterns
export const VRM_FILE_EXTENSION = '.vrm';
export const VRM_FILE_PATTERN = '**/*.vrm';

// Grid system constants (from README: 32x26px grid)
export const GRID_SIZE = {
  X: 32,
  Y: 26
} as const;

// Component types as defined in the README
export const COMPONENT_TYPES = {
  // Database components
  SQL_TRANSACTION: 'SQLTRN',
  SELECT_QUERY: 'SELECTQUERY',
  INSERT_UPDATE_QUERY: 'INSERTUPDATEQUERY',
  
  // Script components
  SCRIPT_FUNCTION: 'CSF',
  SCRIPT_BLOCK: 'SCRIPT',
  
  // Control components
  CONDITION: 'IF',
  ERROR: 'ERROR',
  
  // Data components
  MULTI_SET_VARIABLES: 'SET',
  MATH_OPERATION: 'MATH',
  
  // Integration components
  EXTERNAL_CALL: 'EXTERNAL',
  TEMPLATE: 'TEMPLATE'
} as const;

// Component categories for UI grouping
export const COMPONENT_CATEGORIES = {
  DATABASE: 'Database',
  SCRIPT: 'Script', 
  CONTROL: 'Control',
  DATA: 'Data',
  INTEGRATION: 'Integration'
} as const;

// Component category mapping
export const COMPONENT_CATEGORY_MAP = {
  [COMPONENT_TYPES.SQL_TRANSACTION]: COMPONENT_CATEGORIES.DATABASE,
  [COMPONENT_TYPES.SELECT_QUERY]: COMPONENT_CATEGORIES.DATABASE,
  [COMPONENT_TYPES.INSERT_UPDATE_QUERY]: COMPONENT_CATEGORIES.DATABASE,
  
  [COMPONENT_TYPES.SCRIPT_FUNCTION]: COMPONENT_CATEGORIES.SCRIPT,
  [COMPONENT_TYPES.SCRIPT_BLOCK]: COMPONENT_CATEGORIES.SCRIPT,
  
  [COMPONENT_TYPES.CONDITION]: COMPONENT_CATEGORIES.CONTROL,
  [COMPONENT_TYPES.ERROR]: COMPONENT_CATEGORIES.CONTROL,
  
  [COMPONENT_TYPES.MULTI_SET_VARIABLES]: COMPONENT_CATEGORIES.DATA,
  [COMPONENT_TYPES.MATH_OPERATION]: COMPONENT_CATEGORIES.DATA,
  
  [COMPONENT_TYPES.EXTERNAL_CALL]: COMPONENT_CATEGORIES.INTEGRATION,
  [COMPONENT_TYPES.TEMPLATE]: COMPONENT_CATEGORIES.INTEGRATION
} as const;

// VRM file structure constants
export const VRM_SECTIONS = {
  PREPROC: 'preproc',
  HTML: 'html', 
  POSTPROC: 'postproc'
} as const;

// Component XML structure
export const COMPONENT_XML_FIELDS = {
  ID: 'n',
  TYPE: 't', 
  VALUES: 'values',
  PRIMARY_CONNECTION: 'j',
  SECONDARY_CONNECTION: 'j', // Note: can have multiple j elements
  X_POSITION: 'x',
  Y_POSITION: 'y',
  COMMENT: 'c',
  WATCHPOINT: 'wp'
} as const;

// Default settings
export const DEFAULT_SETTINGS = {
  autoSave: false,
  autoSaveDelay: 500,
  gridSize: GRID_SIZE,
  theme: {
    gridVisible: true,
    componentColors: {}
  }
} as const;

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  SELECT_ALL: 'ctrl+a',
  CLEAR_SELECTION: 'escape',
  DELETE_COMPONENTS: 'delete',
  UNDO: 'ctrl+z',
  REDO: 'ctrl+y',
  SAVE: 'ctrl+s',
  ZOOM_IN: 'ctrl+=',
  ZOOM_OUT: 'ctrl+-',
  RESET_ZOOM: 'ctrl+0'
} as const;

// Canvas constants
export const CANVAS_DEFAULTS = {
  ZOOM_MIN: 0.1,
  ZOOM_MAX: 3.0,
  ZOOM_DEFAULT: 1.0,
  ZOOM_STEP: 0.1,
  SNAP_TO_GRID: true,
  GRID_VISIBLE: true
} as const;

// Connection constants
export const CONNECTION_DEFAULTS = {
  STROKE_WIDTH: 2,
  STROKE_COLOR: '#888888',
  HOVER_COLOR: '#ffffff',
  SELECTED_COLOR: '#007acc'
} as const;

// Component visual constants  
export const COMPONENT_DEFAULTS = {
  WIDTH: 120,
  HEIGHT: 60,
  BORDER_RADIUS: 4,
  BORDER_WIDTH: 1,
  FONT_SIZE: 12
} as const;

// Temp file management
export const TEMP_FILE_CONFIG = {
  DIRECTORY: '.vscode/vrm-editor',
  HTML_SUFFIX: '.vrm.html',
  JS_SUFFIX: '.vrm.js',
  GITIGNORE_ENTRY: '.vscode/vrm-editor/'
} as const;

// Error messages
export const ERROR_MESSAGES = {
  INVALID_VRM_FORMAT: 'Invalid VRM file format',
  PARSE_ERROR: 'Failed to parse VRM content',
  SAVE_ERROR: 'Failed to save VRM file',
  COMPONENT_NOT_FOUND: 'Component not found',
  INVALID_CONNECTION: 'Invalid component connection'
} as const;