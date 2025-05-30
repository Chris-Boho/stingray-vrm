// Enhanced ModalStyles.ts - FIXED for Monaco Editor Integration
export function getModalStyles(): string {
    return `
        /* FIXED: Enhanced Modal Styles with Monaco Editor Support */
        .component-editor-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            font-family: var(--vscode-font-family);
            backdrop-filter: blur(2px);
        }

        /* FIXED: Modal with optimized dimensions for Monaco */
        .modal-content {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            width: 95vw;
            max-width: 1200px;
            height: 85vh;
            max-height: 900px;
            min-height: 600px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        .modal-header {
            padding: 16px 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: var(--vscode-panel-background);
            flex-shrink: 0;
        }

        .modal-header h3 {
            margin: 0;
            color: var(--vscode-foreground);
            font-size: 16px;
            font-weight: 600;
        }

        .close-btn {
            background: none;
            border: none;
            color: var(--vscode-foreground);
            cursor: pointer;
            font-size: 24px;
            padding: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: background-color 0.2s;
        }

        .close-btn:hover {
            background-color: var(--vscode-toolbar-hoverBackground);
        }

        /* FIXED: Modal body optimized for Monaco editors */
        .modal-body {
            padding: 20px;
            overflow-y: auto;
            flex: 1;
            min-height: 0;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .form-group label {
            color: var(--vscode-foreground);
            font-weight: 500;
            font-size: 13px;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
            padding: 8px 12px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 4px;
            font-family: var(--vscode-font-family);
            font-size: 13px;
            box-sizing: border-box;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
            box-shadow: 0 0 0 1px var(--vscode-focusBorder);
        }

        .form-row {
            display: flex;
            gap: 16px;
            align-items: flex-end;
        }

        .parameter-row {
            display: flex;
            gap: 8px;
            margin-bottom: 8px;
            align-items: flex-start;
        }

        .parameter-row input,
        .parameter-row select,
        .parameter-row textarea {
            flex: 1;
        }

        .parameter-row button {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            white-space: nowrap;
        }

        .parameter-row button:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }

        .modal-footer {
            padding: 16px 20px;
            border-top: 1px solid var(--vscode-panel-border);
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            background-color: var(--vscode-panel-background);
            flex-shrink: 0;
        }

        .modal-footer button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: background-color 0.2s;
        }

        .modal-footer button:first-child {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }

        .modal-footer button:first-child:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        .modal-footer button:last-child {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
        }

        .modal-footer button:last-child:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }

        /* ===================================================================
         * FIXED: MONACO EDITOR INTEGRATION STYLES
         * =================================================================== */

        /* FIXED: Code Editor Container - Primary Layout */
        .code-editor-container {
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            overflow: hidden;
            background-color: var(--vscode-editor-background);
            margin: 8px 0;
            display: flex;
            flex-direction: column;
            min-height: 460px; /* Header + Editor + Status */
            flex: 1; /* Take available space in form */
        }

        .code-editor-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background-color: var(--vscode-panel-background);
            border-bottom: 1px solid var(--vscode-panel-border);
            flex-shrink: 0;
            height: 40px;
            box-sizing: border-box;
        }

        .editor-label {
            color: var(--vscode-foreground);
            font-weight: 500;
            font-size: 12px;
        }

        .open-in-vscode-btn {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 12px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 4px;
            transition: all 0.2s ease;
        }

        .open-in-vscode-btn:hover {
            background-color: var(--vscode-button-hoverBackground);
            transform: translateY(-1px);
        }

        .vscode-icon {
            font-size: 12px;
        }

        /* FIXED: Code Editor Wrapper - Main Editor Area */
        .code-editor-wrapper {
            position: relative;
            height: 400px;
            width: 100%;
            flex: 1;
            overflow: hidden;
            background-color: var(--vscode-editor-background);
        }

        /* FIXED: Monaco Editor Container - Direct Monaco Styles */
        .code-editor-wrapper > div,
        .code-editor-wrapper .monaco-editor-container,
        #editQuery_container,
        #editScript_container {
            width: 100% !important;
            height: 100% !important;
            position: relative !important;
            overflow: hidden !important;
        }

        /* FIXED: Monaco Editor Core Overrides */
        .monaco-editor {
            width: 100% !important;
            height: 100% !important;
            position: relative !important;
            font-family: var(--vscode-editor-font-family, 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', Consolas, 'Ubuntu Mono', monospace) !important;
        }

        .monaco-editor .overflow-guard {
            position: relative !important;
            width: 100% !important;
            height: 100% !important;
        }

        .monaco-editor .monaco-scrollable-element {
            width: 100% !important;
            height: 100% !important;
        }

        /* FIXED: Line Numbers Area - Proper Sizing */
        .monaco-editor .margin {
            width: 60px !important;
            min-width: 60px !important;
            background-color: var(--vscode-editorLineNumber-background, #1e1e1e) !important;
            border-right: 1px solid var(--vscode-panel-border, #3e3e3e) !important;
        }

        .monaco-editor .line-numbers {
            color: var(--vscode-editorLineNumber-foreground, #858585) !important;
            padding: 0 8px 0 4px !important;
            text-align: right !important;
            font-size: 13px !important;
            line-height: 20px !important;
            font-family: var(--vscode-editor-font-family, Consolas, monospace) !important;
        }

        .monaco-editor .current-line {
            color: var(--vscode-editorLineNumber-activeForeground, #c6c6c6) !important;
            font-weight: normal !important;
        }

        /* FIXED: Editor Scrollable Area */
        .monaco-editor .editor-scrollable {
            left: 60px !important;
            width: calc(100% - 60px) !important;
        }

        .monaco-editor .lines-content {
            background-color: var(--vscode-editor-background) !important;
            color: var(--vscode-editor-foreground) !important;
        }

        /* FIXED: Scrollbar Styling */
        .monaco-editor .decorationsOverviewRuler {
            right: 0 !important;
            width: 12px !important;
        }

        .monaco-editor .monaco-scrollable-element > .scrollbar > .slider {
            background-color: var(--vscode-scrollbarSlider-background) !important;
        }

        .monaco-editor .monaco-scrollable-element > .scrollbar > .slider:hover {
            background-color: var(--vscode-scrollbarSlider-hoverBackground) !important;
        }

        /* FIXED: Theme-specific Overrides */
        .monaco-editor.vs-dark {
            background-color: var(--vscode-editor-background, #1e1e1e) !important;
            color: var(--vscode-editor-foreground, #d4d4d4) !important;
        }

        .monaco-editor.vs-dark .margin {
            background-color: var(--vscode-editorLineNumber-background, #1e1e1e) !important;
            border-right-color: var(--vscode-panel-border, #3e3e3e) !important;
        }

        .monaco-editor.vs-dark .line-numbers {
            color: var(--vscode-editorLineNumber-foreground, #858585) !important;
        }

        .monaco-editor.vs-dark .current-line {
            color: var(--vscode-editorLineNumber-activeForeground, #c6c6c6) !important;
        }

        .monaco-editor.vs {
            background-color: var(--vscode-editor-background, #ffffff) !important;
            color: var(--vscode-editor-foreground, #000000) !important;
        }

        .monaco-editor.vs .margin {
            background-color: var(--vscode-editorLineNumber-background, #f8f8f8) !important;
            border-right-color: var(--vscode-panel-border, #e8e8e8) !important;
        }

        .monaco-editor.vs .line-numbers {
            color: var(--vscode-editorLineNumber-foreground, #237893) !important;
        }

        .monaco-editor.vs .current-line {
            color: var(--vscode-editorLineNumber-activeForeground, #0451a5) !important;
        }

        /* ===================================================================
         * FIXED: FALLBACK TEXTAREA STYLES (when Monaco fails)
         * =================================================================== */

        .code-editor-textarea {
            width: 100% !important;
            height: 100% !important;
            border: none !important;
            background-color: var(--vscode-editor-background) !important;
            color: var(--vscode-editor-foreground) !important;
            font-family: var(--vscode-editor-font-family, 'SF Mono', 'Monaco', 'Inconsolata', 'Consolas', 'Ubuntu Mono', monospace) !important;
            font-size: 14px !important;
            line-height: 20px !important;
            padding: 8px 12px !important;
            resize: none !important;
            outline: none !important;
            tab-size: 4 !important;
            white-space: pre !important;
            overflow-wrap: normal !important;
            overflow: auto !important;
            box-sizing: border-box !important;
            margin: 0 !important;
        }

        .code-editor-textarea:focus {
            box-shadow: none !important;
            border: none !important;
        }

        /* FIXED: Enhanced Fallback with Line Numbers */
        .fallback-editor-container {
            display: flex;
            height: 100%;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            overflow: hidden;
        }

        .line-numbers {
            background-color: var(--vscode-editorLineNumber-background, #1e1e1e);
            color: var(--vscode-editorLineNumber-foreground, #858585);
            font-family: var(--vscode-editor-font-family, 'Consolas', monospace);
            font-size: 14px;
            line-height: 20px;
            padding: 8px 12px 8px 8px;
            border-right: 1px solid var(--vscode-panel-border);
            user-select: none;
            white-space: pre;
            min-width: 60px;
            width: 60px;
            text-align: right;
            overflow: hidden;
            flex-shrink: 0;
            box-sizing: border-box;
        }

        /* FIXED: Code Editor Status Bar */
        .code-editor-status {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 4px 12px;
            background-color: var(--vscode-statusBar-background, #007ACC);
            color: var(--vscode-statusBar-foreground, white);
            font-size: 11px;
            border-top: 1px solid var(--vscode-panel-border);
            flex-shrink: 0;
            height: 24px;
            box-sizing: border-box;
        }

        .editor-stats {
            display: flex;
            gap: 16px;
        }

        .editor-language {
            color: var(--vscode-statusBar-foreground, white);
            font-weight: 500;
        }

        /* ===================================================================
         * FIXED: RESPONSIVE DESIGN
         * =================================================================== */

        @media (max-width: 1024px) {
            .modal-content {
                width: 98vw;
                height: 90vh;
                max-width: none;
            }

            .code-editor-wrapper {
                min-height: 300px;
                height: 350px;
            }

            .parameter-row {
                flex-direction: column;
                gap: 4px;
            }

            .parameter-row button {
                align-self: flex-start;
                width: auto;
            }
        }

        @media (max-width: 768px) {
            .modal-content {
                width: 100vw;
                height: 100vh;
                max-width: 100vw;
                max-height: 100vh;
                border-radius: 0;
            }

            .code-editor-header {
                flex-direction: column;
                gap: 8px;
                align-items: stretch;
                height: auto;
                padding: 12px;
            }

            .open-in-vscode-btn {
                align-self: flex-end;
            }

            .code-editor-wrapper {
                min-height: 250px;
                height: 300px;
            }

            .line-numbers {
                min-width: 50px;
                width: 50px;
                padding: 8px 8px 8px 4px;
            }

            .monaco-editor .margin {
                width: 50px !important;
                min-width: 50px !important;
            }

            .monaco-editor .editor-scrollable {
                left: 50px !important;
                width: calc(100% - 50px) !important;
            }
        }

        /* ===================================================================
         * ACCESSIBILITY & ANIMATION ENHANCEMENTS
         * =================================================================== */

        .modal-content:focus-within {
            outline: 2px solid var(--vscode-focusBorder);
            outline-offset: -2px;
        }

        .code-editor-textarea:focus-visible,
        .monaco-editor:focus-visible {
            outline: 2px solid var(--vscode-focusBorder);
            outline-offset: -2px;
        }

        /* FIXED: Smooth modal animations */
        .component-editor-modal {
            animation: modalFadeIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        @keyframes modalFadeIn {
            from {
                opacity: 0;
                backdrop-filter: blur(0px);
            }
            to {
                opacity: 1;
                backdrop-filter: blur(2px);
            }
        }

        .modal-content {
            animation: modalSlideIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        @keyframes modalSlideIn {
            from {
                transform: translateY(-30px) scale(0.95);
                opacity: 0;
            }
            to {
                transform: translateY(0) scale(1);
                opacity: 1;
            }
        }

        /* FIXED: Enhanced scrollbar styling for better UX */
        .modal-body::-webkit-scrollbar {
            width: 12px;
        }

        .modal-body::-webkit-scrollbar-track {
            background: var(--vscode-scrollbar-shadow);
        }

        .modal-body::-webkit-scrollbar-thumb {
            background: var(--vscode-scrollbarSlider-background);
            border-radius: 6px;
        }

        .modal-body::-webkit-scrollbar-thumb:hover {
            background: var(--vscode-scrollbarSlider-hoverBackground);
        }

        /* FIXED: Loading state for Monaco */
        .monaco-loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: var(--vscode-editor-background);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            color: var(--vscode-foreground);
            font-size: 14px;
        }

        .monaco-loading-spinner {
            width: 20px;
            height: 20px;
            border: 2px solid var(--vscode-panel-border);
            border-top: 2px solid var(--vscode-focusBorder);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 12px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* FIXED: Error state styling */
        .monaco-error-fallback {
            background-color: var(--vscode-inputValidation-warningBackground);
            border: 1px solid var(--vscode-inputValidation-warningBorder);
            color: var(--vscode-inputValidation-warningForeground);
            padding: 12px;
            border-radius: 4px;
            margin: 8px 0;
            font-size: 12px;
        }

        .monaco-error-fallback::before {
            content: "⚠️ ";
            margin-right: 8px;
        }
    `;
}