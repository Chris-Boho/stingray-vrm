# Stingray VRM Editor

A Visual Studio Code extension for editing Stingray VRM (Visual Resource Model) files with a visual interface. This extension provides a custom editor for .vrm files, allowing users to visually edit component-based configurations.

## Project Structure

### Core Files

#### `extension.ts`
- **Entry point** of the extension
- Registers the custom editor provider for .vrm files
- Handles activation and deactivation of the extension
- Registers commands for opening the VRM editor

#### `VrmEditorProvider.ts`
- Implements `CustomTextEditorProvider` for VS Code
- Manages the document lifecycle and webview panel
- Handles document synchronization between the editor and file system
- Manages component state and updates
- Implements save and revert functionality

#### `VrmVisualEditor.ts`
- Main class for the visual editor functionality
- Manages component state (preproc and postproc sections)
- Coordinates between the webview and the VS Code extension
- Handles component parsing and generation

### Visual Editor Components

#### `ComponentParser.ts`
- Parses VRM XML content into component objects
- Handles extraction of component properties and connections
- Validates component structure and relationships

#### `ComponentXmlGenerator.ts`
- Generates XML from component objects
- Handles component creation, updates, and deletion in the XML structure
- Manages component connections and properties

#### `HtmlGenerator.ts`
- Generates HTML content for the webview
- Creates the visual interface for the component editor
- Handles styling and layout of the editor

### Modules

#### `SaveManager.ts`
- Manages document saving operations
- Handles auto-save functionality
- Tracks document dirty state

#### `DocumentState.ts`
- Manages the state of the document
- Tracks changes and modifications
- Handles undo/redo functionality

#### `ComponentPalette.ts`
- Manages the palette of available components
- Handles drag-and-drop of components
- Provides component templates

#### `ConnectionManager.ts`
- Manages connections between components
- Validates connection rules
- Handles connection creation and deletion

#### `SelectionManager.ts`
- Manages component selection state
- Handles multi-select operations
- Coordinates with the visual editor for highlighting

### Types

#### `types.ts`
- Defines TypeScript interfaces for VRM components and related types
- Centralizes type definitions used throughout the application

## Project Flow

1. **Initialization**
   - User opens a .vrm file in VS Code
   - Extension activates and registers the custom editor
   - Webview is created to host the visual editor

2. **Loading**
   - File content is parsed into component objects
   - Components are categorized into preproc and postproc sections
   - Visual representation is generated and displayed

3. **Editing**
   - User can add, modify, or delete components
   - Component properties can be edited through the UI
   - Connections between components can be created or removed
   - Changes are tracked and the document is marked as dirty

4. **Saving**
   - When saved, component data is converted back to XML
   - The original file is updated with the changes
   - Document state is updated to clean

## Key Features

- Visual editing of VRM components
- Real-time preview of changes
- Support for preproc and postproc sections
- Component connection management
- Undo/redo support
- Auto-save functionality
- Syntax highlighting for VRM files

## Visual Editor

The Visual Editor provides an intuitive interface for working with VRM components through a webview-based interface. It consists of several key components:

### Editor Interface
- **Component Palette**: A collapsible sidebar containing draggable component templates
- **Canvas**: Main workspace where components are placed and connected
- **Toolbar**: Contains zoom controls and quick actions
- **Section Tabs**: Toggle between Preprocessing and Postprocessing sections
- **Property Panel**: Edit component properties when a component is selected

### Core Functionality
- **Drag-and-Drop**: Components can be dragged from the palette onto the canvas
- **Component Connections**: Visual representation of data flow between components
- **Context Menus**: Right-click context menus for component actions
- **Zoom Controls**: Adjust the view of the canvas
- **Multi-select**: Select multiple components for batch operations

### Component Management
- **Component Templates**: Predefined templates for common VRM components
- **Property Editing**: Inline editing of component properties
- **Connection Management**: Visual creation and management of connections between components
- **Undo/Redo**: Track changes and support for undoing/redoing actions

## HTML/JS Editor

The HTML/JS Editor provides direct access to the underlying code representation of the VRM components:

### Features
- **Dual-View Editing**: Toggle between visual and code views
- **Monaco Editor**: Powered by VS Code's Monaco editor for syntax highlighting and IntelliSense
- **Live Preview**: See changes reflected in real-time
- **Code Validation**: Syntax checking and validation
- **Keyboard Shortcuts**: Optimized for efficient code editing

### Editor Components
1. **HTML Editor**
   - Direct access to the component structure
   - Syntax highlighting for VRM XML format
   - Code folding and bracket matching
   - Auto-indentation and formatting

2. **JavaScript Editor**
   - Edit component behavior and logic
   - Full JavaScript/TypeScript support
   - Access to VRM component API
   - Integrated debugging support

### Integration with Visual Editor
- **Bidirectional Updates**: Changes in the code editor are reflected in the visual editor and vice versa
- **Component Synchronization**: Components added/modified in one view are automatically updated in the other
- **Error Highlighting**: Visual indicators for syntax errors and validation issues
- **State Management**: Shared state between visual and code editors

## Architecture

The editor system follows a modular architecture:

```
└── Editor System
    ├── Visual Editor (WebView)
    │   ├── Component Palette
    │   ├── Canvas
    │   ├── Property Panel
    │   └── Toolbar
    │
    ├── Code Editor (Monaco)
    │   ├── HTML/XML Editor
    │   └── JavaScript Editor
    │
    └── Core Services
        ├── State Management
        ├── Undo/Redo
        ├── File I/O
        └── Validation
```

## User Interaction Flow

1. **Component Creation**
   - User drags a component from the palette to the canvas
   - Component is instantiated with default properties
   - Visual representation is rendered on the canvas

2. **Component Editing**
   - User selects a component to edit its properties
   - Property panel updates to show editable fields
   - Changes are reflected in real-time

3. **Connection Management**
   - User creates connections between components
   - Visual indicators show valid connection points
   - Connection validation ensures data type compatibility

4. **Code Editing**
   - User switches to code view
   - Makes direct edits to the component definitions
   - Changes are synchronized with the visual editor

## Advanced Features

- **Template System**: Create and save custom component templates
- **Keyboard Shortcuts**: Optimized workflow with keyboard navigation
- **Component Search**: Quickly find components in large projects
- **Version Control Integration**: Track changes and collaborate with team members
- **Performance Optimization**: Efficient rendering for large component graphs

