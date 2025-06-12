import React, { useState } from 'react';
import { SectionType } from '../../types/vrm';
import { useDocumentStore } from '../../stores/documentStore';
import { useEditorStore } from '../../stores/editorStore';
import { useSelectedCount } from '../../stores/selectionStore';
import { DragDropLayout } from '../Canvas/DndProvider';
import { WorkflowCanvas } from '../Canvas/WorkflowCanvas';

interface EditorLayoutProps {
  children?: React.ReactNode;
}

const EditorLayout: React.FC<EditorLayoutProps> = ({ children }) => {
  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);
  const { document, isLoading, isDirty } = useDocumentStore();
  const { activeSection, setActiveSection } = useEditorStore();
  const selectedCount = useSelectedCount();

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
      <div className="bg-vscode-tab-inactiveBackground border-b border-vscode-border">
        <div className="flex">
          {/* Preprocessing Tab */}
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

          {/* Postprocessing Tab */}
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

          {/* Tab Indicator */}
          <div className="flex-1 bg-vscode-tab-inactiveBackground"></div>
        </div>
      </div>

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
          {/* Component palette status */}
          <span className="text-vscode-statusBar-foreground">
            Palette: {isPaletteCollapsed ? 'Hidden' : 'Visible'}
          </span>
          
          {/* Phase indicator */}
          <span className="text-vscode-statusBar-foreground">
            Phase 4: Component Interactions
          </span>
        </div>
      </footer>
    </div>
  );
};

export default EditorLayout;