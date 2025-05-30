// VrmEditorProvider.ts - Complete implementation with component deletion support

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ComponentXmlGenerator } from './visual-editor/ComponentXmlGenerator';
import { HtmlGenerator } from './visual-editor/HtmlGenerator';
import { ComponentParser } from './visual-editor/ComponentParser';
import { VrmDocument } from './VrmDocument';
import { VrmComponent } from './types';

export class VrmEditorProvider implements vscode.CustomTextEditorProvider {
    private static readonly viewType = 'vrmEditor.vrmEditor';
    private tempFiles: Map<string, string[]> = new Map();
    private tempFileWatchers: Map<string, vscode.Disposable[]> = new Map();
    private codeEditorWatchers: Map<string, vscode.Disposable> = new Map(); // Track code editor watchers

    constructor(private context: vscode.ExtensionContext) {}

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new VrmEditorProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(
            VrmEditorProvider.viewType, 
            provider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true,
                },
                supportsMultipleEditorsPerDocument: false,
            }
        );
        return providerRegistration;
    }

    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        // Set up webview options
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this.context.extensionUri
            ]
        };

        // Set up message handling from webview
        webviewPanel.webview.onDidReceiveMessage(
            async (message) => {
                console.log('Received message:', message.command);
                
                switch (message.command) {
                    case 'openHtml':
                        await this.openHtmlEditor(document);
                        break;
                    
                    case 'openJs':
                        await this.openJsEditor(document);
                        break;
                    
                    case 'updateComponent':
                        await this.updateComponent(document, message.component);
                        break;
                    
                    case 'addComponent':
                        await this.addComponent(document, message.component);
                        break;
                    
                    case 'deleteComponent':
                        await this.deleteComponent(document, message.component);
                        break;
                    
                    case 'openCodeEditor':
                        await this.openCodeEditor(
                            message.content, 
                            message.language, 
                            message.filename, 
                            message.componentId, 
                            message.componentType,
                            document,
                            webviewPanel
                        );
                        break;
                    
                    default:
                        console.warn('Unknown command:', message.command);
                }
            },
            undefined,
            this.context.subscriptions
        );

        // Set up document change listener to update webview
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                // Use setTimeout to avoid blocking the UI thread
                setTimeout(() => {
                    this.updateWebview(webviewPanel, document);
                }, 100);
            }
        });

        // Clean up temp files and watchers when editor is disposed
        webviewPanel.onDidDispose(
            () => {
                this.cleanupTempFiles(document.uri.fsPath);
                this.cleanupTempFileWatchers(document.uri.fsPath);
                this.cleanupCodeEditorWatchers(document.uri.fsPath);
                changeDocumentSubscription.dispose();
            },
            null,
            this.context.subscriptions
        );

        // Initialize webview content
        await this.updateWebview(webviewPanel, document);
    }

    private async updateWebview(webviewPanel: vscode.WebviewPanel, document: vscode.TextDocument): Promise<void> {
        try {
            console.log('Updating webview for document:', document.uri.fsPath);
            
            // Parse components from the VRM document
            const parser = new ComponentParser();
            const allComponents = parser.parseComponents(document.getText());
            
            console.log('Parsed components:', allComponents.length);
            
            // Generate HTML for the webview
            const htmlGenerator = new HtmlGenerator();
            webviewPanel.webview.html = htmlGenerator.generateMainWebviewHtml(webviewPanel.webview, allComponents);
            
        } catch (error) {
            console.error('Error updating webview:', error);
            webviewPanel.webview.html = this.generateErrorHtml(error);
        }
    }

    private generateErrorHtml(error: any): string {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>VRM Editor - Error</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                        padding: 20px;
                        line-height: 1.6;
                    }
                    .error {
                        background-color: var(--vscode-inputValidation-errorBackground);
                        border: 1px solid var(--vscode-inputValidation-errorBorder);
                        color: var(--vscode-inputValidation-errorForeground);
                        padding: 16px;
                        border-radius: 4px;
                        margin: 20px 0;
                    }
                    .error h2 {
                        margin-top: 0;
                        color: var(--vscode-errorForeground);
                    }
                    pre {
                        background-color: var(--vscode-textCodeBlock-background);
                        padding: 12px;
                        border-radius: 4px;
                        overflow-x: auto;
                        font-size: 12px;
                    }
                </style>
            </head>
            <body>
                <h1>VRM Editor - Error Loading</h1>
                <div class="error">
                    <h2>Failed to load VRM editor</h2>
                    <p>An error occurred while initializing the VRM editor. Please check the console for more details.</p>
                    <pre>${errorMessage}</pre>
                </div>
                <p>Try the following:</p>
                <ul>
                    <li>Close and reopen the VRM file</li>
                    <li>Check that the VRM file has valid XML structure</li>
                    <li>Report this issue if the problem persists</li>
                </ul>
            </body>
            </html>
        `;
    }

    // Enhanced openCodeEditor method with better sync support
    private async openCodeEditor(
        content: string, 
        language: string, 
        filename: string, 
        componentId?: number, 
        componentType?: string,
        originalDocument?: vscode.TextDocument,
        webviewPanel?: vscode.WebviewPanel
    ): Promise<void> {
        try {
            console.log(`Opening enhanced code editor for component ${componentId} (${componentType})`);
            
            // Get workspace folder
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                throw new Error('No workspace folder found. Please open a folder or workspace.');
            }
            
            // Create temp directory for code files
            const tempDir = path.join(workspaceFolders[0].uri.fsPath, '.vscode', 'vrm-editor', 'code');
            
            try {
                await fs.promises.mkdir(tempDir, { recursive: true });
            } catch (error) {
                if ((error as any).code !== 'EEXIST') {
                    throw new Error(`Failed to create temp directory: ${error}`);
                }
            }
            
            // Determine file extension and language mode
            const getFileInfo = (lang: string): { extension: string; mode: string } => {
                switch (lang.toLowerCase()) {
                    case 'sql': 
                        return { extension: 'sql', mode: 'sql' };
                    case 'pascal': 
                        return { extension: 'pas', mode: 'pascal' };
                    case 'javascript': 
                        return { extension: 'js', mode: 'javascript' };
                    case 'typescript': 
                        return { extension: 'ts', mode: 'typescript' };
                    case 'python': 
                        return { extension: 'py', mode: 'python' };
                    case 'csharp': 
                        return { extension: 'cs', mode: 'csharp' };
                    default: 
                        return { extension: 'txt', mode: 'plaintext' };
                }
            };
            
            const fileInfo = getFileInfo(language);
            const tempFileName = `${filename}.${fileInfo.extension}`;
            const tempFilePath = path.join(tempDir, tempFileName);
            
            // Write enhanced content with metadata header
            const enhancedContent = this.generateCodeFileHeader(componentId, componentType, language) + content;
            await fs.promises.writeFile(tempFilePath, enhancedContent, 'utf8');
            
            // Open the file in VS Code
            const tempDocument = await vscode.workspace.openTextDocument(tempFilePath);
            const editor = await vscode.window.showTextDocument(tempDocument, { 
                viewColumn: vscode.ViewColumn.Beside,
                preview: false 
            });
            
            // Set language mode
            await vscode.languages.setTextDocumentLanguage(tempDocument, fileInfo.mode);
            
            // Enhanced notification with instructions
            const action = await vscode.window.showInformationMessage(
                `📝 ${componentType} ${language.toUpperCase()} code opened. Edit and save to update component.`,
                'Enable Auto-Sync',
                'Manual Sync Only'
            );
            
            // Set up enhanced file watcher with sync capabilities
            if (originalDocument && webviewPanel) {
                this.setupEnhancedCodeFileWatcher(
                    tempDocument, 
                    originalDocument,
                    webviewPanel,
                    componentId, 
                    componentType, 
                    language,
                    action === 'Enable Auto-Sync'
                );
            }
            
            // Position cursor after header (skip metadata lines)
            const headerLines = 6; // Number of header comment lines
            const position = new vscode.Position(headerLines, 0);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position));
            
        } catch (error) {
            console.error('Error opening enhanced code editor:', error);
            vscode.window.showErrorMessage(`Error opening code editor: ${error}`);
        }
    }

    // Generate helpful header for code files
    private generateCodeFileHeader(componentId?: number, componentType?: string, language?: string): string {
        const timestamp = new Date().toLocaleString();
        return `/*
 * VRM Component Code Editor
 * Component ID: ${componentId || 'Unknown'}
 * Component Type: ${componentType || 'Unknown'}
 * Language: ${language || 'Unknown'}
 * Generated: ${timestamp}
 * 
 * NOTE: This is a temporary file for editing component code.
 * Changes will be synced back to the VRM file when you save.
 * Do not move or rename this file.
 */

`;
    }

    // Enhanced code file watcher with auto-sync capabilities
    private setupEnhancedCodeFileWatcher(
        tempDoc: vscode.TextDocument, 
        originalDoc: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        componentId?: number, 
        componentType?: string, 
        language?: string,
        autoSync: boolean = false
    ): void {
        const watcherKey = `${originalDoc.uri.fsPath}_${componentId}`;
        
        // Dispose existing watcher if it exists
        if (this.codeEditorWatchers.has(watcherKey)) {
            this.codeEditorWatchers.get(watcherKey)?.dispose();
        }

        const watcher = vscode.workspace.onDidSaveTextDocument(async (savedDoc) => {
            if (savedDoc.uri.fsPath === tempDoc.uri.fsPath) {
                try {
                    console.log(`Code file saved for component ${componentId}, processing sync`);
                    
                    // Extract content (remove header)
                    const fullContent = savedDoc.getText();
                    const lines = fullContent.split('\n');
                    const headerEndIndex = lines.findIndex(line => line.trim() === '') + 1;
                    const actualContent = lines.slice(headerEndIndex).join('\n').trim();
                    
                    if (autoSync) {
                        // Auto-sync: directly update the component
                        await this.syncCodeBackToComponent(
                            originalDoc, 
                            componentId, 
                            componentType, 
                            actualContent,
                            webviewPanel
                        );
                        
                        vscode.window.showInformationMessage(
                            `✅ ${componentType} ${language?.toUpperCase()} code auto-synced to component ${componentId}`
                        );
                    } else {
                        // Manual sync: prompt user
                        const action = await vscode.window.showInformationMessage(
                            `💾 ${componentType} ${language?.toUpperCase()} code saved. Sync changes to component ${componentId}?`,
                            'Sync Now',
                            'Later',
                            'Enable Auto-Sync'
                        );
                        
                        if (action === 'Sync Now') {
                            await this.syncCodeBackToComponent(
                                originalDoc, 
                                componentId, 
                                componentType, 
                                actualContent,
                                webviewPanel
                            );
                            vscode.window.showInformationMessage(`✅ Changes synced to component ${componentId}`);
                        } else if (action === 'Enable Auto-Sync') {
                            // Update watcher to auto-sync
                            this.setupEnhancedCodeFileWatcher(
                                tempDoc, 
                                originalDoc, 
                                webviewPanel,
                                componentId, 
                                componentType, 
                                language, 
                                true
                            );
                            vscode.window.showInformationMessage('🔄 Auto-sync enabled for this code file');
                        }
                    }
                    
                } catch (error) {
                    console.error('Error handling code file save:', error);
                    vscode.window.showErrorMessage(`Error syncing code changes: ${error}`);
                }
            }
        });
        
        this.codeEditorWatchers.set(watcherKey, watcher);
        this.context.subscriptions.push(watcher);
    }

    // Sync code changes back to VRM component
    private async syncCodeBackToComponent(
        document: vscode.TextDocument,
        componentId?: number,
        componentType?: string,
        content?: string,
        webviewPanel?: vscode.WebviewPanel
    ): Promise<void> {
        if (!componentId || !content) {
            throw new Error('Invalid component ID or content for sync');
        }

        try {
            // Parse current document to find the component
            const parser = new ComponentParser();
            const allComponents = parser.parseComponents(document.getText());
            const component = allComponents.find(c => c.n === componentId);
            
            if (!component) {
                throw new Error(`Component ${componentId} not found in document`);
            }

            // Update component values based on type
            if (!component.values) {
                component.values = {};
            }

            switch (componentType) {
                case 'INSERTUPDATEQUERY':
                case 'SELECTQUERY':
                    component.values.query = content;
                    break;
                case 'SCRIPT':
                    component.values.script = content;
                    break;
                default:
                    throw new Error(`Unsupported component type for code sync: ${componentType}`);
            }

            // Update the component in the document
            await this.updateComponent(document, component);
            
            // Refresh webview to show changes
            if (webviewPanel) {
                await this.updateWebview(webviewPanel, document);
            }

        } catch (error) {
            console.error('Error syncing code back to component:', error);
            throw error;
        }
    }

    // Cleanup code editor watchers
    private cleanupCodeEditorWatchers(documentPath: string): void {
        const keysToRemove: string[] = [];
        
        this.codeEditorWatchers.forEach((watcher, key) => {
            if (key.startsWith(documentPath)) {
                try {
                    watcher.dispose();
                    keysToRemove.push(key);
                    console.log('Cleaned up code editor watcher:', key);
                } catch (error) {
                    console.warn('Error disposing code editor watcher:', error);
                }
            }
        });
        
        keysToRemove.forEach(key => {
            this.codeEditorWatchers.delete(key);
        });
    }

    private async openHtmlEditor(document: vscode.TextDocument): Promise<void> {
        try {
            console.log('Opening HTML editor for:', document.uri.fsPath);
            
            const vrmDocument = new VrmDocument(document);
            const htmlContent = vrmDocument.getHtmlContent();
            
            const tempFilePath = await this.createTempFile(document, 'html', htmlContent);
            const tempDocument = await vscode.workspace.openTextDocument(tempFilePath);
            await vscode.window.showTextDocument(tempDocument, { viewColumn: vscode.ViewColumn.Beside });
            
            // Set up auto-save watcher for this temp file
            this.setupTempFileWatcher(tempDocument, document, 'html');
            
            vscode.window.showInformationMessage('HTML editor opened. Changes will sync automatically when you save.');
            
        } catch (error) {
            console.error('Error opening HTML editor:', error);
            vscode.window.showErrorMessage(`Error opening HTML editor: ${error}`);
        }
    }

    private async openJsEditor(document: vscode.TextDocument): Promise<void> {
        try {
            console.log('Opening JavaScript editor for:', document.uri.fsPath);
            
            const vrmDocument = new VrmDocument(document);
            const jsContent = vrmDocument.getJsContent();
            
            const tempFilePath = await this.createTempFile(document, 'js', jsContent);
            const tempDocument = await vscode.workspace.openTextDocument(tempFilePath);
            await vscode.window.showTextDocument(tempDocument, { viewColumn: vscode.ViewColumn.Beside });
            
            // Set up auto-save watcher for this temp file
            this.setupTempFileWatcher(tempDocument, document, 'js');
            
            vscode.window.showInformationMessage('JavaScript editor opened. Changes will sync automatically when you save.');
            
        } catch (error) {
            console.error('Error opening JavaScript editor:', error);
            vscode.window.showErrorMessage(`Error opening JavaScript editor: ${error}`);
        }
    }

    private async updateComponent(document: vscode.TextDocument, component: VrmComponent): Promise<void> {
        try {
            console.log('Updating component:', component.n, 'in section:', component.section);
            
            const xmlGenerator = new ComponentXmlGenerator();
            const updatedContent = xmlGenerator.updateComponentInXml(document.getText(), component);
            
            const edit = new vscode.WorkspaceEdit();
            edit.replace(
                document.uri,
                new vscode.Range(0, 0, document.lineCount, 0),
                updatedContent
            );
            
            const success = await vscode.workspace.applyEdit(edit);
            if (success) {
                console.log('Component updated successfully');
            } else {
                throw new Error('Failed to apply workspace edit');
            }
            
        } catch (error) {
            console.error('Error updating component:', error);
            vscode.window.showErrorMessage(`Error updating component: ${error}`);
        }
    }

    private async addComponent(document: vscode.TextDocument, component: VrmComponent): Promise<void> {
        try {
            console.log('Adding new component:', component.n, 'to section:', component.section);
            
            const xmlGenerator = new ComponentXmlGenerator();
            const componentXml = xmlGenerator.generateComponentXml(component);
            
            // Insert the component into the appropriate section
            let documentContent = document.getText();
            const sectionTag = component.section === 'preproc' ? 'preproc' : 'postproc';
            const sectionEndTag = `</${sectionTag}>`;
            
            const endIndex = documentContent.indexOf(sectionEndTag);
            if (endIndex === -1) {
                throw new Error(`Could not find ${sectionEndTag} tag in document`);
            }
            
            // Insert the new component before the closing tag with proper indentation
            const beforeEndTag = documentContent.substring(0, endIndex);
            const afterEndTag = documentContent.substring(endIndex);
            const newContent = beforeEndTag + '        ' + componentXml + '\n        ' + afterEndTag;
            
            const edit = new vscode.WorkspaceEdit();
            edit.replace(
                document.uri,
                new vscode.Range(0, 0, document.lineCount, 0),
                newContent
            );
            
            const success = await vscode.workspace.applyEdit(edit);
            if (success) {
                console.log('Component added successfully');
                vscode.window.showInformationMessage(`Added ${component.t} component #${component.n}`);
            } else {
                throw new Error('Failed to apply workspace edit');
            }
            
        } catch (error) {
            console.error('Error adding component:', error);
            vscode.window.showErrorMessage(`Error adding component: ${error}`);
        }
    }

    private async deleteComponent(document: vscode.TextDocument, component: VrmComponent): Promise<void> {
        try {
            console.log('Deleting component:', component.n, 'from section:', component.section);
            
            const xmlGenerator = new ComponentXmlGenerator();
            const updatedContent = xmlGenerator.deleteComponentFromXml(document.getText(), component);
            
            // Verify that we actually removed something
            if (updatedContent === document.getText()) {
                console.warn(`Component ${component.n} was not found in document for deletion`);
                vscode.window.showWarningMessage(`Component ${component.n} was not found in the document`);
                return;
            }
            
            const edit = new vscode.WorkspaceEdit();
            edit.replace(
                document.uri,
                new vscode.Range(0, 0, document.lineCount, 0),
                updatedContent
            );
            
            const success = await vscode.workspace.applyEdit(edit);
            if (success) {
                console.log(`Component ${component.n} deleted successfully`);
            } else {
                throw new Error('Failed to apply workspace edit for deletion');
            }
            
        } catch (error) {
            console.error('Error deleting component:', error);
            vscode.window.showErrorMessage(`Error deleting component: ${error}`);
        }
    }

    private async createTempFile(document: vscode.TextDocument, type: 'html' | 'js', content: string): Promise<string> {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!workspaceFolder) {
            throw new Error('No workspace folder found. Please open a folder or workspace.');
        }
        
        // Create temp directory structure
        const tempDir = path.join(workspaceFolder.uri.fsPath, '.vscode', 'vrm-editor');
        
        try {
            await fs.promises.mkdir(tempDir, { recursive: true });
        } catch (error) {
            if ((error as any).code !== 'EEXIST') {
                throw new Error(`Failed to create temp directory: ${error}`);
            }
        }
        
        // Create GitIgnore entry for temp directory
        await this.ensureGitIgnoreEntry(workspaceFolder.uri.fsPath);
        
        // Generate temp file name
        const baseName = path.basename(document.uri.fsPath, '.vrm');
        const tempFileName = `${baseName}.vrm.${type}`;
        const tempFilePath = path.join(tempDir, tempFileName);
        
        // Write content to temp file
        await fs.promises.writeFile(tempFilePath, content, 'utf8');
        
        // Track temp file for cleanup
        const documentPath = document.uri.fsPath;
        if (!this.tempFiles.has(documentPath)) {
            this.tempFiles.set(documentPath, []);
        }
        this.tempFiles.get(documentPath)!.push(tempFilePath);
        
        console.log('Created temp file:', tempFilePath);
        return tempFilePath;
    }

    private async ensureGitIgnoreEntry(workspacePath: string): Promise<void> {
        const gitIgnorePath = path.join(workspacePath, '.gitignore');
        const ignoreEntry = '.vscode/vrm-editor/';
        
        try {
            let gitIgnoreContent = '';
            try {
                gitIgnoreContent = await fs.promises.readFile(gitIgnorePath, 'utf8');
            } catch (error) {
                // File doesn't exist, will be created
                console.log('Creating new .gitignore file');
            }
            
            if (!gitIgnoreContent.includes(ignoreEntry)) {
                const newContent = gitIgnoreContent + (gitIgnoreContent.endsWith('\n') ? '' : '\n') + ignoreEntry + '\n';
                await fs.promises.writeFile(gitIgnorePath, newContent, 'utf8');
                console.log('Added VRM temp directory to .gitignore');
            }
        } catch (error) {
            console.warn('Could not update .gitignore:', error);
        }
    }

    private setupTempFileWatcher(tempDoc: vscode.TextDocument, originalDoc: vscode.TextDocument, type: 'html' | 'js'): void {
        const watcher = vscode.workspace.onDidSaveTextDocument(async (savedDoc) => {
            if (savedDoc.uri.fsPath === tempDoc.uri.fsPath) {
                try {
                    console.log(`Syncing ${type.toUpperCase()} changes from temp file to VRM`);
                    
                    const vrmDocument = new VrmDocument(originalDoc);
                    const updatedContent = type === 'html' 
                        ? vrmDocument.updateHtmlContent(savedDoc.getText())
                        : vrmDocument.updateJsContent(savedDoc.getText());
                    
                    const edit = new vscode.WorkspaceEdit();
                    edit.replace(
                        originalDoc.uri,
                        new vscode.Range(0, 0, originalDoc.lineCount, 0),
                        updatedContent
                    );
                    
                    const success = await vscode.workspace.applyEdit(edit);
                    if (success) {
                        console.log(`${type.toUpperCase()} changes synced successfully`);
                    } else {
                        throw new Error('Failed to apply edit');
                    }
                    
                } catch (error) {
                    console.error(`Error syncing ${type.toUpperCase()} changes:`, error);
                    vscode.window.showErrorMessage(`Error syncing ${type.toUpperCase()} changes: ${error}`);
                }
            }
        });
        
        // Track watchers for cleanup
        const documentPath = originalDoc.uri.fsPath;
        if (!this.tempFileWatchers.has(documentPath)) {
            this.tempFileWatchers.set(documentPath, []);
        }
        this.tempFileWatchers.get(documentPath)!.push(watcher);
        
        this.context.subscriptions.push(watcher);
    }

    private async cleanupTempFiles(documentPath: string): Promise<void> {
        console.log('Cleaning up temp files for:', documentPath);
        
        const tempFilePaths = this.tempFiles.get(documentPath);
        if (tempFilePaths) {
            for (const filePath of tempFilePaths) {
                try {
                    // Close any open editors for this temp file
                    await this.closeTempFileEditors(filePath);
                    
                    // Delete the temp file
                    await fs.promises.unlink(filePath);
                    console.log('Cleaned up temp file:', filePath);
                    
                } catch (error) {
                    console.warn('Error cleaning up temp file:', filePath, error);
                }
            }
            
            this.tempFiles.delete(documentPath);
        }
        
        // Also scan for orphaned temp files
        await this.scanAndCleanupOrphanedTempFiles(documentPath);
    }

    private async closeTempFileEditors(filePath: string): Promise<void> {
        try {
            const tempUri = vscode.Uri.file(filePath);
            
            // Find and close all tabs with this temp file
            for (const tabGroup of vscode.window.tabGroups.all) {
                for (const tab of tabGroup.tabs) {
                    if (tab.input instanceof vscode.TabInputText && 
                        tab.input.uri.fsPath === filePath) {
                        await vscode.window.tabGroups.close(tab);
                        console.log('Closed temp file editor:', filePath);
                    }
                }
            }
        } catch (error) {
            console.warn('Error closing temp file editors:', error);
        }
    }

    private async scanAndCleanupOrphanedTempFiles(documentPath: string): Promise<void> {
        try {
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(documentPath));
            if (!workspaceFolder) return;
            
            const tempDir = path.join(workspaceFolder.uri.fsPath, '.vscode', 'vrm-editor');
            const baseName = path.basename(documentPath, '.vrm');
            
            try {
                const files = await fs.promises.readdir(tempDir);
                const relatedFiles = files.filter(file => file.startsWith(`${baseName}.vrm.`));
                
                for (const file of relatedFiles) {
                    const filePath = path.join(tempDir, file);
                    try {
                        await this.closeTempFileEditors(filePath);
                        await fs.promises.unlink(filePath);
                        console.log('Cleaned up orphaned temp file:', filePath);
                    } catch (unlinkError) {
                        console.warn('Could not delete orphaned temp file:', filePath, unlinkError);
                    }
                }
                
                // Try to remove temp directory if empty
                try {
                    await fs.promises.rmdir(tempDir);
                    console.log('Removed empty temp directory');
                } catch (rmdirError) {
                    // Directory not empty, which is fine
                }
                
            } catch (readdirError) {
                // Temp directory doesn't exist, which is fine
            }
            
        } catch (error) {
            console.warn('Error during orphaned temp file cleanup:', error);
        }
    }

    private cleanupTempFileWatchers(documentPath: string): void {
        const watchers = this.tempFileWatchers.get(documentPath);
        if (watchers) {
            watchers.forEach(watcher => {
                watcher.dispose();
            });
            this.tempFileWatchers.delete(documentPath);
            console.log('Cleaned up watchers for:', documentPath);
        }
    }
}
