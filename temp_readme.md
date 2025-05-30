# Enhanced Component Editor Modal

## Project Goal

The goal is to enhance the VRM Editor's component editing experience by replacing basic HTML textareas with a professional, feature-rich code editor that provides a VS Code-like editing experience directly within the modal dialogs.

## Problem Statement

### Current Limitations
- **Basic Textarea Input**: SQL queries and script code are edited in plain HTML textareas
- **No Syntax Highlighting**: Users cannot easily identify SQL keywords, syntax errors, or code structure
- **Poor Code Formatting**: No automatic indentation, bracket matching, or code folding
- **Limited Editing Features**: No IntelliSense, auto-completion, or code validation
- **Suboptimal User Experience**: Developers expect modern code editing capabilities

### Target Components
This enhancement specifically targets components that contain code:
- **SQL Query Components**: `INSERTUPDATEQUERY`, `SELECTQUERY`
- **Script Components**: `SCRIPT` (Pascal language)
- **Future Expansion**: Potentially other code-containing components

## Solution Architecture

### Monaco Editor Integration
**Monaco Editor** is the same code editor that powers Visual Studio Code, providing:

#### Core Features
- **Syntax Highlighting**: Full language support for SQL, Pascal, and more
- **IntelliSense**: Smart auto-completion and suggestions
- **Error Detection**: Real-time syntax error highlighting
- **Code Formatting**: Automatic indentation and code beautification
- **Line Numbers**: Professional line numbering with proper spacing
- **Minimap**: Code overview for large files (disabled for space optimization)
- **Bracket Matching**: Automatic bracket/parenthesis matching
- **Find & Replace**: Advanced search capabilities with regex support

#### Theme Integration
- **VS Code Theme Compatibility**: Automatically detects and matches VS Code's current theme
- **Dark/Light Mode Support**: Seamless integration with user's preferred color scheme
- **Custom CSS Variables**: Uses VS Code's CSS custom properties for consistent styling

### Dual Editor Approach

#### 1. In-Modal Monaco Editor
- **Primary Interface**: Embedded Monaco editor within the component edit modal
- **Immediate Editing**: Users can edit code directly in the modal
- **Real-time Sync**: Changes are automatically saved to hidden form inputs
- **Compact Experience**: Optimized for modal dialog space constraints

#### 2. External VS Code Editor
- **"Edit in VS Code" Button**: Opens code in a separate VS Code tab for advanced editing
- **Full IDE Experience**: Access to complete VS Code features, extensions, and tools
- **Auto-sync Capabilities**: Changes can be automatically synced back to the VRM component
- **Large Code Support**: Better for editing complex queries or scripts

### Technical Implementation

#### Monaco Editor Setup
```typescript
// CDN-based loading for reliability
const monacoEditor = monaco.editor.create(container, {
    value: sqlQuery,
    language: 'sql',
    theme: 'vs-dark', // Auto-detected based on VS Code theme
    minimap: { enabled: false },
    lineNumbers: 'on',
    automaticLayout: true,
    wordWrap: 'on'
});
```

#### Fallback Strategy
- **Graceful Degradation**: If Monaco fails to load, falls back to enhanced textarea
- **Error Handling**: Comprehensive error catching and user feedback
- **Progressive Enhancement**: Basic functionality works without Monaco

#### File Management
- **Temporary Files**: External editor creates temp files with metadata headers
- **Auto-cleanup**: Temp files are automatically removed when VRM editor closes
- **Git Integration**: Temp directories are automatically added to .gitignore

## User Experience Goals

### Improved Developer Productivity
1. **Familiar Interface**: Developers get the same editing experience they're used to in VS Code
2. **Faster Code Writing**: IntelliSense and auto-completion speed up development
3. **Error Prevention**: Syntax highlighting catches errors before saving
4. **Better Code Quality**: Proper formatting and validation improve maintainability

### Seamless Integration
1. **No Learning Curve**: Existing VRM editor workflow remains unchanged
2. **Optional Enhancement**: Users can still use basic editing if preferred
3. **Consistent Theming**: Matches VS Code's appearance automatically
4. **Cross-platform**: Works in any VS Code environment (Windows, Mac, Linux)

### Professional Experience
1. **Industry Standards**: Provides editing capabilities expected in modern development tools
2. **Scalability**: Handles both simple queries and complex scripts effectively
3. **Accessibility**: Proper keyboard navigation and screen reader support
4. **Performance**: Fast loading and responsive editing experience