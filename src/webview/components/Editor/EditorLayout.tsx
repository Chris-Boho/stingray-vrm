import React, { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { SectionType } from '../../types/vrm';
import { useDocumentStore } from '../../stores/documentStore';
import { useEditorStore } from '../../stores/editorStore';
import { useSelectedCount } from '../../stores/selectionStore';
import { useClipboardOperations, useHasClipboardData, useClipboardInfo } from '../../stores/clipboardStore';
import { DragDropLayout } from '../Canvas/DndProvider';
import { WorkflowCanvas } from '../Canvas/WorkflowCanvas';

interface EditorLayoutProps {
  children?: React.ReactNode;
}

const EditorLayoutContent: React.FC<EditorLayoutProps> = ({ children }) => {
  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);
  const { document, isLoading, isDirty } = useDocumentStore();
  const { activeSection, setActiveSection } = useEditorStore();
  const selectedCount = useSelectedCount();
  const { copySelected, pasteAtCenter, canPaste } = useClipboardOperations();
  const hasClipboardData = useHasClipboardData();
  const clipboardInfo = useClipboardInfo();

  // Get component counts for each section
  const preprocCount = document?.preproc?.length || 0;
  const postprocCount = document?.postproc?.length || 0;

  const handleSectionChange = (section: SectionType) => {
    setActiveSection(section);
  };

  const handleTogglePalette = () => {
    setIsPaletteCollapsed(!isPaletteCollapsed);
  };

  // Save functionality (placeholder - you can implement this later)
  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Save requested');
  };

  // Clipboard action handlers
  const handleCopy = () => {
    if (selectedCount > 0) {
      copySelected();
      console.log(`📋 Copied ${selectedCount} components from toolbar`);
    }
  };

  const handlePaste = () => {
    if (canPaste) {
      pasteAtCenter();
      console.log('📋 Pasted components from toolbar');
    }
  };

  const getSectionDisplayName = (section: SectionType) => {
    switch (section) {
      case 'preproc': return 'Preprocessing';
      case 'postproc': return 'Postprocessing';
      default: return section;
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-vscode-editor-background text-vscode-foreground">
      {/* Header/Toolbar */}
      <header className="h-10 bg-vscode-sideBar-background border-b border-vscode-border flex items-center px-4">
        <div className="flex items-center space-x-4 flex-1">
          <h1 className="text-sm font-medium">VRM Editor</h1>
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 border border-vscode-progressBar-background border-t-vscode-button-foreground rounded-full animate-spin"></div>
              <span className="text-xs text-vscode-secondary">Loading...</span>
            </div>
          )}
          
          {/* Document status */}
          {document && (
            <div className="flex items-center space-x-2 text-xs text-vscode-secondary">
              <span>{document.function?.fn || 'Untitled'}</span>
              {isDirty && (
                <span className="text-vscode-gitDecoration-modifiedResourceForeground">●</span>
              )}
            </div>
          )}
        </div>

        {/* Toolbar Actions */}
        <div className="flex items-center space-x-2">
          {/* Clipboard Actions */}
          {/* <div className="flex items-center space-x-1 mr-2">
            <button
              onClick={handleCopy}
              disabled={selectedCount === 0}
              className="px-2 py-1 text-xs bg-vscode-button-background border border-vscode-button-border 
                         text-vscode-button-foreground rounded hover:bg-vscode-button-hoverBackground
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
              title={`Copy selected components (${selectedCount}) - Ctrl+C`}
            >
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span>Copy</span>
                {selectedCount > 0 && (
                  <span className="text-xs bg-vscode-badge-background text-vscode-badge-foreground px-1 rounded">
                    {selectedCount}
                  </span>
                )}
              </div>
            </button>

            <button
              onClick={handlePaste}
              disabled={!canPaste}
              className="px-2 py-1 text-xs bg-vscode-button-background border border-vscode-button-border 
                         text-vscode-button-foreground rounded hover:bg-vscode-button-hoverBackground
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
              title={hasClipboardData ? `Paste ${clipboardInfo} - Ctrl+V` : 'No components to paste'}
            >
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Paste</span>
                {hasClipboardData && (
                  <svg className="w-2 h-2 text-blue-400" fill="currentColor" viewBox="0 0 8 8">
                    <circle cx="4" cy="4" r="3"/>
                  </svg>
                )}
              </div>
            </button>
          </div> */}

          {/* Divider */}
          <div className="h-6 w-px bg-vscode-border"></div>

          {/* Palette Toggle */}
          <button
            onClick={handleTogglePalette}
            className="px-2 py-1 text-xs bg-vscode-button-background border border-vscode-button-border 
                       text-vscode-button-foreground rounded hover:bg-vscode-button-hoverBackground
                       transition-colors duration-150"
            title={isPaletteCollapsed ? 'Show Component Palette' : 'Hide Component Palette'}
          >
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd"/>
              </svg>
              <span>{isPaletteCollapsed ? 'Show' : 'Hide'}</span>
            </div>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!isDirty}
            className="px-3 py-1 text-xs bg-vscode-button-background border border-vscode-button-border 
                       text-vscode-button-foreground rounded hover:bg-vscode-button-hoverBackground
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            title="Save VRM File (Ctrl+S)"
          >
            Save
          </button>
        </div>
      </header>

      {/* Section Tabs */}
      {/* <div className="bg-vscode-tab-inactiveBackground border-b border-vscode-border">
        <div className="flex">
          <button
            onClick={() => handleSectionChange('preproc')}
            className={`px-4 py-2 text-sm border-r border-vscode-border transition-all duration-150 ${
              activeSection === 'preproc'
                ? 'bg-vscode-tab-activeBackground text-vscode-tab-activeForeground border-b-2 border-vscode-tab-activeBorder'
                : 'bg-vscode-tab-inactiveBackground text-vscode-tab-inactiveForeground hover:bg-vscode-tab-hoverBackground'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span>Preprocessing</span>
              <span className="px-2 py-0.5 text-xs bg-vscode-badge-background text-vscode-badge-foreground rounded">
                {preprocCount}
              </span>
            </div>
          </button>

          <button
            onClick={() => handleSectionChange('postproc')}
            className={`px-4 py-2 text-sm border-r border-vscode-border transition-all duration-150 ${
              activeSection === 'postproc'
                ? 'bg-vscode-tab-activeBackground text-vscode-tab-activeForeground border-b-2 border-vscode-tab-activeBorder'
                : 'bg-vscode-tab-inactiveBackground text-vscode-tab-inactiveForeground hover:bg-vscode-tab-hoverBackground'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span>Postprocessing</span>
              <span className="px-2 py-0.5 text-xs bg-vscode-badge-background text-vscode-badge-foreground rounded">
                {postprocCount}
              </span>
            </div>
          </button>
          <div className="flex-1 bg-vscode-tab-inactiveBackground"></div>
        </div>
      </div> */}

      {/* Main content area with DnD integration */}
      <main className="flex-1 flex overflow-hidden">
        {document ? (
          <DragDropLayout 
            section={activeSection}
            isPaletteCollapsed={isPaletteCollapsed}
            onTogglePalette={handleTogglePalette}
          >
            <WorkflowCanvas 
              section={activeSection}
              className="flex-1"
            />
          </DragDropLayout>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-lg text-vscode-foreground">No VRM File Loaded</div>
              <div className="text-sm text-vscode-secondary max-w-md">
                Open a .vrm file to start editing your workflow. You can create visual workflows 
                by dragging components from the palette onto the canvas.
              </div>
              <div className="flex items-center justify-center space-x-4 text-xs text-vscode-secondary">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Database Components</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Script Components</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span>Control Flow</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Render any additional children if provided */}
        {children}
      </main>

      {/* Status bar */}
      <footer className="h-6 bg-vscode-statusBar-background border-t border-vscode-border flex items-center px-4 text-xs">
        <div className="flex items-center space-x-4">
          {/* Ready state */}
          <span className="text-vscode-statusBar-foreground">
            {isLoading ? 'Loading...' : 'Ready'}
          </span>
          
          <span className="text-vscode-statusBar-foreground opacity-50">•</span>
          
          {/* Current section */}
          {document && (
            <>
              <span className="text-vscode-statusBar-foreground">
                {getSectionDisplayName(activeSection)}
              </span>
              
              <span className="text-vscode-statusBar-foreground opacity-50">•</span>
            </>
          )}
          
          {/* Grid info */}
          <span className="text-vscode-statusBar-foreground">Grid: 32x26</span>
          
          {/* Selection info */}
          {selectedCount > 0 && (
            <>
              <span className="text-vscode-statusBar-foreground opacity-50">•</span>
              <span className="text-vscode-statusBar-foreground">
                {selectedCount} selected
              </span>
            </>
          )}

          {/* Clipboard info */}
          {hasClipboardData && (
            <>
              <span className="text-vscode-statusBar-foreground opacity-50">•</span>
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z"/>
                  <path d="M3 5a2 2 0 012-2 3 3 0 003 3h4a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2-2H5a2 2 0 01-2-2V5z"/>
                </svg>
                <span className="text-blue-400">
                  {clipboardInfo}
                </span>
              </div>
            </>
          )}
          
          {/* File status */}
          {document && isDirty && (
            <>
              <span className="text-vscode-statusBar-foreground opacity-50">•</span>
              <span className="text-vscode-gitDecoration-modifiedResourceForeground">
                Unsaved changes
              </span>
            </>
          )}
        </div>

        {/* Right side status items */}
        <div className="ml-auto flex items-center space-x-4">
          {/* Clipboard shortcuts hint */}
          {(selectedCount > 0 || hasClipboardData) && (
            <span className="text-vscode-statusBar-foreground text-xs opacity-75">
              {selectedCount > 0 && hasClipboardData && 'Ctrl+C: Copy • Ctrl+V: Paste'}
              {selectedCount > 0 && !hasClipboardData && 'Ctrl+C: Copy • Ctrl+A: Select All'}
              {selectedCount === 0 && hasClipboardData && 'Ctrl+V: Paste • Right-click: Context menu'}
            </span>
          )}

          {/* Component palette status */}
          <span className="text-vscode-statusBar-foreground">
            Palette: {isPaletteCollapsed ? 'Hidden' : 'Visible'}
          </span>
          
          {/* Phase indicator */}
          <span className="text-vscode-statusBar-foreground">
            Phase 4: Copy & Paste ✨
          </span>
        </div>
      </footer>
    </div>
  );
};

// Wrap the entire editor layout with ReactFlowProvider
const EditorLayout: React.FC<EditorLayoutProps> = (props) => {
  return (
    <ReactFlowProvider>
      <EditorLayoutContent {...props} />
    </ReactFlowProvider>
  );
};

export default EditorLayout;