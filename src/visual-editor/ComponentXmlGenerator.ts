import { VrmComponent } from '../types';

export class ComponentXmlGenerator {
    public generateComponentXml(component: VrmComponent): string {
        let xml = `<c>
            <n>${component.n}</n>
            <t>${component.t}</t>`;

        // Add values section if it exists
        if (component.values) {
            xml += '\n            <values>';
            xml += this.generateValuesSection(component);
            xml += '\n            </values>';
        }

        // Add connections
        xml += this.generateConnections(component.j);

        // Add position and metadata
        xml += this.generatePositionAndMetadata(component);

        xml += '\n        </c>';

        return xml;
    }

    public updateComponentInXml(xmlContent: string, updatedComponent: VrmComponent): string {
        const preprocMatch = xmlContent.match(/<preproc>([\s\S]*?)<\/preproc>/);
        const postprocMatch = xmlContent.match(/<postproc>([\s\S]*?)<\/postproc>/);

        let updatedXml = xmlContent;

        if (preprocMatch && updatedComponent.section === 'preproc') {
            const updatedPreproc = this.updateComponentInSection(preprocMatch[1], updatedComponent);
            updatedXml = updatedXml.replace(preprocMatch[1], updatedPreproc);
        }

        if (postprocMatch && updatedComponent.section === 'postproc') {
            const updatedPostproc = this.updateComponentInSection(postprocMatch[1], updatedComponent);
            updatedXml = updatedXml.replace(postprocMatch[1], updatedPostproc);
        }

        return updatedXml;
    }

    public deleteComponentFromXml(xmlContent: string, componentToDelete: VrmComponent): string {
        try {
            console.log(`Attempting to delete component ${componentToDelete.n} from ${componentToDelete.section} section`);

            // Extract the appropriate section
            const sectionPattern = componentToDelete.section === 'preproc' ?
                /<preproc>([\s\S]*?)<\/preproc>/ :
                /<postproc>([\s\S]*?)<\/postproc>/;

            const sectionMatch = xmlContent.match(sectionPattern);
            if (!sectionMatch) {
                console.warn(`Could not find ${componentToDelete.section} section in XML`);
                return xmlContent;
            }

            const sectionContent = sectionMatch[1];
            const updatedSectionContent = this.deleteComponentFromSection(sectionContent, componentToDelete.n);

            // Replace the section content in the full XML
            const updatedXml = xmlContent.replace(sectionContent, updatedSectionContent);

            console.log(`Component ${componentToDelete.n} successfully removed from XML`);
            return updatedXml;

        } catch (error) {
            console.error('Error deleting component from XML:', error);
            return xmlContent; // Return original content if deletion fails
        }
    }

    private deleteComponentFromSection(sectionContent: string, componentId: number): string {
        // More robust component deletion pattern
        // This pattern captures the entire component block including surrounding whitespace
        const componentPattern = new RegExp(
            `\\s*<c>\\s*<n>${componentId}</n>[\\s\\S]*?</c>(?:\\s*\\n)?`,
            'g'
        );

        const updatedContent = sectionContent.replace(componentPattern, '');

        // Log for debugging
        if (updatedContent === sectionContent) {
            console.warn(`Component ${componentId} was not found in section content`);
        } else {
            console.log(`Component ${componentId} successfully removed from section`);
        }

        return updatedContent;
    }

    private generateValuesSection(component: VrmComponent): string {
        if (!component.values) return '';

        switch (component.t) {
            case 'CSF':
                return this.generateCsfValues(component);
            case 'SQLTRN':
                return this.generateSqlTrnValues(component);
            case 'MATH':
                return this.generateMathValues(component);
            case 'TEMPLATE':
                return this.generateTemplateValues(component);
            case 'INSERTUPDATEQUERY':
            case 'SELECTQUERY':
                return this.generateQueryValues(component);
            case 'SCRIPT':
                return this.generateScriptValues(component);
            case 'ERROR':
                return this.generateErrorValues(component);
            case 'IF':
                return this.generateIfValues(component);
            case 'SET':
                return this.generateSetValues(component);
            case 'EXTERNAL':
                return this.generateExternalValues(component);
            default:
                return this.generateLegacyValues(component);
        }
    }

    private generateCsfValues(component: VrmComponent): string {
        if (!component.values) return '';

        let valuesXml = '';

        // Function name (first n tag)
        valuesXml += `\n                <n>${component.values.functionName || ''}</n>`;

        // Return value (first v tag)
        const returnValue = component.values.returnValue || '';
        if (returnValue) {
            valuesXml += `\n                <v><![CDATA[${returnValue}]]></v>`;
        } else {
            valuesXml += `\n                <v />`;
        }

        // Function parameters (alternating n/v pairs)
        if (component.values.functionParams) {
            component.values.functionParams.forEach(param => {
                valuesXml += `\n                <n>${param.label}</n>`;
                if (param.value) {
                    valuesXml += `\n                <v><![CDATA[${param.value}]]></v>`;
                } else {
                    valuesXml += `\n                <v />`;
                }
            });
        }

        return valuesXml;
    }

    private generateSqlTrnValues(component: VrmComponent): string {
        if (!component.values) return '';

        let valuesXml = '';

        // Transaction name (n tag)
        const transactionName = component.values.transactionName || '';
        if (transactionName) {
            valuesXml += `\n                <n>${transactionName}</n>`;
        } else {
            valuesXml += `\n                <n />`;
        }

        // Transaction type (t tag)
        const transactionType = component.values.transactionType || '';
        if (transactionType) {
            valuesXml += `\n                <t>${transactionType}</t>`;
        } else {
            valuesXml += `\n                <t />`;
        }

        return valuesXml;
    }

    private generateMathValues(component: VrmComponent): string {
        if (!component.values) return '';

        let valuesXml = '';

        // Name (n tag)
        const mathName = component.values.mathName || '';
        if (mathName) {
            valuesXml += `\n                <n>${mathName}</n>`;
        } else {
            valuesXml += `\n                <n />`;
        }

        // Format (f tag)
        const mathFormat = component.values.mathFormat || '';
        if (mathFormat) {
            valuesXml += `\n                <f>${mathFormat}</f>`;
        } else {
            valuesXml += `\n                <f />`;
        }

        // Parameter (v tag)
        const mathParam = component.values.mathParam || '';
        if (mathParam) {
            valuesXml += `\n                <v>${mathParam}</v>`;
        } else {
            valuesXml += `\n                <v />`;
        }

        return valuesXml;
    }

    private generateTemplateValues(component: VrmComponent): string {
        if (!component.values) return '';

        let valuesXml = '';

        // Template name (n tag)
        const templateName = component.values.templateName || '';
        if (templateName) {
            valuesXml += `\n                <n>${templateName}</n>`;
        } else {
            valuesXml += `\n                <n />`;
        }

        // Template target (t tag)
        const templateTarget = component.values.templateTarget || '';
        if (templateTarget) {
            valuesXml += `\n                <t>${templateTarget}</t>`;
        } else {
            valuesXml += `\n                <t />`;
        }

        return valuesXml;
    }

    private generateQueryValues(component: VrmComponent): string {
        if (!component.values) return '';

        let valuesXml = '';

        // Query (with CDATA if content exists, empty tag if not)
        const query = component.values.query || '';
        if (query) {
            valuesXml += `\n                <query><![CDATA[${query}]]></query>`;
        } else {
            valuesXml += `\n                <query />`;
        }

        // Parameters
        if (component.values.params) {
            component.values.params.forEach(param => {
                valuesXml += `\n                <param>`;
                valuesXml += `\n                    <n>${param.name}</n>`;
                valuesXml += `\n                    <t>${param.type}</t>`;
                valuesXml += `\n                    <v><![CDATA[${param.value}]]></v>`;
                valuesXml += `\n                </param>`;
            });
        }

        return valuesXml;
    }

    private generateScriptValues(component: VrmComponent): string {
        if (!component.values) return '';

        let valuesXml = '';

        // Script content (v tag)
        const script = component.values.script || '';
        if (script) {
            valuesXml += `\n                <v><![CDATA[${script}]]></v>`;
        } else {
            valuesXml += `\n                <v />`;
        }

        // Language (lng tag)
        const language = component.values.language || '';
        if (language) {
            valuesXml += `\n                <lng>${language}</lng>`;
        } else {
            valuesXml += `\n                <lng />`;
        }

        return valuesXml;
    }

    private generateErrorValues(component: VrmComponent): string {
        if (!component.values) return '';

        const errorMessage = component.values.errorMessage || '';
        if (errorMessage) {
            return `\n                <v><![CDATA[${errorMessage}]]></v>`;
        } else {
            return `\n                <v />`;
        }
    }

    private generateIfValues(component: VrmComponent): string {
        if (!component.values) return '';

        const condition = component.values.condition || '';
        if (condition) {
            return `\n                <v><![CDATA[${condition}]]></v>`;
        } else {
            return `\n                <v><![CDATA[]]></v>`;
        }
    }

    private generateSetValues(component: VrmComponent): string {
        if (!component.values || !component.values.variables) return '';

        let valuesXml = '';

        // Variables (alternating n/v pairs)
        component.values.variables.forEach(variable => {
            const name = variable.name || '';
            const value = variable.value || '';

            if (name) {
                valuesXml += `\n                <n><![CDATA[${name}]]></n>`;
            } else {
                valuesXml += `\n                <n />`;
            }

            if (value) {
                valuesXml += `\n                <v><![CDATA[${value}]]></v>`;
            } else {
                valuesXml += `\n                <v />`;
            }
        });

        return valuesXml;
    }

    private generateExternalValues(component: VrmComponent): string {
        if (!component.values) return '';

        const externalValue = component.values.externalValue || '';
        if (externalValue) {
            return `\n                <v>${externalValue}</v>`;
        } else {
            return `\n                <v />`;
        }
    }

    private generateLegacyValues(component: VrmComponent): string {
        if (!component.values) return '';

        let valuesXml = '';

        // Legacy conditions
        if (component.values.conditions) {
            component.values.conditions.forEach((condition: string) => {
                valuesXml += `\n                <v><![CDATA[${condition}]]></v>`;
            });
        }

        // Legacy query
        if (component.values.query) {
            valuesXml += `\n                <query><![CDATA[${component.values.query}]]></query>`;
        }

        // Legacy parameters
        if (component.values.params) {
            component.values.params.forEach((param: any) => {
                valuesXml += `\n                <param>`;
                valuesXml += `\n                    <n>${param.name}</n>`;
                valuesXml += `\n                    <t>${param.type}</t>`;
                valuesXml += `\n                    <v><![CDATA[${param.value}]]></v>`;
                valuesXml += `\n                </param>`;
            });
        }

        return valuesXml;
    }

    private generateConnections(jumps: number[]): string {
        let connectionsXml = '';

        jumps.forEach((jump: number) => {
            if (jump > 0) {
                connectionsXml += `\n            <j>${jump}</j>`;
            } else {
                connectionsXml += '\n            <j />';
            }
        });

        return connectionsXml;
    }

    private generatePositionAndMetadata(component: VrmComponent): string {
        let xml = `\n            <x>${component.x}</x>`;
        xml += `\n            <y>${component.y}</y>`;

        // Comment - use <c/> for empty, <c>content</c> for content
        if (component.c) {
            xml += `\n            <c>${component.c}</c>`;
        } else {
            xml += `\n            <c />`;
        }

        // Watchpoint - handle three states: null (<wp/>), false (<wp>0</wp>), true (<wp>1</wp>)
        if (component.wp === null) {
            xml += `\n            <wp />`;
        } else {
            xml += `\n            <wp>${component.wp ? '1' : '0'}</wp>`;
        }

        return xml;
    }

    private updateComponentInSection(sectionContent: string, updatedComponent: VrmComponent): string {
        // Find the specific component by ID
        const componentRegex = new RegExp(`<c>\\s*<n>${updatedComponent.n}</n>[\\s\\S]*?</c>`, 'g');

        return sectionContent.replace(componentRegex, (match) => {
            return this.generateComponentXml(updatedComponent);
        });
    }
}