export function getEditorStyles(): string {
    return `
        .visual-editor {
            margin-top: 20px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            background: var(--vscode-editor-background);
        }
        
        .editor-toolbar {
            display: flex;
            gap: 10px;
            padding: 10px;
            background: var(--vscode-editor-background);
            border-bottom: 1px solid var(--vscode-panel-border);
            align-items: center;
        }
        
        .toolbar-btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 12px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .toolbar-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        .section-tabs {
            display: flex;
            background: var(--vscode-tab-unfocusedActiveBackground);
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .tab-btn {
            background: var(--vscode-tab-inactiveBackground);
            color: var(--vscode-tab-inactiveForeground);
            border: none;
            padding: 12px 20px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            border-right: 1px solid var(--vscode-panel-border);
            transition: all 0.2s ease;
        }
        
        .tab-btn:hover {
            background: var(--vscode-tab-unfocusedActiveBackground);
            color: var(--vscode-tab-activeForeground);
        }
        
        .tab-btn.active {
            background: var(--vscode-tab-activeBackground);
            color: var(--vscode-tab-activeForeground);
            border-bottom: 2px solid var(--vscode-focusBorder);
        }
        
        .canvas-container {
            position: relative;
            background: var(--vscode-editor-background);
            height: 800px;
            overflow: hidden;
        }
        
        .section-content {
            display: none;
            height: 100%;
        }
        
        .section-content.active {
            display: flex;
            flex-direction: column;
            height: 100%;
        }
        
        .section-header {
            padding: 15px 20px;
            background: var(--vscode-sideBar-background);
            border-bottom: 1px solid var(--vscode-panel-border);
            flex-shrink: 0;
        }
        
        .section-header h3 {
            margin: 0 0 5px 0;
            color: var(--vscode-foreground);
            font-size: 16px;
            font-weight: 600;
        }
        
        .section-header p {
            margin: 0;
            color: var(--vscode-descriptionForeground);
            font-size: 13px;
        }
        
        .canvas-wrapper {
            flex: 1;
            overflow: auto;
            position: relative;
            background: var(--vscode-editor-background);
        }
        
        .component-canvas {
            background: var(--vscode-editor-background);
            cursor: default;
            min-width: 1200px;
            min-height: 2000px;
            position: relative;
            background-image: 
                radial-gradient(circle, var(--vscode-panel-border) 1px, transparent 1px);
            background-size: 32px 27px;
            background-position: 0 0;
        }
        
        .canvas-wrapper::-webkit-scrollbar {
            width: 12px;
            height: 12px;
        }
        
        .canvas-wrapper::-webkit-scrollbar-track {
            background: var(--vscode-scrollbar-shadow);
        }
        
        .canvas-wrapper::-webkit-scrollbar-thumb {
            background: var(--vscode-scrollbarSlider-background);
            border-radius: 6px;
        }
        
        .canvas-wrapper::-webkit-scrollbar-thumb:hover {
            background: var(--vscode-scrollbarSlider-hoverBackground);
        }
        
        .canvas-wrapper::-webkit-scrollbar-corner {
            background: var(--vscode-scrollbar-shadow);
        }
    `;
}