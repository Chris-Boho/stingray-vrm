export function getPaletteStyles(): string {
    return `
        /* =================================================================
         * Component Palette Styles - FIXED: Better drag handling
         * ================================================================= */
        
        .component-palette {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            margin-bottom: 15px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .palette-header {
            background-color: var(--vscode-panel-background);
            padding: 8px 12px;
            border-bottom: 1px solid var(--vscode-panel-border);
            border-radius: 6px 6px 0 0;
        }
        
        .palette-header h3 {
            margin: 0;
            font-size: 13px;
            font-weight: 600;
            color: var(--vscode-foreground);
        }
        
        .palette-content {
            padding: 12px;
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            gap: 8px;
            align-items: flex-start;
            justify-content: space-evenly;
        }
        
        /* Remove all category-related styles since we're not using categories anymore */
        
        .palette-component {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;
            padding: 6px 4px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            background-color: var(--vscode-input-background);
            cursor: pointer;
            transition: all 0.2s ease;
            width: 60px;
            height: 60px;
            text-align: center;
            /* FIXED: Prevent default drag behavior */
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            justify-content: center;
        }
        
        .palette-component:hover {
            background-color: var(--vscode-list-hoverBackground);
            border-color: var(--vscode-focusBorder);
            transform: translateY(-1px);
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
        
        .palette-component:active {
            transform: translateY(0);
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        /* FIXED: Better drag state styling that gets properly cleaned up */
        .palette-component[data-drag-started="true"] {
            opacity: 0.6;
            transform: scale(0.95);
        }
        
        /* FIXED: Ensure normal state is restored */
        .palette-component:not([data-drag-started]):not(:hover):not(:active) {
            opacity: 1;
            transform: none;
            background-color: var(--vscode-input-background);
            border-color: var(--vscode-panel-border);
            box-shadow: none;
        }
        
        .component-icon {
            font-size: 16px;
            line-height: 1;
            filter: grayscale(0%);
        }
        
        .component-name {
            font-size: 8px;
            font-weight: 500;
            color: var(--vscode-foreground);
            line-height: 1;
            word-wrap: break-word;
            overflow-wrap: break-word;
            hyphens: auto;
            text-align: center;
            max-width: 100%;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
        }
        
        .palette-footer {
            padding: 6px 12px;
            border-top: 1px solid var(--vscode-panel-border);
            background-color: var(--vscode-panel-background);
            border-radius: 0 0 6px 6px;
        }
        
        .palette-instructions {
            text-align: center;
        }
        
        .palette-instructions small {
            font-size: 10px;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
        }
        
        /* FIXED: Custom drag ghost styling - much better appearance */
        .palette-ghost {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 10px;
            background-color: var(--vscode-editor-background);
            border: 2px solid var(--vscode-focusBorder);
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-family: var(--vscode-font-family);
            font-size: 12px;
            color: var(--vscode-foreground);
            z-index: 10000;
            pointer-events: none;
            opacity: 0.9;
            /* FIXED: Smooth animation */
            transition: opacity 0.1s ease;
        }
        
        .ghost-icon {
            font-size: 14px;
            line-height: 1;
        }
        
        .ghost-name {
            font-weight: 500;
            white-space: nowrap;
        }
        
        /* FIXED: Canvas drop zone highlighting */
        .component-canvas.drag-over {
            background-color: rgba(33, 150, 243, 0.05);
            border: 2px dashed var(--vscode-focusBorder);
        }
        
        /* Collapsed state */
        .component-palette.collapsed .palette-content,
        .component-palette.collapsed .palette-footer {
            display: none;
        }
        
        .component-palette.collapsed .palette-header {
            border-radius: 6px;
        }
        
        .palette-toggle {
            float: right;
            background: none;
            border: none;
            color: var(--vscode-foreground);
            cursor: pointer;
            font-size: 12px;
            padding: 0;
            margin: 0;
        }
        
        .palette-toggle:hover {
            color: var(--vscode-focusBorder);
        }
        
        /* Responsive design */
        @media (max-width: 1200px) {
            .palette-content {
                gap: 6px;
            }
            
            .palette-component {
                width: 50px;
                height: 50px;
                padding: 4px 2px;
            }
            
            .component-icon {
                font-size: 12px;
            }
            
            .component-name {
                font-size: 7px;
            }
        }
        
        @media (max-width: 800px) {
            .palette-content {
                gap: 4px;
                padding: 8px;
            }
            
            .palette-component {
                width: 45px;
                height: 45px;
                padding: 3px 2px;
            }
            
            .component-icon {
                font-size: 10px;
            }
            
            .component-name {
                font-size: 6px;
            }
        }
        
        /* FIXED: Prevent text selection during drag */
        .palette-component * {
            pointer-events: none;
            user-select: none;
        }
        
        /* FIXED: Hide native drag preview completely */
        .palette-component::-webkit-drag-placeholder {
            display: none !important;
        }
        
        .palette-component::selection {
            background: transparent;
        }
    `;
}