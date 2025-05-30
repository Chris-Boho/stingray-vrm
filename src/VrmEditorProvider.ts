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
                this.cleanupWatchers(document.uri.fsPath);
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
                    let updatedContent: string;
                    
                    if (type === 'html') {
                        updatedContent = vrmDocument.updateHtmlContent(savedDoc.getText());
                    } else {
                        updatedContent = vrmDocument.updateJsContent(savedDoc.getText());
                    }
                    
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

    private cleanupWatchers(documentPath: string): void {
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