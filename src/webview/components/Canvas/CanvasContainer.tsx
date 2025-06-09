import React from 'react';
import { WorkflowCanvas } from './WorkflowCanvas';
import { useEditorStore } from '../../stores/editorStore';
import { useDocumentStore } from '../../stores/documentStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { SectionType } from '../../types/vrm';

interface CanvasContainerProps {
  className?: string;
}

export const CanvasContainer: React.FC<CanvasContainerProps> = ({ 
  className = '' 
}) => {
  const { activeSection, setActiveSection, mode } = useEditorStore();
  const { document, isLoading } = useDocumentStore();
  const { selectedComponents, clearSelection } = useSelectionStore();

  const handleSectionChange = (section: SectionType) => {
    clearSelection(); // Clear selection when switching sections
    setActiveSection(section);
  };

  // Don't render canvas in non-visual modes
  if (mode !== 'visual') {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold text-vscode-foreground">
            {mode === 'html' ? 'HTML Editor' : 'JavaScript Editor'}
          </h3>
          <p className="text-vscode-secondary">
            Switch to Visual mode to see the workflow canvas
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-2 border-vscode-button-bg border-t-transparent rounded-full mx-auto"></div>
          <p className="text-vscode-secondary">Loading workflow...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold text-vscode-foreground">No Document Loaded</h3>
          <p className="text-vscode-secondary">Open a VRM file to see the workflow</p>
        </div>
      </div>
    );
  }

  const preprocCount = document.preproc.length;
  const postprocCount = document.postproc.length;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Section Tabs */}
      <div className="flex-shrink-0 flex items-center justify-between bg-vscode-editor-bg border-b border-vscode-border px-4 py-2">
        <div className="flex space-x-1">
          <button
            onClick={() => handleSectionChange('preproc')}
            className={`
              px-4 py-2 text-sm rounded transition-all duration-200 relative
              ${activeSection === 'preproc'
                ? 'text-vscode-foreground font-semibold bg-vscode-button-bg shadow-sm border-b-2 border-vscode-button-activeBorder'
                : 'text-vscode-secondary font-medium hover:text-vscode-foreground hover:bg-vscode-list-hover/50 active:bg-vscode-list-hover/70'
              }
            `}
          >
            <span className="relative">
              Preprocessing ({preprocCount})
              {activeSection === 'preproc' && (
                <span className="absolute -bottom-5 left-0 right-0 h-0.5 bg-vscode-button-activeBorder" />
              )}
            </span>
          </button>
          <button
            onClick={() => handleSectionChange('postproc')}
            className={`
              px-4 py-2 text-sm rounded transition-all duration-200 relative
              ${activeSection === 'postproc'
                ? 'text-vscode-foreground font-semibold bg-vscode-button-bg shadow-sm border-b-2 border-vscode-button-activeBorder'
                : 'text-vscode-secondary font-medium hover:text-vscode-foreground hover:bg-vscode-list-hover/50 active:bg-vscode-list-hover/70'
              }
            `}
          >
            <span className="relative">
              Postprocessing ({postprocCount})
              {activeSection === 'postproc' && (
                <span className="absolute -bottom-5 left-0 right-0 h-0.5 bg-vscode-button-activeBorder" />
              )}
            </span>
          </button>
        </div>

        {/* Selection Info */}
        {selectedComponents.length > 0 && (
          <div className="flex items-center space-x-4 text-sm text-vscode-secondary">
            <span>
              {selectedComponents.length} component{selectedComponents.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={clearSelection}
              className="text-vscode-foreground hover:text-vscode-button-foreground"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Canvas Area */}
      <div 
        className="flex-1 relative" 
        style={{ 
          minHeight: '500px', 
          overflow: 'visible',
          height: 'calc(100vh - 200px)' /* Account for header/footer */
        }}
      >

        {/* Workflow Canvas */}
        <WorkflowCanvas 
          section={activeSection}
          className="w-full h-full"
        />
      </div>

      {/* Status Bar */}
      <div className="flex-shrink-0 bg-vscode-statusBar-background border-t border-vscode-border px-4 py-1">
        <div className="flex items-center justify-between text-xs text-vscode-statusBar-foreground">
          <div className="flex items-center space-x-4">
            <span>Visual Mode</span>
            <span>Section: {activeSection}</span>
            {selectedComponents.length > 0 && (
              <span>Selected: {selectedComponents.join(', ')}</span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <span>Components: {activeSection === 'preproc' ? preprocCount : postprocCount}</span>
            <span>Grid: 32x26</span>
          </div>
        </div>
      </div>
    </div>
  );
};