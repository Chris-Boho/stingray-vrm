export function getModalStyles(): string {
    return `
        .component-editor-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        
        .modal-content {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            width: 600px;
            max-height: 80vh;
            overflow-y: auto;
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .modal-header h3 {
            margin: 0;
            color: var(--vscode-foreground);
        }
        
        .close-btn {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: var(--vscode-foreground);
        }
        
        .modal-body {
            padding: 20px;
        }
        
        .modal-footer {
            padding: 15px 20px;
            border-top: 1px solid var(--vscode-panel-border);
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            color: var(--vscode-foreground);
        }
        
        .form-group input,
        .form-group textarea,
        .form-group select {
            width: 100%;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: var(--vscode-font-family);
        }
        
        .form-group input[type="checkbox"] {
            width: auto;
        }
        
        .parameter-row {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
            align-items: center;
        }
        
        .parameter-row input {
            flex: 1;
        }
        
        .parameter-row select {
            flex: 0 0 120px;
        }
        
        .parameter-row button {
            flex: 0 0 80px;
            padding: 6px 12px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }
        
        .modal-footer button {
            padding: 8px 16px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }
        
        .modal-footer button:first-child {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        
        .modal-footer button:last-child {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
    `;
}