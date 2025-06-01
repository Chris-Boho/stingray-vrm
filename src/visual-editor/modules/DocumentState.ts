// import { EventEmitter } from 'vscode';
import { VrmComponent } from '../../types';

// Custom EventEmitter for webview
class WebviewEventEmitter<T> {
  private listeners: ((event: T) => void)[] = [];

  public event(listener: (event: T) => void) {
    this.listeners.push(listener);
    return {
      dispose: () => {
        const index = this.listeners.indexOf(listener);
        if (index !== -1) {
          this.listeners.splice(index, 1);
        }
      }
    };
  }

  public fire(event: T) {
    this.listeners.forEach(listener => listener(event));
  }
}

export interface DocumentStateChange {
  type: 'component' | 'html' | 'js';
  action: 'update' | 'add' | 'delete';
  component?: VrmComponent;
  components?: VrmComponent[];
  content?: string;
}

export class DocumentState {
  private static instance: DocumentState;
  private eventEmitter: WebviewEventEmitter<DocumentStateChange>;

  // Document state
  private preprocComponents: Map<number, VrmComponent> = new Map();
  private postprocComponents: Map<number, VrmComponent> = new Map();
  private htmlContent: string = '';
  private jsContent: string = '';

  // Dirty state tracking
  private dirtyComponents: Set<number> = new Set();
  private isHtmlDirty: boolean = false;
  private isJsDirty: boolean = false;

  private currentSection: 'preproc' | 'postproc' = 'preproc';

  private constructor() {
    this.eventEmitter = new WebviewEventEmitter<DocumentStateChange>();
  }

  public static getInstance(): DocumentState {
    if (!DocumentState.instance) {
      DocumentState.instance = new DocumentState();
    }
    return DocumentState.instance;
  }

  // Event handling
  public onDidChangeState(listener: (change: DocumentStateChange) => void) {
    return this.eventEmitter.event(listener);
  }

  // Component state management
  public getComponent(section: 'preproc' | 'postproc', id: number): VrmComponent | undefined {
    const components = section === 'preproc' ? this.preprocComponents : this.postprocComponents;
    return components.get(id);
  }

  public getComponents(section: 'preproc' | 'postproc'): VrmComponent[] {
    const components = section === 'preproc' ? this.preprocComponents : this.postprocComponents;
    return Array.from(components.values());
  }

  public getAllComponents(): VrmComponent[] {
    return [
      ...Array.from(this.preprocComponents.values()),
      ...Array.from(this.postprocComponents.values())
    ];
  }

  public updateComponent(component: VrmComponent): void {
    const components = component.section === 'preproc' ? this.preprocComponents : this.postprocComponents;

    // Create a deep copy to ensure we're not sharing references
    const updatedComponent = JSON.parse(JSON.stringify(component));

    // Store the component
    components.set(component.n, updatedComponent);

    // Mark as dirty
    this.dirtyComponents.add(component.n);

    // Emit change event
    this.eventEmitter.fire({
      type: 'component',
      action: 'update',
      component: updatedComponent
    });
  }

  public addComponent(component: VrmComponent): void {
    const components = component.section === 'preproc' ? this.preprocComponents : this.postprocComponents;

    // Create a deep copy
    const newComponent = JSON.parse(JSON.stringify(component));

    // Store the component
    components.set(component.n, newComponent);

    // Mark as dirty
    this.dirtyComponents.add(component.n);

    // Emit change event
    this.eventEmitter.fire({
      type: 'component',
      action: 'add',
      component: newComponent
    });
  }

  public deleteComponent(component: VrmComponent): void {
    const components = component.section === 'preproc' ? this.preprocComponents : this.postprocComponents;

    // Remove the component
    components.delete(component.n);

    // Remove from dirty set
    this.dirtyComponents.delete(component.n);

    // Emit change event
    this.eventEmitter.fire({
      type: 'component',
      action: 'delete',
      component
    });
  }

  // Content state management
  public getHtmlContent(): string {
    return this.htmlContent;
  }

  public getJsContent(): string {
    return this.jsContent;
  }

  public updateHtmlContent(content: string): void {
    this.htmlContent = content;
    this.isHtmlDirty = true;

    this.eventEmitter.fire({
      type: 'html',
      action: 'update',
      content
    });
  }

  public updateJsContent(content: string): void {
    this.jsContent = content;
    this.isJsDirty = true;

    this.eventEmitter.fire({
      type: 'js',
      action: 'update',
      content
    });
  }

  // Dirty state management
  public isComponentDirty(componentId: number): boolean {
    return this.dirtyComponents.has(componentId);
  }

  public isHtmlContentDirty(): boolean {
    return this.isHtmlDirty;
  }

  public isJsContentDirty(): boolean {
    return this.isJsDirty;
  }

  public hasDirtyState(): boolean {
    return this.dirtyComponents.size > 0 || this.isHtmlDirty || this.isJsDirty;
  }

  public getDirtyComponents(): VrmComponent[] {
    return Array.from(this.dirtyComponents)
      .map(id => this.getComponent('preproc', id) || this.getComponent('postproc', id))
      .filter((c): c is VrmComponent => c !== undefined);
  }

  // State reset
  public clearDirtyState(): void {
    this.dirtyComponents.clear();
    this.isHtmlDirty = false;
    this.isJsDirty = false;
  }

  // Initial state loading
  public loadState(components: VrmComponent[], html: string, js: string): void {
    // Clear existing state
    this.preprocComponents.clear();
    this.postprocComponents.clear();
    this.dirtyComponents.clear();
    this.isHtmlDirty = false;
    this.isJsDirty = false;

    // Load components
    components.forEach(component => {
      const components = component.section === 'preproc' ? this.preprocComponents : this.postprocComponents;
      components.set(component.n, JSON.parse(JSON.stringify(component)));
    });

    // Load content
    this.htmlContent = html;
    this.jsContent = js;
  }

  public getCurrentSection(): 'preproc' | 'postproc' {
    return this.currentSection;
  }

  public setCurrentSection(section: 'preproc' | 'postproc'): void {
    this.currentSection = section;
    this.eventEmitter.fire({
      type: 'component',
      action: 'update',
      components: this.getComponents(section)
    });
  }

  public getComponentColor(componentType: string): string {
    // Map component types to colors
    const colorMap: { [key: string]: string } = {
      'CSF': '#4FC3F7',  // Light blue
      'CSV': '#81C784',  // Light green
      'CSL': '#FFB74D',  // Light orange
      'CSD': '#E57373',  // Light red
      'CSP': '#BA68C8',  // Light purple
      'CST': '#4DB6AC',  // Teal
      'CSW': '#FFD54F',  // Amber
      'CSR': '#7986CB',  // Indigo
      'CSE': '#9575CD',  // Deep purple
      'CSN': '#4DD0E1',  // Cyan
      'CSM': '#FF8A65',  // Deep orange
      'CSK': '#A1887F',  // Brown
      'CSH': '#90A4AE',  // Blue grey
      'CSG': '#AED581'   // Light green
    };

    return colorMap[componentType] || '#9E9E9E'; // Default to grey if type not found
  }

  // =================================================================
  // STATIC INJECTION METHOD
  // =================================================================
  public static inject(): string {
    return `
      // Custom EventEmitter for webview
      class WebviewEventEmitter {
        constructor() {
          this.listeners = [];
        }

        event(listener) {
          this.listeners.push(listener);
          return {
            dispose: () => {
              const index = this.listeners.indexOf(listener);
              if (index !== -1) {
                this.listeners.splice(index, 1);
              }
            }
          };
        }

        fire(event) {
          this.listeners.forEach(listener => listener(event));
        }
      }

      // Inject DocumentState as singleton
      window.documentState = (${DocumentState.toString()}).getInstance();
    `;
  }
} 