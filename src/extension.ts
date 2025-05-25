import * as vscode from 'vscode';
import { VrmEditorProvider } from './VrmEditorProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('VRM Extension activating...');
    
    // Register the custom editor provider
    const provider = new VrmEditorProvider(context);
    
    const registration = vscode.window.registerCustomEditorProvider(
        'vrmEditor.vrm',
        provider,
        {
            webviewOptions: {
                retainContextWhenHidden: true,
            },
            supportsMultipleEditorsPerDocument: false,
        }
    );
    
    console.log('VRM Custom Editor registered');

    context.subscriptions.push(registration);

    // Register commands
    const openHtmlCommand = vscode.commands.registerCommand('vrmEditor.openHtml', () => {
        provider.openHtmlEditor();
    });

    const openJsCommand = vscode.commands.registerCommand('vrmEditor.openJs', () => {
        provider.openJsEditor();
    });

    const openVrmEditorCommand = vscode.commands.registerCommand('vrmEditor.openVrmEditor', async () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && activeEditor.document.fileName.endsWith('.vrm')) {
            await vscode.commands.executeCommand('vscode.openWith', activeEditor.document.uri, 'vrmEditor.vrm');
        } else {
            vscode.window.showErrorMessage('Please open a .vrm file first');
        }
    });

    context.subscriptions.push(openHtmlCommand, openJsCommand, openVrmEditorCommand);
}

export function deactivate() {}