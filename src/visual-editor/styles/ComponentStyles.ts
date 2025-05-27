export function getComponentStyles(): string {
    return `
        .component-node {
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .component-node:hover {
            filter: brightness(1.1);
        }
        
        .component-node.dragging {
            cursor: grabbing;
            opacity: 0.8;
            filter: brightness(1.2);
        }
        
        .component-node.selected {
            filter: brightness(1.3) saturate(1.2);
        }
        
        .component-node.selected .component-rect {
            stroke: #2196F3 !important;
            stroke-width: 3px !important;
            stroke-dasharray: none !important;
        }
        
        .component-node.selecting {
            filter: brightness(1.2);
            animation: selecting-pulse 0.8s infinite;
        }
        
        .component-node.selecting .component-rect {
            stroke: #4FC3F7 !important;
            stroke-width: 2px !important;
            stroke-dasharray: 4,2 !important;
        }
        
        @keyframes selecting-pulse {
            0% { filter: brightness(1.2); }
            50% { filter: brightness(1.4); }
            100% { filter: brightness(1.2); }
        }
        
        .component-rect {
            stroke: var(--vscode-panel-border);
            stroke-width: 2;
            rx: 6;
            transition: all 0.2s ease;
        }
        
        .component-text {
            fill: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
            font-size: 12px;
            text-anchor: middle;
            dominant-baseline: middle;
            pointer-events: none;
        }
        
        .component-icon-text {
            fill: white;
            font-family: var(--vscode-font-family);
            font-size: 10px;
            font-weight: bold;
            text-anchor: middle;
            dominant-baseline: middle;
            pointer-events: none;
        }
        
        .component-label {
            fill: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
            font-size: 13px;
            dominant-baseline: middle;
            pointer-events: none;
        }
        
        .component-comment {
            fill: var(--vscode-descriptionForeground);
            font-family: var(--vscode-font-family);
            font-size: 10px;
            text-anchor: middle;
            pointer-events: none;
        }
        
        .connection-line {
            stroke-width: 3;
            fill: none;
            marker-end: url(#arrowhead);
        }
        
        .primary-connection {
            stroke: #4FC3F7;
        }
        
        .secondary-connection {
            stroke: #666;
        }
        
        .watchpoint-indicator {
            fill: #FF5722;
            stroke: #FF5722;
            stroke-width: 1;
        }
        
        .selection-rect {
            pointer-events: none;
            z-index: 10;
            animation: selection-rect-pulse 1s infinite;
        }
        
        @keyframes selection-rect-pulse {
            0% { stroke-opacity: 1; fill-opacity: 0.2; }
            50% { stroke-opacity: 0.7; fill-opacity: 0.1; }
            100% { stroke-opacity: 1; fill-opacity: 0.2; }
        }
        
        .component-canvas {
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
        }
        
        .component-details {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 300px;
            padding: 15px;
            background: var(--vscode-sideBar-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            z-index: 100;
        }
        
        .detail-row {
            margin-bottom: 8px;
            font-size: 13px;
        }
        
        .detail-label {
            font-weight: 500;
            color: var(--vscode-descriptionForeground);
        }
        
        .detail-value {
            color: var(--vscode-foreground);
            margin-left: 8px;
        }
        
        /* Multi-select feedback styles */
        .multi-select-info {
            background: var(--vscode-list-activeSelectionBackground);
            border: 1px solid var(--vscode-list-activeSelectionForeground);
            color: var(--vscode-list-activeSelectionForeground);
            padding: 10px 12px;
            border-radius: 4px;
            margin-bottom: 12px;
            font-size: 13px;
            font-weight: 500;
            text-align: center;
        }
        
        .selection-instructions {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-top: 10px;
            line-height: 1.4;
            background: var(--vscode-notifications-background);
            border: 1px solid var(--vscode-notifications-border);
            padding: 8px;
            border-radius: 4px;
        }
        
        /* Enhanced visual feedback for selected components during multi-drag */
        .component-node.selected.dragging {
            filter: brightness(1.5) saturate(1.3);
        }
        
        .component-node.selected.dragging .component-rect {
            stroke: #FF5722 !important;
            stroke-width: 4px !important;
            stroke-dasharray: none !important;
        }
        
        /* Keyboard shortcuts hint */
        .keyboard-shortcuts {
            position: absolute;
            bottom: 10px;
            right: 10px;
            background: var(--vscode-sideBar-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 8px 10px;
            font-size: 10px;
            color: var(--vscode-descriptionForeground);
            max-width: 200px;
            z-index: 50;
        }
        
        .keyboard-shortcuts h4 {
            margin: 0 0 6px 0;
            font-size: 11px;
            color: var(--vscode-foreground);
        }
        
        .keyboard-shortcuts div {
            margin-bottom: 3px;
        }
        
        .keyboard-shortcuts kbd {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            padding: 2px 4px;
            border-radius: 2px;
            font-size: 9px;
            font-family: monospace;
        }
    `;
}