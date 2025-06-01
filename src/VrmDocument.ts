import * as vscode from 'vscode';
import { VrmParser } from './VrmParser';

export class VrmDocument {
    private parser: VrmParser;

    constructor(private document: vscode.TextDocument) {
        this.parser = new VrmParser(document.getText());
    }

    get uri(): vscode.Uri {
        return this.document.uri;
    }

    public getDocument(): vscode.TextDocument {
        return this.document;
    }

    public getHtmlContent(): string {
        return this.parser.extractHtml();
    }

    public getJsContent(): string {
        return this.parser.extractJavaScript();
    }

    private async applyEdit(newContent: string): Promise<void> {
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(
            this.document.positionAt(0),
            this.document.positionAt(this.document.getText().length)
        );
        edit.replace(this.document.uri, fullRange, newContent);
        const success = await vscode.workspace.applyEdit(edit);
        if (!success) {
            throw new Error('Failed to apply workspace edit');
        }
    }

    public async updateHtmlContent(newHtml: string): Promise<string> {
        const updatedContent = this.parser.updateHtml(newHtml);
        await this.applyEdit(updatedContent);
        return updatedContent;
    }

    public async updateJsContent(newJs: string): Promise<string> {
        const updatedContent = this.parser.updateJavaScript(newJs);
        await this.applyEdit(updatedContent);
        return updatedContent;
    }
}