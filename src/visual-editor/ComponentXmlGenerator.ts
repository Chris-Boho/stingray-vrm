import { VrmComponent } from './VrmComponent';

export class ComponentXmlGenerator {
    public generateComponentXml(component: VrmComponent): string {
        let xml = `<c>
            <n>${component.n}</n>
            <t>${component.t}</t>`;
        
        // Add values section if it exists
        if (component.values) {
            xml += '\n            <values>';
            xml += this.generateValuesSection(component.values);
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

    private generateValuesSection(values: any): string {
        let valuesXml = '';
        
        // Add conditions
        if (values.conditions) {
            values.conditions.forEach((condition: string) => {
                valuesXml += `\n                <v><![CDATA[${condition}]]></v>`;
            });
        }
        
        // Add query
        if (values.query) {
            valuesXml += `\n                <query><![CDATA[${values.query}]]></query>`;
        }
        
        // Add parameters
        if (values.params) {
            values.params.forEach((param: any) => {
                valuesXml += `\n                <param>
                    <n>${param.name}</n>
                    <t>${param.type}</t>
                    <v><![CDATA[${param.value}]]></v>
                </param>`;
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
                connectionsXml += '\n            <j/>';
            }
        });
        
        return connectionsXml;
    }

    private generatePositionAndMetadata(component: VrmComponent): string {
        return `\n            <x>${component.x}</x>
            <y>${component.y}</y>
            <c>${component.c}</c>
            <wp>${component.wp ? '1' : '0'}</wp>`;
    }

    private updateComponentInSection(sectionContent: string, updatedComponent: VrmComponent): string {
        // Find the specific component by ID
        const componentRegex = new RegExp(`<c>\\s*<n>${updatedComponent.n}</n>[\\s\\S]*?</c>`, 'g');
        
        return sectionContent.replace(componentRegex, (match) => {
            return this.generateComponentXml(updatedComponent);
        });
    }
}