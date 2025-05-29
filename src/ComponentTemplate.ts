// Enhanced Component Templates
import { VrmComponent } from './types'

// =================================================================
// COMPONENT TEMPLATES - Based on blank component specifications
// =================================================================

export class ComponentTemplates {
    
    // Generate next available component ID for a given section
    public static getNextComponentId(existingComponents: VrmComponent[]): number {
        if (existingComponents.length === 0) return 1;
        
        const usedIds = existingComponents.map(c => c.n);
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
    
    // SQLTRN - SQL Transaction Component (blank)
    public static createSqlTransactionComponent(section: 'preproc' | 'postproc', existingComponents: VrmComponent[], x: number, y: number): VrmComponent {
        return {
            n: this.getNextComponentId(existingComponents),
            t: 'SQLTRN',
            values: {
                transactionName: '',  // Empty n tag
                transactionType: ''   // Empty t tag
            },
            j: [0, 0],  // Empty j tags
            x: x,
            y: y,
            c: '',      // <c/> - empty comment
            wp: null,   // <wp/> - no watchpoint
            section: section
        };
    }
    
    // CSF - Script Function Component (blank)
    public static createCsfComponent(section: 'preproc' | 'postproc', existingComponents: VrmComponent[], x: number, y: number): VrmComponent {
        return {
            n: this.getNextComponentId(existingComponents),
            t: 'CSF',
            values: {
                functionName: 'GetConstant',  // Default function name as shown in blank example
                returnValue: '',              // Empty v tag for user entry
                functionParams: []            // No additional parameters initially
            },
            j: [0, 0],
            x: x,
            y: y,
            c: '',      // <c/> - empty comment tag
            wp: null,   // <wp/> - no watchpoint set
            section: section
        };
    }
    
    // SCRIPT - Scripting Component (blank)
    public static createScriptComponent(section: 'preproc' | 'postproc', existingComponents: VrmComponent[], x: number, y: number): VrmComponent {
        return {
            n: this.getNextComponentId(existingComponents),
            t: 'SCRIPT',
            values: {
                script: '',      // Empty v tag
                language: ''     // Empty lng tag
            },
            j: [0, 0],
            x: x,
            y: y,
            c: '',      // <c/>
            wp: null,   // <wp/>
            section: section
        };
    }
    
    // ERROR - Error Component (blank)  
    public static createErrorComponent(section: 'preproc' | 'postproc', existingComponents: VrmComponent[], x: number, y: number): VrmComponent {
        return {
            n: this.getNextComponentId(existingComponents),
            t: 'ERROR',
            values: {
                errorMessage: ''  // Empty v tag
            },
            j: [0, 0],
            x: x,
            y: y,
            c: '',      // <c/>
            wp: null,   // <wp/>
            section: section
        };
    }
    
    // IF - IF Component (blank)
    public static createIfComponent(section: 'preproc' | 'postproc', existingComponents: VrmComponent[], x: number, y: number): VrmComponent {
        return {
            n: this.getNextComponentId(existingComponents),
            t: 'IF',
            values: {
                condition: ''  // Empty CDATA in v tag
            },
            j: [0, 0],
            x: x,
            y: y,
            c: '',        // <c/> (note: your blank example shows <c></c> for IF, but you requested <c/>)
            wp: false,    // <wp>0</wp> - explicitly set to false/0
            section: section
        };
    }
    
    // MATH - Math Component (blank)
    public static createMathComponent(section: 'preproc' | 'postproc', existingComponents: VrmComponent[], x: number, y: number): VrmComponent {
        return {
            n: this.getNextComponentId(existingComponents),
            t: 'MATH',
            values: {
                mathName: '',     // Empty n tag
                mathFormat: '',   // Empty f tag
                mathParam: ''     // Empty v tag
            },
            j: [0, 0],
            x: x,
            y: y,
            c: '',      // <c/>
            wp: null,   // <wp/>
            section: section
        };
    }
    
    // SET - Multi-Set Component (blank)
    public static createMultiSetComponent(section: 'preproc' | 'postproc', existingComponents: VrmComponent[], x: number, y: number): VrmComponent {
        return {
            n: this.getNextComponentId(existingComponents),
            t: 'SET',
            values: {
                variables: [
                    { name: '', value: '' }  // One empty n/v pair to start
                ]
            },
            j: [0, 0],
            x: x,
            y: y,
            c: '',      // <c/>
            wp: null,   // <wp/>
            section: section
        };
    }
    
    // EXTERNAL - External Component (blank)
    public static createExternalComponent(section: 'preproc' | 'postproc', existingComponents: VrmComponent[], x: number, y: number): VrmComponent {
        return {
            n: this.getNextComponentId(existingComponents),
            t: 'EXTERNAL',
            values: {
                externalValue: ''  // Empty v tag (displayed as "Rule name" in UI)
            },
            j: [0, 0],
            x: x,
            y: y,
            c: '',      // <c/>
            wp: null,   // <wp/>
            section: section
        };
    }
    
    // TEMPLATE - Template Component (blank)
    public static createTemplateComponent(section: 'preproc' | 'postproc', existingComponents: VrmComponent[], x: number, y: number): VrmComponent {
        return {
            n: this.getNextComponentId(existingComponents),
            t: 'TEMPLATE',
            values: {
                templateName: '',    // Empty n tag
                templateTarget: ''   // Empty t tag
            },
            j: [0, 0],
            x: x,
            y: y,
            c: '',      // <c/>
            wp: null,   // <wp/>
            section: section
        };
    }
    
    // INSERTUPDATEQUERY - Insert/Update Query Component (blank)
    public static createInsertUpdateQueryComponent(section: 'preproc' | 'postproc', existingComponents: VrmComponent[], x: number, y: number): VrmComponent {
        return {
            n: this.getNextComponentId(existingComponents),
            t: 'INSERTUPDATEQUERY',
            values: {
                query: '',       // Empty query - will generate <query />
                params: []       // No parameters initially
            },
            j: [0, 0],
            x: x,
            y: y,
            c: '',      // <c/>
            wp: null,   // <wp/>
            section: section
        };
    }
    
    // SELECTQUERY - Select Query Component (blank)
    public static createSelectQueryComponent(section: 'preproc' | 'postproc', existingComponents: VrmComponent[], x: number, y: number): VrmComponent {
        return {
            n: this.getNextComponentId(existingComponents),
            t: 'SELECTQUERY',
            values: {
                query: '',       // Empty query - will generate <query />
                params: []       // No parameters initially  
            },
            j: [0, 0],
            x: x,
            y: y,
            c: '',      // <c/>
            wp: null,   // <wp/>
            section: section
        };
    }
    
    // Factory method to create any component type
    public static createComponent(componentType: string, section: 'preproc' | 'postproc', existingComponents: VrmComponent[], x: number, y: number): VrmComponent {
        switch (componentType) {
            case 'SQLTRN':
                return this.createSqlTransactionComponent(section, existingComponents, x, y);
            case 'CSF':
                return this.createCsfComponent(section, existingComponents, x, y);
            case 'SCRIPT':
                return this.createScriptComponent(section, existingComponents, x, y);
            case 'ERROR':
                return this.createErrorComponent(section, existingComponents, x, y);
            case 'IF':
                return this.createIfComponent(section, existingComponents, x, y);
            case 'MATH':
                return this.createMathComponent(section, existingComponents, x, y);
            case 'SET':
                return this.createMultiSetComponent(section, existingComponents, x, y);
            case 'EXTERNAL':
                return this.createExternalComponent(section, existingComponents, x, y);
            case 'TEMPLATE':
                return this.createTemplateComponent(section, existingComponents, x, y);
            case 'INSERTUPDATEQUERY':
                return this.createInsertUpdateQueryComponent(section, existingComponents, x, y);
            case 'SELECTQUERY':
                return this.createSelectQueryComponent(section, existingComponents, x, y);
            default:
                throw new Error(`Unknown component type: ${componentType}`);
        }
    }
}

// =================================================================
// XML GENERATION UTILITIES
// =================================================================

export class ComponentXmlGenerator {
    
    // Generate XML for CSF component
    private static generateCsfXml(component: VrmComponent): string {
        if (!component.values) return '';
        
        let valuesXml = `<n>${component.values.functionName || ''}</n>`;
        valuesXml += `<v><![CDATA[${component.values.returnValue || ''}]]></v>`;
        
        if (component.values.functionParams) {
            component.values.functionParams.forEach(param => {
                valuesXml += `<n>${param.label}</n>`;
                valuesXml += `<v><![CDATA[${param.value}]]></v>`;
            });
        }
        
        return valuesXml;
    }
    
    // Generate XML for SQLTRN component
    private static generateSqlTrnXml(component: VrmComponent): string {
        if (!component.values) return '';
        
        let valuesXml = `<n>${component.values.transactionName || ''}</n>`;
        valuesXml += `<t>${component.values.transactionType || 'Begin'}</t>`;
        
        return valuesXml;
    }
    
    // Generate XML for MATH component
    private static generateMathXml(component: VrmComponent): string {
        if (!component.values) return '';
        
        let valuesXml = `<n>${component.values.mathName || ''}</n>`;
        valuesXml += `<f>${component.values.mathFormat || 'INTEGER'}</f>`;
        valuesXml += `<v>${component.values.mathParam || ''}</v>`;
        
        return valuesXml;
    }
    
    // Generate XML for TEMPLATE component
    private static generateTemplateXml(component: VrmComponent): string {
        if (!component.values) return '';
        
        let valuesXml = `<n>${component.values.templateName || ''}</n>`;
        valuesXml += `<t>${component.values.templateTarget || ''}</t>`;
        
        return valuesXml;
    }
    
    // Generate XML for query-based components (INSERTUPDATEQUERY, SELECTQUERY)
    private static generateQueryXml(component: VrmComponent): string {
        if (!component.values) return '';
        
        let valuesXml = component.values.query ? 
            `<query><![CDATA[${component.values.query}]]></query>` : 
            `<query />`;
        
        if (component.values.params) {
            component.values.params.forEach(param => {
                valuesXml += `<param>`;
                valuesXml += `<n>${param.name}</n>`;
                valuesXml += `<t>${param.type}</t>`;
                valuesXml += `<v><![CDATA[${param.value}]]></v>`;
                valuesXml += `</param>`;
            });
        }
        
        return valuesXml;
    }
    
    // Generate XML for SCRIPT component
    private static generateScriptXml(component: VrmComponent): string {
        if (!component.values) return '';
        
        let valuesXml = `<v><![CDATA[${component.values.script || ''}]]></v>`;
        valuesXml += `<lng>${component.values.language || 'Pascal'}</lng>`;
        
        return valuesXml;
    }
    
    // Generate XML for ERROR component
    private static generateErrorXml(component: VrmComponent): string {
        if (!component.values) return '';
        return `<v><![CDATA[${component.values.errorMessage || ''}]]></v>`;
    }
    
    // Generate XML for IF component
    private static generateIfXml(component: VrmComponent): string {
        if (!component.values) return '';
        return `<v><![CDATA[${component.values.condition || ''}]]></v>`;
    }
    
    // Generate XML for SET component
    private static generateSetXml(component: VrmComponent): string {
        if (!component.values || !component.values.variables) return '';
        
        let valuesXml = '';
        component.values.variables.forEach(variable => {
            valuesXml += `<n><![CDATA[${variable.name}]]></n>`;
            valuesXml += `<v><![CDATA[${variable.value}]]></v>`;
        });
        
        return valuesXml;
    }
    
    // Generate XML for EXTERNAL component
    private static generateExternalXml(component: VrmComponent): string {
        if (!component.values) return '';
        return `<n>${component.values.externalValue || ''}</n>`;
    }
    
    // Main method to generate values XML based on component type
    public static generateValuesXml(component: VrmComponent): string {
        switch (component.t) {
            case 'CSF':
                return this.generateCsfXml(component);
            case 'SQLTRN':
                return this.generateSqlTrnXml(component);
            case 'MATH':
                return this.generateMathXml(component);
            case 'TEMPLATE':
                return this.generateTemplateXml(component);
            case 'INSERTUPDATEQUERY':
            case 'SELECTQUERY':
                return this.generateQueryXml(component);
            case 'SCRIPT':
                return this.generateScriptXml(component);
            case 'ERROR':
                return this.generateErrorXml(component);
            case 'IF':
                return this.generateIfXml(component);
            case 'SET':
                return this.generateSetXml(component);
            case 'EXTERNAL':
                return this.generateExternalXml(component);
            default:
                return '';
        }
    }
}