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
└── visual-editor/
    ├── ComponentParser.ts    # Parses VRM components from XML
    ├── ComponentXmlGenerator.ts # Generates XML from components
    ├── EditorScripts.ts     # JavaScript functionality for editor
    ├── HtmlGenerator.ts      # Generates HTML for visual editor
    ├── VrmComponent.ts       # Component interface definitions
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
6. **Edit properties** → Component type, SQL queries, parameters, conditions
7. **Save changes** → Updates written back to VRM XML with real-time position updates

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

#### Advanced Connection Routing

- **Multi-segment orthogonal routing**: Professional step-wise connections
- **Handlebar connections**: Special routing for vertically adjacent components
- **Optimal spacing detection**: Direct horizontal connections for components 52-56px apart
- **Adaptive routing**: Different algorithms based on component positions
- **Connection types**: Primary (blue) and secondary (gray) connections
- **3px line thickness**: Enhanced visibility
- **15px vertical buffers**: Clean entry/exit from components

#### Canvas Features

- **Large workspace**: 1200x2000px scrollable canvas
- **Grid background**: Visual grid pattern matching snap points
- **Zoom controls**: Zoom in/out/reset functionality
- **Custom scrollbars**: Styled to match VSCode theme
- **Component details panel**: Floating panel showing selected component info

### Language Support

- **HTML**: Full IntelliSense, syntax highlighting, Emmet support
- **JavaScript**: Complete language features, error checking
- **SQL**: Within component editors for database queries
- **XML**: Underlying VRM structure maintained

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

### Error Handling

- XML parsing error recovery
- File operation error handling with detailed logging
- Component validation and user feedback
- Graceful degradation for malformed content
- Cleanup error handling to prevent orphaned files

## Recent Enhancements

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

## Future Enhancements

### Potential Features

- **Component library**: Predefined component templates
- **Validation**: Real-time XML and workflow validation
- **Export options**: Standalone HTML/JS file generation
- **Theme support**: Custom color schemes for components
- **Debugging**: Workflow execution visualization
- **Version control**: Better diff/merge support for VRM files
- **Connection arrowheads**: Visual flow direction indicators
- **Undo/Redo**: Component position and property change history

### Performance Optimizations

- **Lazy loading**: Only parse visible components
- **Incremental updates**: Partial XML regeneration
- **Caching**: Component metadata caching
- **Virtual scrolling**: Handle large workflows efficiently
- **Connection optimization**: Reduce rendering overhead for complex workflows
