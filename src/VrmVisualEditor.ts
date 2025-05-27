import * as vscode from 'vscode';
import { VrmComponent } from './visual-editor/VrmComponent';
import { ComponentParser } from './visual-editor/ComponentParser';
import { HtmlGenerator } from './visual-editor/HtmlGenerator';
import { ComponentXmlGenerator } from './visual-editor/ComponentXmlGenerator';

export class VrmVisualEditor {
    private preprocComponents: VrmComponent[] = [];
    private postprocComponents: VrmComponent[] = [];
    private webview: vscode.Webview;
    private componentParser: ComponentParser;
    private htmlGenerator: HtmlGenerator;
    private xmlGenerator: ComponentXmlGenerator;

    constructor(webview: vscode.Webview) {
        this.webview = webview;
        this.componentParser = new ComponentParser();
        this.htmlGenerator = new HtmlGenerator();
        this.xmlGenerator = new ComponentXmlGenerator();
    }

    public parseComponents(xmlContent: string): VrmComponent[] {
        return this.componentParser.parseComponents(xmlContent);
    }

    public parseComponentSection(sectionContent: string, sectionType: 'preproc' | 'postproc'): VrmComponent[] {
        return this.componentParser.parseComponentSection(sectionContent, sectionType);
    }

    public generateVisualEditorHtml(): string {
        return this.htmlGenerator.generateVisualEditorHtml();
    }

    public generateMainWebviewHtml(allComponents: VrmComponent[]): string {
        return this.htmlGenerator.generateMainWebviewHtml(this.webview, allComponents);
    }

    public updateWebview(components: VrmComponent[]): void {
        // Update internal component arrays
        this.preprocComponents = components.filter(c => c.section === 'preproc');
        this.postprocComponents = components.filter(c => c.section === 'postproc');

        // Send update to webview
        this.webview.postMessage({
            type: 'updateComponents',
            components: components
        });
    }

    public getPreprocComponents(): VrmComponent[] {
        return this.preprocComponents;
    }

    public getPostprocComponents(): VrmComponent[] {
        return this.postprocComponents;
    }

    public getAllComponents(): VrmComponent[] {
        return [...this.preprocComponents, ...this.postprocComponents];
    }

    // XML generation methods for component updates - now delegates to ComponentXmlGenerator
    public generateComponentXml(component: VrmComponent): string {
        return this.xmlGenerator.generateComponentXml(component);
    }

    public updateComponentInXml(xmlContent: string, updatedComponent: VrmComponent): string {
        return this.xmlGenerator.updateComponentInXml(xmlContent, updatedComponent);
    }
}