# VRM Editor - Modern React-based VS Code Extension

## Project Overview

VRM Editor is a Visual Studio Code extension that provides a comprehensive editing environment for VRM (Visual Resource Model) files. VRM files are XML-based configuration files used for defining business logic workflows with visual components, HTML content, and embedded JavaScript.

The extension offers:
- **Visual Workflow Designer**: A modern React-based drag-and-drop interface for designing preprocessing and postprocessing workflows
- **Code Editors**: Integrated Monaco editors for HTML and JavaScript content
- **Component System**: 11 specialized component types for database operations, scripting, control flow, data manipulation, and integrations
- **Real-time Synchronization**: Seamless sync between visual and code representations

## Purpose

The VRM Editor aims to modernize the development experience for VRM files by:
1. **Separating Concerns**: Isolating HTML, JavaScript, and workflow logic into specialized editors
2. **Visual Programming**: Providing an intuitive drag-and-drop interface for workflow design
3. **Type Safety**: Leveraging TypeScript for robust development
4. **Modern Architecture**: Using React, Tailwind CSS, and Zustand for maintainable, scalable code
5. **Enhanced Productivity**: Offering features like component templates, keyboard shortcuts, and smart connections

## Technology Stack

- **TypeScript**: Type-safe development across the entire codebase
- **React**: Component-based UI architecture
- **Tailwind CSS**: Utility-first styling system
- **Vite**: Fast development and optimized production builds
- **Zustand**: Lightweight state management
- **React Flow**: Visual workflow canvas with built-in drag-drop and zoom/pan
- **Monaco Editor**: VS Code's editor for code editing
- **React DnD / dnd-kit**: Drag-and-drop for component palette
- **Radix UI**: Accessible UI primitives
- **React Hook Form**: Form management for component properties
- **Immer**: Immutable state updates

## Project Structure

```
vrm-editor/
├── src/
│   ├── extension/                 # VS Code extension host
│   │   ├── VrmEditorProvider.ts  # Custom editor provider
│   │   ├── extension.ts          # Extension entry point
│   │   └── messaging.ts          # WebView communication
│   │
│   ├── webview/                  # React application
│   │   ├── main.tsx             # React app entry
│   │   ├── App.tsx              # Main app component
│   │   │
│   │   ├── components/          # React components
│   │   │   ├── Editor/          # Main editor layout
│   │   │   ├── Canvas/          # Workflow canvas
│   │   │   ├── Components/      # VRM components
│   │   │   ├── Connections/     # Connection system
│   │   │   ├── CodeEditor/      # Monaco editors
│   │   │   └── UI/              # Reusable UI
│   │   │
│   │   ├── stores/              # Zustand stores
│   │   │   ├── documentStore.ts
│   │   │   ├── editorStore.ts
│   │   │   ├── componentStore.ts
│   │   │   ├── selectionStore.ts
│   │   │   ├── connectionStore.ts
│   │   │   └── historyStore.ts
│   │   │
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # Business logic
│   │   ├── types/               # TypeScript definitions
│   │   └── utils/               # Utility functions
│   │
│   └── shared/                   # Shared code
│       ├── messages.ts          # Message types
│       └── constants.ts         # Shared constants
│
├── public/                       # Static assets
├── scripts/                      # Build scripts
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Tailwind configuration
├── tsconfig.json                # TypeScript config
└── package.json                 # Project dependencies
```

## VRM File Structure

VRM files contain three main sections in this specific order:
```xml
<vrm>
  <preproc>
    <!-- Preprocessing workflow components (executed first) -->
    <c>
      <n>0</n>                    <!-- Component ID -->
      <t>IF</t>                   <!-- Component type -->
      <values>...</values>        <!-- Component data -->
      <j>1</j>                    <!-- Primary connection -->
      <j>2</j>                    <!-- Secondary connection -->
      <x>32</x>                   <!-- X coordinate -->
      <y>26</y>                   <!-- Y coordinate -->
      <c>Verify user rights</c>   <!-- Component comment -->
      <wp>0</wp>                  <!-- Watchpoint flag -->
    </c>
  </preproc>
  
  <html><![CDATA[
    <!-- HTML content with embedded JavaScript (rendered after preprocessing) -->
  ]]></html>
  
  <postproc>
    <!-- Postprocessing workflow components (executed after HTML rendering) -->
  </postproc>
</vrm>
```

## Component Types

| Category | Component | Type | Description |
|----------|-----------|------|-------------|
| **Database** | SQL Transaction | `SQLTRN` | Begin/Commit/Rollback transactions |
| | Select Query | `SELECTQUERY` | Database record retrieval |
| | Insert/Update Query | `INSERTUPDATEQUERY` | Database record modification |
| **Script** | Script Function | `CSF` | Call script functions with parameters |
| | Script Block | `SCRIPT` | Execute custom Pascal scripts |
| **Control** | Condition | `IF` | Conditional branching logic |
| | Error | `ERROR` | Display errors and halt execution |
| **Data** | Multi-Set Variables | `SET` | Variable assignment operations |
| | Math Operation | `MATH` | Mathematical calculations |
| **Integration** | External Call | `EXTERNAL` | Call external rules/procedures |
| | Template | `TEMPLATE` | Process and generate templates |

## Implementation Roadmap

### Phase 1: Foundation Setup (Week 1)
**Goal**: Establish the development environment and basic extension structure

1. **Initialize Project**
   - Set up Vite with React and TypeScript
   - Configure Tailwind CSS
   - Set up VS Code extension boilerplate
   - Configure build pipeline for both extension and webview

2. **Basic Extension Structure**
   - Create `VrmEditorProvider` implementing `CustomTextEditorProvider`
   - Set up webview communication protocol
   - Implement basic file loading and saving
   - Create shared message types

3. **Core React App**
   - Set up React app entry point
   - Configure VS Code theme integration
   - Implement basic layout components
   - Set up Zustand stores structure

### Phase 2: State Management & Data Flow (Week 2)
**Goal**: Implement robust state management and data parsing

1. **Zustand Stores**
   - Implement `documentStore` for VRM content
   - Create `editorStore` for UI state
   - Set up `componentStore` for workflow components
   - Add `selectionStore` and `connectionStore`

2. **VRM Parser Service**
   - Port XML parsing logic to TypeScript
   - Implement component extraction
   - Create HTML/JS content separation
   - Add validation layer

3. **Data Flow Architecture**
   - Implement VS Code ↔ Webview messaging
   - Set up state synchronization
   - Add error handling and recovery
   - Create update debouncing

### Phase 3: Visual Workflow Canvas (Week 3-4)
**Goal**: Implement the core visual editing experience

1. **React Flow Integration**
   - Set up React Flow canvas
   - Create custom node components for each VRM component type
   - Implement custom edge renderer for connections
   - Add zoom/pan controls

2. **Component System**
   - Port component templates to React
   - Implement component rendering
   - Add visual styling with Tailwind
   - Create component property forms

3. **Grid System & Snapping**
   - Implement 32x26px grid
   - Add snap-to-grid functionality
   - Create visual grid background
   - Handle component positioning

### Phase 4: Component Interactions (Week 5)
**Goal**: Enable full interactivity for workflow design

1. **Component Palette**
   - Create draggable component palette
   - Implement React DnD for palette items
   - Add component categorization
   - Enable click-to-insert functionality

2. **Selection System**
   - Implement single/multi-selection
   - Add box selection
   - Create keyboard shortcuts (Ctrl+A, Esc)
   - Add visual selection feedback

3. **Connection Management**
   - Implement connection creation (Shift+click)
   - Add connection validation
   - Create connection routing algorithms
   - Enable connection deletion

### Phase 5: Component Editing (Week 6)
**Goal**: Complete component property editing

1. **Component Editor Modal**
   - Create modal system with Radix UI
   - Implement React Hook Form for properties
   - Add component-specific forms
   - Enable real-time preview

2. **Context Menus**
   - Implement right-click context menus
   - Add component operations
   - Create hierarchical insert menu
   - Add selection operations

3. **Keyboard Navigation**
   - Implement comprehensive shortcuts
   - Add keyboard accessibility
   - Create shortcut help dialog
   - Enable keyboard-only workflow

### Phase 6: Code Editors Integration (Week 7)
**Goal**: Add HTML and JavaScript editing capabilities

1. **Monaco Editor Setup**
   - Integrate Monaco React wrapper
   - Configure for HTML and JavaScript
   - Add VS Code theme support
   - Enable IntelliSense

2. **Editor Tabs**
   - Create tab system for different views
   - Implement view switching
   - Add file synchronization
   - Handle dirty state

3. **Content Synchronization**
   - Sync visual changes to code
   - Update visual from code edits
   - Handle merge conflicts
   - Add validation

### Phase 7: Save/Load & File Management (Week 8)
**Goal**: Complete file operations and persistence

1. **Save System**
   - Implement XML generation from state
   - Add auto-save functionality
   - Create backup system
   - Handle save conflicts

2. **Load System**
   - Optimize initial file parsing
   - Add progress indicators
   - Implement error recovery
   - Cache parsed data

3. **Temporary File Management**
   - Implement temp file creation/tracking system
   - Add file watchers for external editors
   - Create cleanup routines
   - Implement GitIgnore integration
   - Set up save synchronization

### Phase 8: Polish & Optimization (Week 9-10)
**Goal**: Finalize the extension for production use

1. **Performance Optimization**
   - Implement React.memo where needed
   - Add virtualization for large workflows
   - Optimize re-renders
   - Profile and fix bottlenecks

2. **User Experience**
   - Add loading states
   - Implement error boundaries
   - Create user notifications
   - Add tooltips and help

3. **Testing & Documentation**
   - Write unit tests
   - Add integration tests
   - Create user documentation
   - Record demo videos

4. **Final Features**
   - Undo/redo system
   - Export functionality
   - Print support
   - Accessibility audit

## Key Implementation Details

### File Management Architecture

The extension uses a sophisticated file management system to handle different editing contexts:

1. **Integrated Monaco Editors** (within component editor modals)
   - SQL queries for database components (`SELECTQUERY`, `INSERTUPDATEQUERY`)
   - Pascal scripts for script components (`SCRIPT`, `CSF`)
   - These are embedded directly in the component property editor

2. **External Temp File Editors**
   - HTML content: Opens as `filename.vrm.html` in a new VS Code tab
   - JavaScript content: Opens as `filename.vrm.js` in a new VS Code tab
   - Stored in `.vscode/vrm-editor/` directory
   - Full VS Code language features (IntelliSense, formatting, etc.)

3. **Save Management System**
   The `saveManager.ts` service coordinates all save operations:
   - **Component saves**: Updates from Monaco editors within components
   - **Temp file saves**: Syncs external HTML/JS files back to VRM
   - **Auto-save**: Configurable automatic saving
   - **Conflict resolution**: Handles concurrent edits
   - **Dirty state tracking**: Monitors unsaved changes

4. **File Sync Flow**
   ```
   External Editor Save (Ctrl+S)
     → fileSyncManager detects change
     → Parses updated content
     → Updates documentStore
     → saveManager generates new VRM XML
     → Writes to original VRM file
     → Updates dirty state
   ```

### Code Editing
- **Monaco editors** for SQL queries and Pascal scripts within components
- **External editors** for HTML and JavaScript in separate temp files
- **Temp file tracking** with automatic cleanup
- **Live synchronization** between temp files and VRM
- **Full VS Code language support** in external editors

### Component Management
- **Component templates** for quick insertion
- **Property editing** with dynamic forms
- **Context menus** for operations
- **Keyboard shortcuts** for efficiency
- **Connection management** with visual feedback

### State Management
- **Zustand stores** for predictable state
- **Undo/redo support** with history tracking
- **Auto-save functionality**
- **Dirty state tracking**
- **Real-time synchronization**

## Development Guidelines

### Code Style
- Use TypeScript strict mode
- Follow React best practices
- Use functional components with hooks
- Implement proper error boundaries
- Write self-documenting code

### Component Guidelines
- Keep components small and focused
- Use composition over inheritance
- Implement proper prop types
- Memoize expensive computations
- Handle loading and error states

### State Management
- Use Zustand for global state
- Keep local state in components when possible
- Use Immer for immutable updates
- Implement proper selectors
- Avoid unnecessary re-renders

### Performance
- Profile with React DevTools
- Implement code splitting
- Use React.memo strategically
- Optimize bundle size
- Lazy load heavy components

## Getting Started

```bash
# Clone the repository
git clone [repository-url]
cd vrm-editor

# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Package extension
npm run package
```

## Configuration

### Extension Settings
```json
{
  "vrmEditor.autoSave": false,
  "vrmEditor.autoSaveDelay": 500,
  "vrmEditor.gridSize": {
    "x": 32,
    "y": 26
  }
}
```

### VS Code Integration
- File association: `.vrm` files
- Custom editor registration
- Context menu: "Open with VRM Editor"
- Command palette integration

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Select All | `Ctrl+A` |
| Clear Selection | `Esc` |
| Delete Components | `Delete` |
| Undo | `Ctrl+Z` |
| Redo | `Ctrl+Y` |
| Save | `Ctrl+S` |
| Zoom In | `Ctrl+=` |
| Zoom Out | `Ctrl+-` |
| Reset Zoom | `Ctrl+0` |
| Multi-select | `Ctrl+Click` |
| Box Selection | `Click+Drag` |
| Create Connection | `Shift+Click` |

## Future Enhancements

- **AI Integration**: Smart component suggestions and auto-completion
- **Collaboration**: Real-time multi-user editing support
- **Templates Library**: Pre-built workflow templates
- **Visual Debugging**: Step-through workflow execution
- **Version Control**: Visual diff/merge for workflows
- **Export Options**: Generate standalone applications
- **Mobile Support**: Responsive design for tablets
- **Theme System**: Custom color schemes
- **Plugin Architecture**: Extensibility for custom components

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## License

[Your License Here]

## Support

- **Documentation**: [Link to docs]
- **Issues**: [GitHub Issues]
- **Discussions**: [GitHub Discussions]
- **Email**: support@example.com

---

Built with ❤️ using React, TypeScript, and VS Code Extension API