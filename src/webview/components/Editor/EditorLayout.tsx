import React from 'react';

interface EditorLayoutProps {
  children: React.ReactNode;
}

const EditorLayout: React.FC<EditorLayoutProps> = ({ children }) => {
  return (
    <div className="h-full w-full flex flex-col bg-vscode-background text-vscode-foreground">
      {/* Header/Toolbar */}
      <header className="h-10 bg-vscode-input-bg border-b border-vscode-border flex items-center px-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-sm font-medium">VRM Editor</h1>
          <div className="text-xs text-vscode-secondary">
            Phase 1: Foundation Setup
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 flex overflow-hidden">
        {children}
      </main>

      {/* Status bar */}
      <footer className="h-6 bg-vscode-input-bg border-t border-vscode-border flex items-center px-4 text-xs text-vscode-secondary">
        <div className="flex items-center space-x-4">
          <span>Ready</span>
          <span>•</span>
          <span>Grid: 32x26</span>
        </div>
      </footer>
    </div>
  );
};

export default EditorLayout;