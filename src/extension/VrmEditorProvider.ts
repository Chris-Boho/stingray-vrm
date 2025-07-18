import * as vscode from 'vscode';
import * as path from 'path';
import { VrmComponent } from '../webview/types/vrm';

interface ClipboardData {
    components: VrmComponent[];
    copyOrigin: { x: number; y: number };
    timestamp: number;
    sourceFile?: string;
}

export class VrmEditorProvider implements vscode.CustomTextEditorProvider {
    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new VrmEditorProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(
            VrmEditorProvider.viewType,
            provider
        );
        return providerRegistration;
    }

    private static readonly viewType = 'vrmEditor.editor';
    
    // Static clipboard data shared across all editor instances
    private static clipboardData: ClipboardData | null = null;
    
    // Track all active webviews for broadcasting
    private static activeWebviews: Set<vscode.Webview> = new Set();

    constructor(private readonly context: vscode.ExtensionContext) {}

    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        console.log('VRM Editor: Resolving custom text editor for:', document.uri.toString());
        
        // Setup initial webview options
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri]
        };

        // Set the HTML content for the webview
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);
        console.log('VRM Editor: HTML content set for webview');

        // Add webview to active set for clipboard broadcasting
        VrmEditorProvider.activeWebviews.add(webviewPanel.webview);

        // Update webview when document changes
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                this.updateWebview(webviewPanel.webview, document);
            }
        });

        // Handle messages from the webview
        webviewPanel.webview.onDidReceiveMessage(
            message => {
                console.log('VRM Editor: Received message from webview:', message);
                this.handleWebviewMessage(document, webviewPanel.webview, message);
            },
            undefined,
            this.context.subscriptions
        );

        // Clean up subscriptions when webview is disposed
        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
            // Remove webview from active set
            VrmEditorProvider.activeWebviews.delete(webviewPanel.webview);
        });

        // Send initial document content to webview
        console.log('VRM Editor: Sending initial content to webview');
        this.updateWebview(webviewPanel.webview, document);
        
        // Send current clipboard status to the new webview
        this.sendClipboardStatus(webviewPanel.webview);
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        // Get the webview build directory (now in out/webview)
        const webviewUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview')
        );
        
        // Use a nonce for security
        const nonce = this.getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' 'unsafe-inline'; img-src ${webview.cspSource} https: data:;">
                <title>VRM Editor</title>
                <link rel="stylesheet" href="${webviewUri}/main.css">
                
                <style>
                    html, body, #root {
                        height: 100%;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                        overflow: hidden;
                        font-family: var(--vscode-font-family);
                        font-size: var(--vscode-font-size);
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                    }
                </style>
            </head>
            <body>
                <div id="root">Loading VRM Editor...</div>
                <script nonce="${nonce}">
                    console.log('VRM Editor webview script loading...');
                    console.log('Base URI:', '${webviewUri}');
                </script>
                <script nonce="${nonce}" src="${webviewUri}/main.js"></script>
            </body>
            </html>`;
    }

    private updateWebview(webview: vscode.Webview, document: vscode.TextDocument): void {
        const message = {
            type: 'update',
            content: document.getText(),
            uri: document.uri.toString()
        };
        console.log('VRM Editor: Posting message to webview:', message);
        webview.postMessage(message);
    }

    private handleWebviewMessage(document: vscode.TextDocument, webview: vscode.Webview, message: any): void {
        switch (message.type) {
            case 'save':
                this.saveDocument(document, message.content);
                break;
            
            case 'ready':
                // Webview is ready - we'll send initial content in resolveCustomTextEditor
                console.log('Webview ready for document:', document.uri.toString());
                // Send current clipboard status to the ready webview
                this.sendClipboardStatus(webview);
                break;

            case 'copy-components':
                this.handleCopyComponents(document, message);
                break;

            case 'paste-components':
                this.handlePasteComponents(webview, message);
                break;

            case 'get-clipboard-status':
                this.sendClipboardStatus(webview);
                break;

            case 'clear-clipboard':
                this.handleClearClipboard();
                break;
                
            default:
                console.log('Unknown message type:', message.type);
                break;
        }
    }

    private handleCopyComponents(document: vscode.TextDocument, message: any): void {
        const { components, copyOrigin } = message;
        
        if (!components || !Array.isArray(components) || components.length === 0) {
            console.warn('Invalid components data for copy operation');
            return;
        }

        // Store clipboard data
        VrmEditorProvider.clipboardData = {
            components,
            copyOrigin,
            timestamp: Date.now(),
            sourceFile: document.uri.toString()
        };

        console.log(`VRM Editor: Copied ${components.length} components to extension clipboard from ${document.fileName}`);

        // Broadcast clipboard update to all active webviews
        this.broadcastClipboardStatus();

        // Show success message to user
        vscode.window.showInformationMessage(
            `Copied ${components.length} component${components.length !== 1 ? 's' : ''} to VRM clipboard`
        );
    }

    private handlePasteComponents(webview: vscode.Webview, message: any): void {
        const { targetPosition, section } = message;

        if (!VrmEditorProvider.clipboardData) {
            console.warn('No clipboard data available for paste operation');
            webview.postMessage({
                type: 'paste-error',
                error: 'No components in clipboard'
            });
            return;
        }

        // Check if clipboard data is not too old (1 hour limit)
        const oneHour = 60 * 60 * 1000;
        if (Date.now() - VrmEditorProvider.clipboardData.timestamp > oneHour) {
            console.warn('Clipboard data is too old, clearing it');
            VrmEditorProvider.clipboardData = null;
            this.broadcastClipboardStatus();
            webview.postMessage({
                type: 'paste-error',
                error: 'Clipboard data has expired'
            });
            return;
        }

        // Send clipboard data to the requesting webview
        webview.postMessage({
            type: 'clipboard-data',
            data: {
                components: VrmEditorProvider.clipboardData.components,
                copyOrigin: VrmEditorProvider.clipboardData.copyOrigin,
                targetPosition,
                section
            }
        });

        console.log(`VRM Editor: Sent clipboard data for paste operation (${VrmEditorProvider.clipboardData.components.length} components)`);
    }

    private handleClearClipboard(): void {
        VrmEditorProvider.clipboardData = null;
        console.log('VRM Editor: Clipboard cleared');
        
        // Broadcast clipboard update to all active webviews
        this.broadcastClipboardStatus();
    }

    private sendClipboardStatus(webview: vscode.Webview): void {
        const hasData = !!VrmEditorProvider.clipboardData;
        const componentCount = VrmEditorProvider.clipboardData?.components.length || 0;
        const sourceFile = VrmEditorProvider.clipboardData?.sourceFile;

        webview.postMessage({
            type: 'clipboard-status',
            hasData,
            componentCount,
            sourceFile: sourceFile ? path.basename(sourceFile) : undefined
        });
    }

    private broadcastClipboardStatus(): void {
        console.log(`VRM Editor: Broadcasting clipboard status to ${VrmEditorProvider.activeWebviews.size} active webviews`);
        
        VrmEditorProvider.activeWebviews.forEach(webview => {
            try {
                this.sendClipboardStatus(webview);
            } catch (error) {
                console.error('Error sending clipboard status to webview:', error);
                // Remove invalid webview from the set
                VrmEditorProvider.activeWebviews.delete(webview);
            }
        });
    }

    private async saveDocument(document: vscode.TextDocument, content: string): Promise<void> {
        const workspaceEdit = new vscode.WorkspaceEdit();
        
        // Replace entire document content
        workspaceEdit.replace(
            document.uri,
            new vscode.Range(0, 0, document.lineCount, 0),
            content
        );

        await vscode.workspace.applyEdit(workspaceEdit);
    }

    private getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}