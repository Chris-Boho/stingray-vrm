src/webview/components/Canvas/ComponentSearch.tsx (new)
## Plan: Add Search/Find Feature for Components

### 1. Create a Search UI Component
- Create a new React component, e.g., `ComponentSearch.tsx`.
- This component will render:
  - A search input
  - Match count
  - (Optionally) next/prev navigation and a clear button
- It will manage its own open/close state and input value.

### 2. Integrate Search UI into the Editor
- Render the search component in `WorkflowCanvas.tsx` or in a higher-level layout (e.g., `EditorLayout.tsx`).
- Add a "Find" button to the toolbar or canvas area to open the search UI.

### 3. Add Keyboard Shortcut
- Extend the keyboard handler in `WorkflowCanvas.tsx` to listen for `Ctrl+F` (or `Cmd+F` on Mac).
- When triggered, open and focus the search input.

### 4. Implement Search Logic
- When the user enters a query, search both `document.preproc` and `document.postproc` for components where the query matches:
  - The comment (`c`)
  - Any relevant fields in `values`
- Collect matching component IDs.

### 5. Highlight Matches
- Add a highlight state to visually indicate matches on the canvas.
- Optionally, allow navigation between matches (next/prev).

### 6. User Experience Details
- Show the number of matches.
- Allow clearing the search (Esc key or clear button).
- Optionally, scroll to the first match.

---

### Files to Create/Modify

- `src/webview/components/Canvas/ComponentSearch.tsx` (new)
- `WorkflowCanvas.tsx` (integrate search, keyboard shortcut)
- `EditorLayout.tsx` (optional, for toolbar button)
- `selectionStore.ts` (use for selecting matches)

---

### General Flow

1. User clicks "Find" or presses `Ctrl+F`.
2. Search input appears and is focused.
3. User types a query and presses Enter.
4. Matching components are highlighted/selected.
5. User can clear the search or navigate between matches.
