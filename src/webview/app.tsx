import React from 'react';

const App: React.FC = () => {
  return (
    <div className="h-full w-full bg-vscode-editor-background text-vscode-foreground">
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">VRM Editor</h1>
          <p className="text-vscode-descriptionForeground">
            Visual editor for VRM (Visual Resource Model) files
          </p>
          <div className="mt-8 p-4 bg-vscode-input-background rounded border border-vscode-input-border">
            <p className="text-sm">
              🚀 Phase 1: Foundation Setup Complete
            </p>
            <p className="text-xs text-vscode-descriptionForeground mt-2">
              Ready to load VRM files and start building the visual editor
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;