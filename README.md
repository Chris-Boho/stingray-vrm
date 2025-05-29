# VRM Editor Extension

A Visual Studio Code extension that provides specialized editing tools for VRM (Visual Resource Manager) files with visual workflow design capabilities.

## Features

### 🎯 **Multi-Editor Interface**
- **HTML Editor**: Extract and edit HTML content in a separate tab with full language support
- **JavaScript Editor**: Edit embedded JavaScript with IntelliSense and error checking  
- **Visual Workflow Editor**: Drag-and-drop interface for designing business logic workflows

### 🎨 **Visual Workflow Designer**
- **Component Palette**: Horizontal toolbar with 11 component types for easy insertion
- **Drag & Drop**: Drag components from palette directly to canvas
- **Grid Snapping**: Automatic alignment to 32x26 pixel grid
- **Dual Sections**: Separate preprocessing and postprocessing workflow areas
- **Smart Connections**: Visual connection system with automatic routing algorithms

### 🔧 **Advanced Editing**
- **Component Editor**: Modal dialogs for editing component properties and parameters
- **Multi-Selection**: Select and manipulate multiple components simultaneously
- **Context Menus**: Right-click menus for component insertion and management
- **Keyboard Shortcuts**: Full keyboard navigation and shortcuts (accessible via info icon)

### 🗃️ **Supported Components**
| Category | Components |
|----------|------------|
| **Database** | SQL Transaction, Select Query, Insert/Update Query |
| **Script** | Script Function, Script Block |
| **Control** | Condition (IF), Error Component |
| **Data** | Multi-Set Variables, Math Operation |
| **Integration** | External Call, Template |

## Installation

1. Install from the VS Code Extensions Marketplace
2. Open a `.vrm` file
3. The custom VRM editor will automatically activate

## Quick Start

### HTML/JavaScript Editing
1. **Open VRM file** → Custom editor interface appears
2. **Click "Open HTML Editor"** → Creates temporary HTML file with language support
3. **Click "Open JavaScript Editor"** → Creates temporary JS file with IntelliSense
4. **Edit in separate tabs** → Changes sync back to VRM file automatically
5. **Save with Ctrl+S** → Updates are written to the original VRM file

### Visual Workflow Design
1. **Switch between tabs** → Preprocessing and Postprocessing sections
2. **Add components**:
   - **Drag from palette** → Drag components to canvas and drop
   - **Right-click menu** → Context menu with categorized component insertion
   - **Click palette components** → Insert at default position
3. **Edit components** → Double-click to open property editor
4. **Create connections** → Shift+click to connect components
5. **Multi-select** → Ctrl+click for multiple component selection

## Keyboard Shortcuts

Access the full list of keyboard shortcuts by clicking the **ℹ️** icon next to the zoom controls.

**Essential shortcuts:**
- `Ctrl+A` - Select all components
- `Ctrl+Click` - Multi-select components  
- `Shift+Click` - Create primary connections
- `Esc` - Clear selection
- `Delete` - Delete selected components

## File Structure

VRM files contain three main sections:
- **HTML Content** - User interface with embedded JavaScript
- **Preprocessing** - Components that run before main logic
- **Postprocessing** - Components that run after main logic

## Technical Details

- **Language**: TypeScript with full type safety
- **Architecture**: Modular manager classes for different functionality
- **UI Framework**: SVG-based visual components with VSCode theme integration
- **File Management**: Automatic temporary file cleanup and gitignore integration

## Settings

```json
{
  "vrmEditor.autoSave": false,
  "vrmEditor.autoSaveDelay": 500
}
```

## Development

The extension uses a modular architecture with separate managers for:
- **State Management** - Global state and component tracking
- **Rendering** - SVG-based visual component rendering  
- **Drag & Drop** - Component movement and positioning
- **Selection** - Multi-component selection and box selection
- **Component Editing** - Property dialogs and parameter management
- **Connections** - Visual connection creation and management

## Requirements

- Visual Studio Code 1.60.0 or higher
- No additional dependencies required

## License

[Your License Here]

---

**Note**: VRM files are automatically associated with this extension. Right-click any `.vrm` file and select "Open VRM Editor" to get started.