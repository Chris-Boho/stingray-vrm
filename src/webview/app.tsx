import React, { useEffect, useState } from 'react';
import EditorLayout from './components/Editor/EditorLayout';
import { vscodeService } from './services/vscodeService';
import { useDocumentStore } from './stores/documentStore';
import { useEditorStore } from './stores/editorStore';
import type { ExtensionMessage } from '../shared/messages';

export const App: React.FC = () => {
  const [isReady, setIsReady] = useState<boolean>(false);
  
  // Store hooks
  const { 
    document, 
    fileState, 
    isLoading, 
    isDirty, 
    errors,
    loadDocument, 
    saveDocument, 
    reset 
  } = useDocumentStore();
  
  const { 
    mode, 
    activeSection, 
    setTheme, 
    setLoading 
  } = useEditorStore();

  useEffect(() => {
    // Set up message handlers
    vscodeService.onMessage('update', async (message: ExtensionMessage) => {
      if (message.type === 'update') {
        setLoading(true);
        try {
          await loadDocument(message.content, message.uri);
          vscodeService.sendLog('info', 'VRM content loaded', { 
            uri: message.uri,
            mode 
          });
        } catch (error) {
          vscodeService.sendError('Failed to load VRM content', error instanceof Error ? error.stack : undefined);
        } finally {
          setLoading(false);
        }
      }
    });

    vscodeService.onMessage('theme-changed', (message: ExtensionMessage) => {
      if (message.type === 'theme-changed') {
        setTheme(message.theme);
        vscodeService.sendLog('info', 'Theme changed', { theme: message.theme });
      }
    });

    vscodeService.onMessage('settings-changed', (message: ExtensionMessage) => {
      if (message.type === 'settings-changed') {
        // Handle settings updates here
        vscodeService.sendLog('info', 'Settings updated', { settings: message.settings });
      }
    });

    // Mark service as ready to process queued messages
    vscodeService.markReady();
    
    console.log('Calling markReady...');
    vscodeService.markReady();
    
    console.log('Sending ready message...');
    vscodeService.sendReady();
    setIsReady(true);
    console.log('App setup complete');

    // Cleanup
    return () => {
      vscodeService.offMessage('update');
      vscodeService.offMessage('theme-changed');
      vscodeService.offMessage('settings-changed');
      reset();
    };
  }, [loadDocument, setTheme, setLoading, reset, mode]);

  const handleSave = async () => {
    if (document && isDirty) {
      try {
        await saveDocument();
        vscodeService.sendLog('info', 'Document saved successfully');
      } catch (error) {
        vscodeService.sendError('Failed to save document', error instanceof Error ? error.stack : undefined);
      }
    }
  };

  const handleTestSave = () => {
    if (document) {
      // For testing - just send current content
      vscodeService.sendSave(JSON.stringify(document, null, 2));
      vscodeService.sendLog('info', 'Test save completed');
    }
  };

  // Show loading state while document is being parsed
  if (isLoading && !document) {
    return (
      <EditorLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin w-8 h-8 border-2 border-vscode-button-bg border-t-transparent rounded-full mx-auto"></div>
            <p className="text-vscode-secondary">Loading VRM document...</p>
          </div>
        </div>
      </EditorLayout>
    );
  }

  // Show document loaded state
  if (document) {
    return (
      <EditorLayout>
        <div className="flex-1 flex flex-col p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-vscode-foreground mb-2">
              VRM Editor - {fileState?.fileName || 'Unknown File'}
            </h1>
            
            <div className="flex items-center space-x-4 text-sm text-vscode-secondary">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isReady ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span>{isReady ? 'Connected to VS Code' : 'Connecting...'}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isDirty ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                <span>{isDirty ? 'Unsaved changes' : 'Saved'}</span>
              </div>
              
              <span>Mode: {mode}</span>
              <span>Section: {activeSection}</span>
            </div>
          </div>

          {/* Error display */}
          {errors.length > 0 && (
            <div className="mb-4 p-4 bg-vscode-error-bg border border-vscode-error-border rounded">
              <h3 className="font-semibold text-vscode-error-foreground mb-2">
                {errors.length} Error{errors.length !== 1 ? 's' : ''} Found
              </h3>
              <ul className="space-y-1">
                {errors.map(error => (
                  <li key={error.id} className="text-sm text-vscode-error-foreground">
                    [{error.type}] {error.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Document statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-vscode-input-bg border border-vscode-border rounded p-4">
              <div className="text-2xl font-bold text-vscode-foreground">
                {document.preproc.length}
              </div>
              <div className="text-sm text-vscode-secondary">Preproc Components</div>
            </div>
            
            <div className="bg-vscode-input-bg border border-vscode-border rounded p-4">
              <div className="text-2xl font-bold text-vscode-foreground">
                {document.postproc.length}
              </div>
              <div className="text-sm text-vscode-secondary">Postproc Components</div>
            </div>
            
            <div className="bg-vscode-input-bg border border-vscode-border rounded p-4">
              <div className="text-2xl font-bold text-vscode-foreground">
                {document.html.length}
              </div>
              <div className="text-sm text-vscode-secondary">HTML Characters</div>
            </div>
            
            <div className="bg-vscode-input-bg border border-vscode-border rounded p-4">
              <div className="text-2xl font-bold text-vscode-foreground">
                {errors.length}
              </div>
              <div className="text-sm text-vscode-secondary">Validation Errors</div>
            </div>
          </div>

          {/* Component lists */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Preproc components */}
            <div className="bg-vscode-input-bg border border-vscode-border rounded p-4">
              <h3 className="font-semibold text-vscode-foreground mb-3">
                Preprocessing Components ({document.preproc.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {document.preproc.map(component => (
                  <div 
                    key={component.n} 
                    className="flex items-center justify-between p-2 bg-vscode-editor-bg rounded text-sm"
                  >
                    <div>
                      <span className="font-medium text-vscode-foreground">
                        {component.n}: {component.t}
                      </span>
                      {component.c && (
                        <div className="text-vscode-secondary">{component.c}</div>
                      )}
                    </div>
                    <div className="text-vscode-secondary">
                      ({component.x}, {component.y})
                    </div>
                  </div>
                ))}
                {document.preproc.length === 0 && (
                  <div className="text-center text-vscode-secondary py-4">
                    No preprocessing components
                  </div>
                )}
              </div>
            </div>

            {/* Postproc components */}
            <div className="bg-vscode-input-bg border border-vscode-border rounded p-4">
              <h3 className="font-semibold text-vscode-foreground mb-3">
                Postprocessing Components ({document.postproc.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {document.postproc.map(component => (
                  <div 
                    key={component.n} 
                    className="flex items-center justify-between p-2 bg-vscode-editor-bg rounded text-sm"
                  >
                    <div>
                      <span className="font-medium text-vscode-foreground">
                        {component.n}: {component.t}
                      </span>
                      {component.c && (
                        <div className="text-vscode-secondary">{component.c}</div>
                      )}
                    </div>
                    <div className="text-vscode-secondary">
                      ({component.x}, {component.y})
                    </div>
                  </div>
                ))}
                {document.postproc.length === 0 && (
                  <div className="text-center text-vscode-secondary py-4">
                    No postprocessing components
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex space-x-4">
            <button 
              onClick={handleSave}
              disabled={!isDirty || isLoading}
              className="px-4 py-2 bg-vscode-button-bg text-vscode-button-foreground rounded hover:bg-vscode-button-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save Document'}
            </button>
            
            <button 
              onClick={handleTestSave}
              className="px-4 py-2 bg-vscode-input-bg text-vscode-foreground border border-vscode-border rounded hover:bg-vscode-list-hover transition-colors"
            >
              Test Save (JSON)
            </button>
            
            <button 
              onClick={() => setLoading(!isLoading)}
              className="px-4 py-2 bg-vscode-input-bg text-vscode-foreground border border-vscode-border rounded hover:bg-vscode-list-hover transition-colors"
            >
              Toggle Loading
            </button>
          </div>
        </div>
      </EditorLayout>
    );
  }

  // Initial state - no document loaded yet
  return (
    <EditorLayout>
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="max-w-2xl text-center space-y-6">
          <h1 className="text-3xl font-bold text-vscode-foreground">
            VRM Editor
          </h1>
          
          <p className="text-vscode-secondary">
            Visual editor for VRM (Visual Resource Model) files
          </p>
          
          <div className="bg-vscode-input-bg border border-vscode-border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isReady ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-sm">
                {isReady ? 'Connected to VS Code' : 'Connecting...'}
              </span>
            </div>
            
            <div className="text-sm space-y-2">
              <p className="font-medium">✅ Phase 1: Foundation Setup</p>
              <ul className="text-xs text-vscode-secondary space-y-1">
                <li>• Vite + React + TypeScript</li>
                <li>• VS Code extension integration</li>
                <li>• Tailwind CSS + VS Code theming</li>
                <li>• Message communication system</li>
              </ul>
              
              <p className="font-medium text-green-400">🚧 Phase 2: State Management & Data Flow</p>
              <ul className="text-xs text-vscode-secondary space-y-1">
                <li>• Zustand stores implemented</li>
                <li>• VRM parser service created</li>
                <li>• Document state management</li>
                <li>• Component and selection stores</li>
              </ul>
            </div>
            
            <div className="text-xs text-vscode-secondary">
              Ready to load VRM documents. Open a .vrm file to get started.
            </div>
          </div>
        </div>
      </div>
    </EditorLayout>
  );
};