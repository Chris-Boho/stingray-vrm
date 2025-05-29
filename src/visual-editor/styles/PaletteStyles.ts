export function getPaletteStyles(): string {
    return /*css*/`
        /* Component Palette Horizontal Toolbar */
        .component-palette {
            position: static;
            width: 100%;
            height: auto;
            background-color: var(--vscode-sideBar-background);
            border: 1px solid var(--vscode-sideBar-border);
            border-radius: 4px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-sideBar-foreground);
            margin-bottom: 16px;
        }

        .palette-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 16px;
            background-color: var(--vscode-sideBarSectionHeader-background);
            border-bottom: 1px solid var(--vscode-sideBar-border);
            min-height: 32px;
        }

        .palette-header h3 {
            margin: 0;
            font-size: 14px;
            font-weight: 600;
            color: var(--vscode-sideBarSectionHeader-foreground);
        }

        .palette-toggle {
            display: none;
        }

        /* Component Palette Horizontal Layout - Scalable */
        .palette-content {
            flex: 1;
            overflow-x: hidden;
            overflow-y: hidden;
            padding: 8px 16px;
            display: flex;
            flex-direction: row;
            gap: 1.5%; /* Use percentage for scalable gaps */
            align-items: flex-start;
            justify-content: space-between; /* Distribute categories evenly */
        }

        .palette-category {
            margin-bottom: 0;
            flex: 1; /* Each category takes equal space */
            min-width: 0; /* Allow shrinking */
            display: flex;
            flex-direction: column;
        }

        .category-header {
            padding: 4px 0 6px 0;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            color: var(--vscode-descriptionForeground);
            letter-spacing: 0.3px;
            text-align: center;
            border-bottom: 1px solid var(--vscode-widget-border);
            margin-bottom: 6px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .category-components {
            padding: 0;
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            gap: 2px;
            justify-content: center; /* Center components within category */
        }

        .palette-component {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 6px 4px;
            margin: 0;
            border-radius: 4px;
            cursor: pointer;
            user-select: none;
            transition: background-color 0.2s ease;
            border: 1px solid transparent;
            position: relative;
            flex: 1; /* Components scale within their category */
            min-width: 45px; /* Minimum readable size */
            max-width: 70px; /* Maximum size */
            text-align: center;
        }

        .palette-component:hover {
            background-color: var(--vscode-list-hoverBackground);
            border-color: var(--vscode-list-hoverBackground);
        }

        .palette-component:active {
            background-color: var(--vscode-list-activeSelectionBackground);
            color: var(--vscode-list-activeSelectionForeground);
        }

        .palette-component[draggable="true"] {
            cursor: grab;
        }

        .palette-component[draggable="true"]:active {
            cursor: grabbing;
        }

        .component-icon {
            width: clamp(20px, 3vw, 32px); /* Scalable icon size */
            height: clamp(20px, 3vw, 32px);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: clamp(12px, 2vw, 18px); /* Scalable font size */
            margin-bottom: 3px;
            background-color: var(--vscode-button-background);
            border-radius: 4px;
            flex-shrink: 0;
        }

        .component-name {
            font-size: clamp(8px, 1.2vw, 11px); /* Scalable text */
            line-height: 1.2;
            flex: 1;
            min-width: 0;
            word-wrap: break-word;
            text-align: center;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2; /* Allow 2 lines */
            -webkit-box-orient: vertical;
        }

        .palette-footer {
            padding: 6px 16px;
            border-top: 1px solid var(--vscode-sideBar-border);
            background-color: var(--vscode-sideBar-background);
        }

        .palette-instructions {
            color: var(--vscode-descriptionForeground);
            font-size: 11px;
            line-height: 1.4;
            text-align: center;
        }

        /* Drag Ghost */
        .palette-ghost {
            display: flex;
            align-items: center;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-focusBorder);
            border-radius: 4px;
            padding: 6px 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            font-family: var(--vscode-font-family);
            font-size: 12px;
            color: var(--vscode-foreground);
            max-width: 200px;
        }

        .ghost-icon {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            margin-right: 8px;
            background-color: var(--vscode-button-background);
            border-radius: 2px;
        }

        .ghost-name {
            font-size: 11px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* Canvas Drop Zones */
        .component-canvas {
            transition: background-color 0.2s ease;
        }

        .component-canvas.drag-over {
            background-color: var(--vscode-editor-hoverHighlightBackground);
        }

        /* Remove sidebar margins */
        .visual-editor {
            margin-left: 0;
        }

        /* Better visual feedback for categories */
        .palette-category:not(:last-child) {
            border-right: 1px solid var(--vscode-widget-border);
            padding-right: 1%;
            margin-right: 1%;
        }

        /* Tooltip-like hover effects */
        .palette-component::before {
            content: attr(title);
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background-color: var(--vscode-editorHoverWidget-background);
            color: var(--vscode-editorHoverWidget-foreground);
            border: 1px solid var(--vscode-editorHoverWidget-border);
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 11px;
            white-space: nowrap;
            z-index: 1001;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
            margin-bottom: 6px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .palette-component:hover::before {
            opacity: 1;
            transition-delay: 0.5s;
        }

        /* Enhanced drag feedback */
        .palette-component.dragging {
            opacity: 0.5;
            transform: rotate(2deg);
        }

        /* Animation for component insertion */
        @keyframes componentInserted {
            0% {
                transform: scale(1.2);
                opacity: 0.7;
            }
            50% {
                transform: scale(1.1);
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }

        .component-node.newly-inserted {
            animation: componentInserted 0.5s ease-out;
        }

        /* Responsive adjustments */
        @media (max-width: 1200px) {
            .palette-content {
                gap: 1%;
            }
            
            .component-icon {
                width: clamp(18px, 2.5vw, 28px);
                height: clamp(18px, 2.5vw, 28px);
                font-size: clamp(11px, 1.8vw, 16px);
            }
            
            .component-name {
                font-size: clamp(7px, 1vw, 10px);
            }
        }

        @media (max-width: 900px) {
            .palette-content {
                padding: 6px 12px;
                gap: 0.5%;
            }
            
            .palette-component {
                min-width: 35px;
                max-width: 55px;
                padding: 4px 2px;
            }
            
            .component-icon {
                width: clamp(16px, 2vw, 24px);
                height: clamp(16px, 2vw, 24px);
                font-size: clamp(10px, 1.5vw, 14px);
            }
            
            .component-name {
                font-size: clamp(6px, 0.9vw, 9px);
                -webkit-line-clamp: 1; /* Single line on small screens */
            }
        }

        @media (max-width: 600px) {
            .palette-content {
                flex-wrap: wrap;
                justify-content: center;
            }
            
            .palette-category {
                flex: 0 1 auto;
                margin-bottom: 8px;
            }
            
            .palette-category:not(:last-child) {
                border-right: none;
                border-bottom: 1px solid var(--vscode-widget-border);
                padding-bottom: 8px;
                margin-right: 0;
                padding-right: 0;
            }
        }
    `;
}