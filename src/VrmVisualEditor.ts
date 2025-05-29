import * as vscode from 'vscode';
import { VrmComponent } from './types';
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

    // XML generation methods for component updates - delegates to ComponentXmlGenerator
    public generateComponentXml(component: VrmComponent): string {
        return this.xmlGenerator.generateComponentXml(component);
    }

    public updateComponentInXml(xmlContent: string, updatedComponent: VrmComponent): string {
        return this.xmlGenerator.updateComponentInXml(xmlContent, updatedComponent);
    }

    // Enhanced methods for component management
    public addComponent(component: VrmComponent): void {
        if (component.section === 'preproc') {
            this.preprocComponents.push(component);
        } else {
            this.postprocComponents.push(component);
        }
        
        // Update webview with new component list
        this.updateWebview(this.getAllComponents());
    }

    public removeComponent(componentId: number, section: 'preproc' | 'postproc'): boolean {
        let removed = false;
        
        if (section === 'preproc') {
            const index = this.preprocComponents.findIndex(c => c.n === componentId);
            if (index > -1) {
                this.preprocComponents.splice(index, 1);
                removed = true;
            }
        } else {
            const index = this.postprocComponents.findIndex(c => c.n === componentId);
            if (index > -1) {
                this.postprocComponents.splice(index, 1);
                removed = true;
            }
        }
        
        if (removed) {
            this.updateWebview(this.getAllComponents());
        }
        
        return removed;
    }

    public updateComponent(updatedComponent: VrmComponent): boolean {
        let updated = false;
        
        if (updatedComponent.section === 'preproc') {
            const index = this.preprocComponents.findIndex(c => c.n === updatedComponent.n);
            if (index > -1) {
                this.preprocComponents[index] = updatedComponent;
                updated = true;
            }
        } else {
            const index = this.postprocComponents.findIndex(c => c.n === updatedComponent.n);
            if (index > -1) {
                this.postprocComponents[index] = updatedComponent;
                updated = true;
            }
        }
        
        if (updated) {
            this.updateWebview(this.getAllComponents());
        }
        
        return updated;
    }

    public getComponent(componentId: number, section: 'preproc' | 'postproc'): VrmComponent | undefined {
        if (section === 'preproc') {
            return this.preprocComponents.find(c => c.n === componentId);
        } else {
            return this.postprocComponents.find(c => c.n === componentId);
        }
    }

    public getNextAvailableId(section: 'preproc' | 'postproc'): number {
        const components = section === 'preproc' ? this.preprocComponents : this.postprocComponents;
        if (components.length === 0) return 1;
        
        const usedIds = components.map(c => c.n);
        const maxId = Math.max(...usedIds);
        
        // Find the first available ID (fill gaps first)
        for (let i = 1; i <= maxId; i++) {
            if (!usedIds.includes(i)) {
                return i;
            }
        }
        
        // If no gaps, use next sequential number
        return maxId + 1;
    }

    public getComponentCount(section: 'preproc' | 'postproc'): number {
        return section === 'preproc' ? this.preprocComponents.length : this.postprocComponents.length;
    }

    public clearComponents(section?: 'preproc' | 'postproc'): void {
        if (section === 'preproc') {
            this.preprocComponents = [];
        } else if (section === 'postproc') {
            this.postprocComponents = [];
        } else {
            // Clear both sections
            this.preprocComponents = [];
            this.postprocComponents = [];
        }
        
        this.updateWebview(this.getAllComponents());
    }

    // Method to refresh components from XML content
    public refreshFromXml(xmlContent: string): void {
        const allComponents = this.parseComponents(xmlContent);
        this.preprocComponents = allComponents.filter(c => c.section === 'preproc');
        this.postprocComponents = allComponents.filter(c => c.section === 'postproc');
        this.updateWebview(allComponents);
    }

    // Method to get components by type
    public getComponentsByType(componentType: string, section?: 'preproc' | 'postproc'): VrmComponent[] {
        let components: VrmComponent[];
        
        if (section === 'preproc') {
            components = this.preprocComponents;
        } else if (section === 'postproc') {
            components = this.postprocComponents;
        } else {
            components = this.getAllComponents();
        }
        
        return components.filter(c => c.t === componentType);
    }

    // Method to validate component connections
    public validateConnections(): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        const allComponents = this.getAllComponents();
        
        allComponents.forEach(component => {
            component.j.forEach((connectionId, index) => {
                if (connectionId > 0) {
                    const targetComponent = allComponents.find(c => c.n === connectionId && c.section === component.section);
                    if (!targetComponent) {
                        const connectionType = index === 0 ? 'primary' : 'secondary';
                        errors.push(`Component ${component.n} (${component.section}) has invalid ${connectionType} connection to component ${connectionId}`);
                    }
                }
            });
        });
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
}