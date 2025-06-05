import React, { useEffect, useState } from 'react';
import EditorLayout from './components/Editor/EditorLayout';
import { vscodeService } from './services/vscodeService';
import type { ExtensionMessage } from '../shared/messages';

const App: React.FC = () => {
  const [vrmContent, setVrmContent] = useState<string>('');
  const [documentUri, setDocumentUri] = useState<string>('');
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    // Set up message handlers
    vscodeService.onMessage('update', (message: ExtensionMessage) => {
      if (message.type === 'update') {
        setVrmContent(message.content);
        setDocumentUri(message.uri);
        vscodeService.sendLog('info', 'VRM content updated', { uri: message.uri });
      }
    });

    vscodeService.onMessage('theme-changed', (message: ExtensionMessage) => {
      if (message.type === 'theme-changed') {
        vscodeService.sendLog('info', 'Theme changed', { theme: message.theme });
      }
    });

    // Let extension know webview is ready
    vscodeService.sendReady();
    setIsReady(true);

    // Cleanup
    return () => {
      vscodeService.offMessage('update');
      vscodeService.offMessage('theme-changed');
    };
  }, []);

  const handleSave = () => {
    if (vrmContent) {
      vscodeService.sendSave(vrmContent);
      vscodeService.sendLog('info', 'Save requested');
    }
  };

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
            
            {documentUri && (
              <div className="text-xs text-vscode-secondary">
                <strong>Document:</strong> {documentUri}
              </div>
            )}
            
            <div className="text-sm space-y-2">
              <p className="font-medium">✅ Phase 1: Foundation Setup</p>
              <ul className="text-xs text-vscode-secondary space-y-1">
                <li>• Vite + React + TypeScript</li>
                <li>• VS Code extension integration</li>
                <li>• Tailwind CSS + VS Code theming</li>
                <li>• Message communication system</li>
              </ul>
            </div>
            
            {vrmContent && (
              <div className="mt-4">
                <button 
                  onClick={handleSave}
                  className="px-4 py-2 bg-vscode-button-bg text-vscode-button-foreground rounded hover:bg-vscode-button-hover transition-colors"
                >
                  Test Save
                </button>
                <div className="mt-2 text-xs text-vscode-secondary">
                  Content length: {vrmContent.length} characters
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </EditorLayout>
  );
};

export default App;