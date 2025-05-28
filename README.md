# VRM Editor Extension

A Visual Studio Code extension for editing VRM (Visual Resource Manager) files with specialized editors for HTML, JavaScript, and visual programming workflow components.

## Project Overview

VRM files are XML-based configuration files that contain three main sections:

- **HTML content** with embedded JavaScript
- **Preprocessing workflow** (`<preproc>`) - business logic components
- **Postprocessing workflow** (`<postproc>`) - business logic components

This extension provides a comprehensive editing experience by separating these concerns into specialized editors while maintaining file integrity.

## File Structure

```
src/
├── extension.ts              # Main extension entry point
├── VrmEditorProvider.ts      # Custom editor implementation
├── VrmDocument.ts           # Document wrapper and operations
├── VrmParser.ts             # XML parsing and manipulation
├── VrmVisualEditor.ts       # Visual programming interface
├── types.ts                 # TypeScript interface definitions
└── visual-editor/
    ├── ComponentParser.ts    # Parses VRM components from XML
    ├── ComponentXmlGenerator.ts # Generates XML from components
    ├── EditorScripts.ts     # JavaScript functionality for editor
    ├── HtmlGenerator.ts      # Generates HTML for visual editor
    ├── VrmComponent.ts       # Component interface definitions
    ├── modules/             # Manager classes for editor functionality
    │   ├── StateManager.ts      # Global state management
    │   ├── SelectionManager.ts  # Component selection handling
    │   ├── DragDropManager.ts   # Drag and drop operations
    │   ├── RenderingManager.ts  # Component rendering and display
    │   ├── ComponentEditor.ts   # Component editing dialogs
    │   ├── ContextMenuManager.ts # Right-click context menus
    │   ├── KeyboardManager.ts   # Keyboard shortcuts
    │   └── ConnectionManager.ts # Component connection manipulation
    └── styles/              # CSS styles for editor UI
```

## Core Files Description

### extension.ts

- **Purpose**: Extension activation and command registration
- **Key Functions**:
  - Registers the custom VRM editor provider
  - Sets up command handlers for HTML/JS editor buttons
  - Manages extension lifecycle

### VrmEditorProvider.ts

- **Purpose**: Main custom editor implementation
- **Key Functions**:
  - Implements `vscode.CustomTextEditorProvider` interface
  - Creates webview-based editor interface
  - Manages temporary file creation and cleanup
  - Handles HTML/JS editor workflows
  - Processes component updates from visual editor
- **Features**:
  - Temp file management in `.vscode/vrm-editor/`
  - Enhanced auto-cleanup when VRM files are closed
  - GitIgnore integration for temp files
  - Live sync between temp files and VRM content
  - Dual cleanup strategy (tracked files + directory scanning)
  - Proper editor closing before file deletion

### VrmDocument.ts

- **Purpose**: Wrapper for VRM document operations
- **Key Functions**:
  - Extracts HTML and JavaScript content from VRM files
  - Updates specific sections while preserving file structure
  - Provides clean interface for document manipulation
- **Methods**:
  - `getHtmlContent()` - Extracts HTML (excludes JS component divs)
  - `getJsContent()` - Extracts JavaScript from js-component divs
  - `updateHtmlContent()` - Updates HTML while preserving JS sections
  - `updateJsContent()` - Updates JavaScript sections

### VrmParser.ts

- **Purpose**: Low-level XML parsing and content manipulation
- **Key Functions**:
  - Parses VRM XML structure
  - Extracts HTML content from `<html><![CDATA[...]]></html>`
  - Extracts JS from `<div class="js-component"><pre>...</pre></div>`
  - Handles CDATA sections and HTML entity encoding/decoding
  - Regenerates XML with updated content

### VrmVisualEditor.ts

- **Purpose**: Visual programming interface for workflow components
- **Key Functions**:
  - Parses `<preproc>` and `<postproc>` XML sections separately
  - Creates tabbed visual node-based workflow editor
  - Handles component editing through modal dialogs
  - Manages component connections and flow logic
  - Implements drag-and-drop component repositioning
  - Advanced connection routing with multiple algorithms

### types.ts

- **Purpose**: Centralized TypeScript type definitions
- **Key Interfaces**:
  - `VrmComponent` - Component data structure
  - `IStateManager` - State management interface
  - `ISelectionManager` - Selection handling interface
  - `IDragDropManager` - Drag and drop interface
  - `IRenderingManager` - Rendering interface
  - `IConnectionManager` - Connection manipulation interface
  - `CustomWindow` - Extended window object with manager references
  - Handler types for proper event management

### Manager Classes (src/visual-editor/modules/)

#### StateManager.ts
- **Purpose**: Central state management for the visual editor
- **Responsibilities**:
  - Component data storage (preproc/postproc)
  - Selection state tracking
  - Drag and drop state management
  - Zoom and tab state
  - Grid snapping utilities
  - Component color mapping

#### SelectionManager.ts
- **Purpose**: Handles component selection operations
- **Features**:
  - Single and multi-component selection
  - Box selection with drag rectangle
  - Contextual selection (above/below/row/column)
  - Selection state restoration after re-rendering
  - Keyboard shortcuts (Ctrl+A, Escape)

#### DragDropManager.ts
- **Purpose**: Manages drag and drop operations
- **Features**:
  - Single component dragging with grid snapping
  - Multi-component dragging with relative positioning
  - Canvas boundary enforcement
  - Real-time position updates
  - Proper event handler cleanup

#### RenderingManager.ts
- **Purpose**: Handles component and connection visualization
- **Features**:
  - SVG-based component rendering
  - Advanced connection routing algorithms
  - Visual feedback for selections and interactions
  - Canvas event handling
  - Connection visualization with arrows

#### ComponentEditor.ts
- **Purpose**: Component property editing interface
- **Features**:
  - Modal dialogs for component editing
  - Component details panel
  - Parameter management for SQL queries
  - Connection information display
  - Multi-selection details

#### ContextMenuManager.ts
- **Purpose**: Right-click context menu functionality
- **Features**:
  - Selection operations (above/below/row/column)
  - Temporary notification messages
  - Menu positioning and styling
  - Outside-click menu closing

#### KeyboardManager.ts
- **Purpose**: Keyboard shortcut handling
- **Features**:
  - Global keyboard event management
  - Selection shortcuts (Ctrl+A, Escape)
  - Click-outside selection clearing
  - Drag prevention on canvas elements

#### ConnectionManager.ts
- **Purpose**: Component connection manipulation
- **Features**:
  - Primary and secondary connection creation
  - Connection validation (same section, no self-connection)
  - Connection clearing on empty space
  - Visual feedback for connection operations
  - Connection removal interface

#### Component Structure

Each workflow component has:

```xml
<c>                           <!-- Component wrapper -->
  <n>0</n>                    <!-- Component ID -->
  <t>IF</t>                   <!-- Component type -->
  <values>...</values>        <!-- Component-specific data -->
  <j>8</j>                    <!-- Primary connection -->
  <j>10</j>                   <!-- Secondary connection -->
  <x>32</x>                   <!-- X coordinate -->
  <y>26</y>                   <!-- Y coordinate -->
  <c>Verify user rights</c>   <!-- Comment -->
  <wp>0</wp>                  <!-- Watchpoint flag -->
</c>
```

## User Workflow

### HTML/JavaScript Editing

1. **Open VRM file** → Custom editor interface appears
2. **Click "Open HTML Editor"** → Creates `filename.vrm.html` temp file
3. **Click "Open JavaScript Editor"** → Creates `filename.vrm.js` temp file
4. **Edit in separate tabs** with full VSCode language support
5. **Save with Ctrl+S** → Changes sync back to VRM file
6. **Close VRM file** → Temp files automatically cleaned up (enhanced cleanup system)

### Visual Workflow Editing

1. **View tabbed interface** with separate Preprocessing and Postprocessing sections
2. **Switch between tabs** to view different workflow stages
3. **Drag components** to reposition them with grid snapping
4. **Click components** → View details in side panel with visual selection
5. **Double-click components** → Open full editor modal
6. **Edit properties** → Component type, SQL queries, parameters, conditions, connections
7. **Save changes** → Updates written back to VRM XML with real-time position updates

### Connection Management

1. **Select a component** by clicking on it
2. **Create primary connection** → Shift+Click target component
3. **Create secondary connection** → Shift+Right-click target component
4. **Clear primary connection** → Shift+Click empty space
5. **Clear secondary connection** → Shift+Right-click empty space
6. **Remove connections** → Right-click component → Select connection to remove

## Key Features

### Enhanced Temp File Management

- **Smart naming**: `filename.vrm.html`, `filename.vrm.js`
- **File reuse**: Reopening editors reuses existing temp files
- **Robust auto-cleanup**: Files deleted when VRM editor closes using dual strategy
- **Directory scanning**: Catches orphaned temp files that weren't tracked
- **GitIgnore integration**: Temp directory automatically ignored
- **Editor closing**: Properly closes open temp file editors before deletion

### Content Separation

- **HTML extraction**: Removes JavaScript sections for clean HTML editing
- **JS extraction**: Isolates JavaScript from HTML structure
- **Preservation**: Non-edited sections remain unchanged
- **Sync on demand**: Button clicks refresh temp files with current VRM content

### Advanced Visual Programming

#### Tabbed Interface

- **Preprocessing tab**: Shows components that run before main logic
- **Postprocessing tab**: Shows components that run after main logic
- **Component counters**: Displays number of components in each section
- **Independent canvases**: Each section has its own scrollable workspace

#### Interactive Component System

- **Component types**: IF, SELECTQUERY, INSERTUPDATEQUERY, SET, ERROR, etc.
- **Color coding**: Different colors for different component types
- **32x32px icons**: Properly sized component representations
- **Visual selection**: Selected components highlighted with outline
- **Drag-and-drop**: Click and drag components to reposition them
- **Grid snapping**: Components snap to 32x26px grid for alignment
- **Real-time updates**: Position changes immediately saved to VRM file

#### Advanced Connection Management

- **Dual connections**: Each component supports primary and secondary connections
- **Visual distinction**: Primary connections (blue), secondary connections (gray)
- **Interactive creation**: Shift+click for primary, shift+right-click for secondary
- **Connection clearing**: Shift+click/right-click on empty space to clear connections
- **Validation**: Prevents self-connections and cross-section connections
- **Connection menu**: Right-click components to manage existing connections

#### Advanced Connection Routing

- **Multi-segment orthogonal routing**: Professional step-wise connections
- **Handlebar connections**: Special routing for vertically adjacent components
- **Optimal spacing detection**: Direct horizontal connections for components 52-56px apart
- **Adaptive routing**: Different algorithms based on component positions
- **Connection types**: Primary (blue) and secondary (gray) connections
- **3px line thickness**: Enhanced visibility
- **15px vertical buffers**: Clean entry/exit from components
- **Arrow indicators**: Direction arrows on connection lines

#### Canvas Features

- **Large workspace**: 1200x2000px scrollable canvas
- **Grid background**: Visual grid pattern matching snap points
- **Zoom controls**: Zoom in/out/reset functionality
- **Custom scrollbars**: Styled to match VSCode theme
- **Component details panel**: Floating panel showing selected component info
- **Multi-selection support**: Select and manipulate multiple components

#### Selection System

- **Single selection**: Click components for individual selection
- **Multi-selection**: Ctrl+click to add/remove from selection
- **Box selection**: Click and drag on empty space to select multiple components
- **Contextual selection**: Right-click for advanced selection options (above/below/row/column)
- **Keyboard shortcuts**: Ctrl+A (select all), Escape (clear selection)
- **Visual feedback**: Selected components highlighted with outline

### Language Support

- **HTML**: Full IntelliSense, syntax highlighting, Emmet support
- **JavaScript**: Complete language features, error checking
- **SQL**: Within component editors for database queries
- **XML**: Underlying VRM structure maintained
- **TypeScript**: Full type safety throughout the codebase

## Configuration

### Settings

- `vrmEditor.autoSave`: Enable automatic saving (default: false)
- `vrmEditor.autoSaveDelay`: Auto-save delay in milliseconds (default: 500)

### File Associations

- Extension automatically handles `.vrm` files
- Right-click context menu: "Open VRM Editor"

## Technical Implementation

### Architecture

- **Custom TextEditor**: Implements VSCode's custom editor API
- **Webview-based UI**: HTML/CSS/JS interface for visual components
- **Virtual documents**: Temporary files for HTML/JS editing
- **XML manipulation**: Preserves structure while allowing targeted updates
- **Modular design**: Separate manager classes for different responsibilities
- **Type-safe**: Full TypeScript typing throughout the codebase

### TypeScript Type System

- **Centralized types**: All interfaces defined in `types.ts`
- **Interface-based design**: Clear contracts between modules
- **Generic type safety**: Proper typing for event handlers and callbacks
- **No `any` types**: Full type coverage for compile-time error checking
- **Custom Window typing**: Extended window object with manager references

### Grid System

- **Horizontal spacing**: 32px (matches VRM file coordinates)
- **Vertical spacing**: 26px (matches VRM file coordinates)
- **Snap-to-grid**: Automatic alignment during drag operations
- **Visual feedback**: Grid pattern visible on canvas background

### Connection Algorithms

#### Multi-Segment Orthogonal Routing

- **Entry/Exit buffers**: 15px clean spacing from components
- **Waypoint calculation**: Intelligent midpoint routing
- **Collision avoidance**: Handles components positioned above source

#### Handlebar Routing

- **Trigger conditions**: Same X-axis and within 30px vertically
- **Left-side routing**: Connections go out to the left to avoid overlap
- **Visual clarity**: Ensures connections always visible

#### Optimal Spacing

- **Detection range**: Components 52-56px apart vertically
- **Direct horizontal**: Skips middle waypoints for clean paths
- **Performance**: Reduces visual complexity for common layouts

### Parsing Strategy

- **XML-aware**: Handles CDATA sections, nested tags, and entity encoding
- **Section isolation**: Separates HTML, JS, and workflow components
- **Structure preservation**: Maintains formatting and non-edited content
- **Error handling**: Graceful degradation when parsing fails

### Visual Editor

- **SVG-based canvas**: Scalable, interactive component rendering
- **Node positioning**: Components placed at exact XML coordinates
- **Connection visualization**: Multiple routing algorithms for clean paths
- **Modal editing**: Complete forms for all component properties
- **State management**: Tracks component positions, selections, and editing state

## Development Notes

### Extension Points

- Custom editor registration in `package.json`
- Command contributions for editor actions
- File association with `.vrm` extension
- Menu contributions for context actions

### State Management

- Component state in visual editor with section tracking
- Temp file tracking and cleanup with dual strategies
- Document synchronization between editors
- User preference handling
- Drag-and-drop state management
- Grid snapping calculations
- Connection state tracking

### Error Handling

- XML parsing error recovery
- File operation error handling with detailed logging
- Component validation and user feedback
- Graceful degradation for malformed content
- Cleanup error handling to prevent orphaned files
- Type-safe error boundaries

## Recent Enhancements

### Version 3.0 Features

#### TypeScript Migration

- **Full type safety**: Complete TypeScript conversion with proper interfaces
- **Centralized types**: All type definitions in `types.ts`
- **Interface contracts**: Clear contracts between all modules
- **No `any` types**: Eliminated all `any` usage for full type coverage
- **Compile-time checking**: Catch errors during development, not runtime

#### Modular Architecture

- **Manager classes**: Separated functionality into focused manager classes
- **Single responsibility**: Each manager handles one aspect of the editor
- **Clean interfaces**: Well-defined APIs between modules
- **Testable design**: Isolated components for easier testing
- **Maintainable code**: Clear separation of concerns

#### Advanced Connection System

- **Interactive connection creation**: Shift+click and shift+right-click for connections
- **Connection validation**: Prevents invalid connections (self, cross-section)
- **Connection clearing**: Shift+click on empty space to clear connections
- **Visual connection management**: Right-click menus for connection operations
- **Dual connection support**: Primary and secondary connections per component
- **Connection persistence**: Connections saved to VRM XML immediately

#### Enhanced User Experience

- **Improved feedback**: Better visual and textual feedback for all operations
- **Keyboard shortcuts**: Comprehensive keyboard shortcut system
- **Context menus**: Right-click menus for advanced operations
- **Selection system**: Advanced multi-selection with various selection modes
- **Drag and drop**: Smooth single and multi-component dragging
- **Grid snapping**: Precise component alignment with visual grid

### Version 2.0 Features

#### Enhanced Cleanup System

- **Dual cleanup strategy**: Combines tracked file cleanup with directory scanning
- **Orphaned file detection**: Finds and removes temp files not in tracking map
- **Proper editor management**: Closes temp file editors before deletion
- **Error resilience**: Continues cleanup even if individual operations fail

#### Advanced Visual Interface

- **Tabbed sections**: Separate preprocessing and postprocessing workflows
- **Interactive drag-and-drop**: Real-time component repositioning
- **Grid snapping**: 32x26px alignment matching VRM coordinates
- **Enhanced connections**: Multiple routing algorithms for clean paths
- **Visual feedback**: Selection highlighting, drag states, component counters

#### Improved User Experience

- **Larger canvas**: 1200x2000px workspace with smooth scrolling
- **Better visibility**: 3px connection lines, clear grid background
- **Professional routing**: Step-wise connections with proper spacing
- **Responsive interface**: Real-time updates and visual feedback

## Keyboard Shortcuts

### General
- **Ctrl+A**: Select all components in current tab
- **Escape**: Clear selection
- **Delete**: Delete selected components (coming soon)

### Selection
- **Click**: Select single component
- **Ctrl+Click**: Add/remove component from selection
- **Click+Drag on empty space**: Box selection
- **Right-click**: Context menu with selection options

### Connections
- **Shift+Click component**: Set primary connection from selected component
- **Shift+Right-click component**: Set secondary connection from selected component
- **Shift+Click empty space**: Clear primary connection from selected component
- **Shift+Right-click empty space**: Clear secondary connection from selected component
- **Right-click component**: Show connection management menu

### Editing
- **Double-click component**: Open component editor
- **Drag component**: Move component (with grid snapping)
- **Drag selected components**: Move all selected components together

## Future Enhancements

### Potential Features

- **Component library**: Predefined component templates
- **Validation**: Real-time XML and workflow validation
- **Export options**: Standalone HTML/JS file generation
- **Theme support**: Custom color schemes for components
- **Debugging**: Workflow execution visualization
- **Version control**: Better diff/merge support for VRM files
- **Undo/Redo**: Component position and property change history
- **Component deletion**: Delete key support for removing components
- **Component duplication**: Copy and paste components
- **Workflow validation**: Check for unreachable components and circular references

### Performance Optimizations

- **Lazy loading**: Only parse visible components
- **Incremental updates**: Partial XML regeneration
- **Caching**: Component metadata caching
- **Virtual scrolling**: Handle large workflows efficiently
- **Connection optimization**: Reduce rendering overhead for complex workflows
- **Batch operations**: Group multiple component updates for efficiency