# VRM Editor Architecture and Data Flow

## Overview

The VRM Editor uses a centralized state management architecture with `DocumentState` as the single source of truth. This document outlines the key components, their responsibilities, and how they interact.

## Core Components

### 1. DocumentState (Single Source of Truth)
- **Location**: `src/visual-editor/modules/DocumentState.ts`
- **Purpose**: Central state management for all document data
- **Responsibilities**:
  - Maintains component state (pre-processing and post-processing)
  - Tracks dirty state for components, HTML, and JS content
  - Provides methods for component CRUD operations
  - Emits events for state changes
- **Key Methods**:
  - `updateComponent(component: VrmComponent)`
  - `addComponent(component: VrmComponent)`
  - `deleteComponent(component: VrmComponent)`
  - `updateHtmlContent(content: string)`
  - `updateJsContent(content: string)`
  - `getDirtyComponents(): VrmComponent[]`
  - `clearDirtyState()`
  - `hasDirtyState(): boolean`

### 2. SaveManager
- **Location**: `src/visual-editor/modules/SaveManager.ts`
- **Purpose**: Handles persistence of document changes
- **Responsibilities**:
  - Coordinates saving of component changes
  - Manages document workspace edits
  - Notifies webview of changes
- **Key Methods**:
  - `updateComponent(document, component, webviewPanel)`
  - `updateMultipleComponents(document, components, webviewPanel)`
  - `addComponent(document, component, webviewPanel)`
  - `deleteComponent(document, component, webviewPanel)`
  - `updateHtmlContent(document, content)`
  - `updateJsContent(document, content)`
  - `hasUnsavedChanges(): boolean`

### 3. StateManager
- **Location**: `src/visual-editor/modules/StateManager.ts`
- **Purpose**: Manages UI-specific state
- **Responsibilities**:
  - Handles UI state (zoom, selection, drag-and-drop)
  - Delegates component state to DocumentState
- **Key States**:
  - Selection state
  - Drag-and-drop state
  - Zoom level
  - UI preferences

### 4. SelectionManager
- **Location**: `src/visual-editor/modules/SelectionManager.ts`
- **Purpose**: Manages component selection
- **Responsibilities**:
  - Handles component selection/deselection
  - Manages multi-select operations
  - Updates selection UI
- **Key Methods**:
  - `selectComponent(componentId: string)`
  - `deselectComponent(componentId: string)`
  - `selectAllComponents()`
  - `clearSelection()`

### 5. RenderingManager
- **Location**: `src/visual-editor/modules/RenderingManager.ts`
- **Purpose**: Handles component rendering
- **Responsibilities**:
  - Renders components in the webview
  - Updates component visuals
  - Manages component layout
- **Key Methods**:
  - `renderComponent(component: VrmComponent)`
  - `updateComponentVisuals(component: VrmComponent)`
  - `reflowComponents()`

## Data Flow

### Component Updates
1. User makes a change to a component
2. Change is sent to `DocumentState` via appropriate manager
3. `DocumentState` updates the component and marks it as dirty
4. `SaveManager` is notified of the change
5. `SaveManager` persists the change to the document
6. Webview is notified of the update
7. `RenderingManager` updates the visual representation

### Component Selection
1. User selects a component
2. `SelectionManager` updates selection state
3. `StateManager` tracks UI selection state
4. `RenderingManager` updates visual selection indicators
5. Selection details are updated in the UI

### Document Saving
1. Changes are tracked in `DocumentState`
2. `SaveManager` checks for dirty state
3. If dirty:
   - Components are updated in XML
   - HTML/JS content is updated if needed
   - Changes are persisted to the document
   - Dirty state is cleared
4. Webview is notified of successful save

## Best Practices

### Component Management
- Always use `DocumentState` for component operations
- Never modify component state directly
- Use appropriate manager methods for specific operations
- Keep UI state separate from component state

### State Management
- Use `DocumentState` as the single source of truth
- Keep UI state in `StateManager`
- Use events for state change notifications
- Clear dirty state after successful saves

### Error Handling
- Always wrap operations in try-catch blocks
- Log errors with appropriate context
- Notify user of critical errors
- Maintain consistent error handling patterns

### Performance
- Batch component updates when possible
- Minimize unnecessary re-renders
- Use efficient selection algorithms
- Cache component data when appropriate

## Event Flow

### Component Events
```
User Action → Manager → DocumentState → SaveManager → Webview → RenderingManager
```

### Selection Events
```
User Action → SelectionManager → StateManager → RenderingManager → UI Update
```

### Save Events
```
DocumentState (dirty) → SaveManager → Document Update → Clear Dirty State → Webview Update
```

## Implementation Guidelines

1. **New Features**:
   - Start by updating `DocumentState` if new state is needed
   - Add appropriate manager methods
   - Implement UI updates through `RenderingManager`
   - Update webview communication as needed

2. **Bug Fixes**:
   - Identify the source of truth (`DocumentState` or UI state)
   - Update appropriate manager
   - Ensure proper event flow
   - Test state persistence

3. **UI Updates**:
   - Keep UI state in `StateManager`
   - Use `RenderingManager` for visual updates
   - Maintain separation of concerns
   - Follow existing patterns for consistency

## Common Patterns

### Adding a New Component
```typescript
// 1. Create component
const component = new VrmComponent(...);

// 2. Add to DocumentState
documentState.addComponent(component);

// 3. Save changes
await saveManager.addComponent(document, component, webviewPanel);

// 4. Update UI
renderingManager.renderComponent(component);
```

### Updating a Component
```typescript
// 1. Update in DocumentState
documentState.updateComponent(component);

// 2. Save changes
await saveManager.updateComponent(document, component, webviewPanel);

// 3. Update UI
renderingManager.updateComponentVisuals(component);
```

### Handling Selection
```typescript
// 1. Update selection state
selectionManager.selectComponent(componentId);

// 2. Update UI state
stateManager.updateSelectionState(...);

// 3. Update visuals
renderingManager.updateSelectionIndicators();
``` 