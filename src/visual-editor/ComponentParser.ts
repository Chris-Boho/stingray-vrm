import { VrmComponent, ComponentValues, ComponentParameter, CsfParameter, SetVariable } from '../types';

export class ComponentParser {
    public parseComponents(xmlContent: string): VrmComponent[] {
        // Parse preproc and postproc sections separately
        const preprocMatch = xmlContent.match(/<preproc>([\s\S]*?)<\/preproc>/);
        const postprocMatch = xmlContent.match(/<postproc>([\s\S]*?)<\/postproc>/);

        const preprocComponents: VrmComponent[] = [];
        const postprocComponents: VrmComponent[] = [];

        if (preprocMatch) {
            const components = this.parseComponentSection(preprocMatch[1], 'preproc');
            preprocComponents.push(...components);
        }

        if (postprocMatch) {
            const components = this.parseComponentSection(postprocMatch[1], 'postproc');
            postprocComponents.push(...components);
        }

        // Return combined list
        return [...preprocComponents, ...postprocComponents];
    }

    public parseComponentSection(sectionContent: string, sectionType: 'preproc' | 'postproc'): VrmComponent[] {
        const components: VrmComponent[] = [];

        const componentXmls = this.extractComponents(sectionContent);

        componentXmls.forEach((componentXml) => {
            try {
                const component = this.parseComponent(componentXml);
                if (component) {
                    component.section = sectionType; // Mark the section
                    components.push(component);
                }
            } catch (error) {
                console.error('Error parsing component:', error);
            }
        });

        return components;
    }

    private extractComponents(xmlContent: string): string[] {
        const components: string[] = [];

        // Simple approach: split by component boundaries
        const componentPattern = /<c>[\s\S]*?<\/c>/g;
        let match;

        while ((match = componentPattern.exec(xmlContent)) !== null) {
            let componentXml = match[0];

            // Check if this component has nested <c> tags (comment tags)
            // If it has a comment pattern <y>number</y> followed by <c>comment</c> followed by <wp>
            const hasCommentPattern = /<y>\d+<\/y>\s*<c>[^<]*<\/c>\s*<wp>/.test(componentXml);

            if (!hasCommentPattern) {
                // This might be a component that got cut off at the comment tag
                // Try to extend it to include the wp tag
                const afterMatch = xmlContent.substring(componentPattern.lastIndex);
                const wpMatch = afterMatch.match(/^\s*<wp>[\s\S]*?<\/wp>\s*<\/c>/);
                if (wpMatch) {
                    componentXml += wpMatch[0];
                    // Update the lastIndex to skip the extended part
                    componentPattern.lastIndex += wpMatch[0].length;
                }
            }
            components.push(componentXml);
        }

        return components;
    }

    private parseComponent(componentXml: string): VrmComponent | null {
        try {
            // Extract basic component data directly from the full XML
            const nMatch = componentXml.match(/<n>(\d+)<\/n>/);
            const tMatch = componentXml.match(/<t>([^<]+)<\/t>/);
            const xMatch = componentXml.match(/<x>(\d+)<\/x>/);
            const yMatch = componentXml.match(/<y>(\d+)<\/y>/);
            
            // Handle watchpoint parsing - can be <wp/>, <wp></wp>, <wp>0</wp>, or <wp>1</wp>
            let watchpoint: boolean | null = null;
            const wpEmptyMatch = componentXml.match(/<wp\s*\/>/);
            const wpEmptyTagMatch = componentXml.match(/<wp><\/wp>/);
            const wpValueMatch = componentXml.match(/<wp>([01])<\/wp>/);
            
            if (wpEmptyMatch || wpEmptyTagMatch) {
                watchpoint = null; // <wp/> or <wp></wp>
            } else if (wpValueMatch) {
                watchpoint = wpValueMatch[1] === '1'; // <wp>0</wp> or <wp>1</wp>
            }

            // Extract comment (look for <c>content</c> that comes after <y> and before <wp>)
            let comment = '';
            const commentPattern = /<y>\d+<\/y>\s*<c>([^<]*)<\/c>\s*<wp>/;
            const commentMatch = componentXml.match(commentPattern);
            
            // Also check for direct <c> tag
            const directCommentMatch = componentXml.match(/<c>([^<]*)<\/c>/);
            if (commentMatch) {
                comment = commentMatch[1].trim();
            } else if (directCommentMatch) {
                comment = directCommentMatch[1].trim();
            }

            // Extract jump connections
            const jMatches = componentXml.match(/<j>(\d*)<\/j>/g);
            const jumps: number[] = [];
            if (jMatches) {
                jMatches.forEach(jMatch => {
                    const jValue = jMatch.match(/<j>(\d*)<\/j>/);
                    if (jValue && jValue[1] !== '') {
                        jumps.push(parseInt(jValue[1]));
                    } else {
                        jumps.push(0); // Empty j tag
                    }
                });
            }
            
            // Ensure we have at least 2 jump connections
            while (jumps.length < 2) {
                jumps.push(0);
            }

            // Extract values section based on component type
            let values: ComponentValues | undefined = undefined;
            const valuesMatch = componentXml.match(/<values>([\s\S]*?)<\/values>/);
            if (valuesMatch && tMatch) {
                values = this.parseValuesByType(valuesMatch[1], tMatch[1]);
            }

            if (!nMatch || !tMatch || !xMatch || !yMatch) {
                return null;
            }

            return {
                n: parseInt(nMatch[1]),
                t: tMatch[1],
                values: values,
                j: jumps,
                x: parseInt(xMatch[1]),
                y: parseInt(yMatch[1]),
                c: comment,
                wp: watchpoint,
                section: 'preproc' // Will be overridden by caller
            };
        } catch (error) {
            console.error('Error parsing component XML:', error);
            return null;
        }
    }

    private parseValuesByType(valuesContent: string, componentType: string): ComponentValues {
        const values: ComponentValues = {};

        switch (componentType) {
            case 'CSF':
                this.parseCsfValues(valuesContent, values);
                break;
            case 'SQLTRN':
                this.parseSqlTrnValues(valuesContent, values);
                break;
            case 'MATH':
                this.parseMathValues(valuesContent, values);
                break;
            case 'TEMPLATE':
                this.parseTemplateValues(valuesContent, values);
                break;
            case 'INSERTUPDATEQUERY':
            case 'SELECTQUERY':
                this.parseQueryValues(valuesContent, values);
                break;
            case 'SCRIPT':
                this.parseScriptValues(valuesContent, values);
                break;
            case 'ERROR':
                this.parseErrorValues(valuesContent, values);
                break;
            case 'IF':
                this.parseIfValues(valuesContent, values);
                break;
            case 'SET':
                this.parseSetValues(valuesContent, values);
                break;
            case 'EXTERNAL':
                this.parseExternalValues(valuesContent, values);
                break;
            default:
                // Fallback to legacy parsing for unknown types
                this.parseLegacyValues(valuesContent, values);
                break;
        }

        return values;
    }

    private parseCsfValues(valuesContent: string, values: ComponentValues): void {
        // CSF format: alternating n/v pairs
        // First n is function name, first v is return value
        // Subsequent n/v pairs are parameters
        const nMatches = valuesContent.match(/<n>([^<]*)<\/n>/g);
        const vMatches = valuesContent.match(/<v>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/v>/g);

        if (nMatches && nMatches.length > 0) {
            // First n tag is function name
            const functionNameMatch = nMatches[0].match(/<n>([^<]*)<\/n>/);
            values.functionName = functionNameMatch ? functionNameMatch[1] : '';
        }

        if (vMatches && vMatches.length > 0) {
            // First v tag is return value
            const returnValueMatch = vMatches[0].match(/<v>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/v>/);
            values.returnValue = returnValueMatch ? (returnValueMatch[1] || returnValueMatch[2] || '') : '';
        }

        // Additional n/v pairs are function parameters
        const functionParams: CsfParameter[] = [];
        if (nMatches && vMatches && nMatches.length > 1) {
            for (let i = 1; i < nMatches.length && i < vMatches.length; i++) {
                const labelMatch = nMatches[i].match(/<n>([^<]*)<\/n>/);
                const valueMatch = vMatches[i].match(/<v>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/v>/);
                
                if (labelMatch) {
                    functionParams.push({
                        label: labelMatch[1],
                        value: valueMatch ? (valueMatch[1] || valueMatch[2] || '') : ''
                    });
                }
            }
        }
        values.functionParams = functionParams;
    }

    private parseSqlTrnValues(valuesContent: string, values: ComponentValues): void {
        const nameMatch = valuesContent.match(/<n>([^<]*)<\/n>/);
        const typeMatch = valuesContent.match(/<t>([^<]*)<\/t>/);
        
        values.transactionName = nameMatch ? nameMatch[1] : '';
        values.transactionType = typeMatch ? typeMatch[1] : '';
    }

    private parseMathValues(valuesContent: string, values: ComponentValues): void {
        const nameMatch = valuesContent.match(/<n>([^<]*)<\/n>/);
        const formatMatch = valuesContent.match(/<f>([^<]*)<\/f>/);
        const paramMatch = valuesContent.match(/<v>([^<]*)<\/v>/);
        
        values.mathName = nameMatch ? nameMatch[1] : '';
        values.mathFormat = formatMatch ? formatMatch[1] : '';
        values.mathParam = paramMatch ? paramMatch[1] : '';
    }

    private parseTemplateValues(valuesContent: string, values: ComponentValues): void {
        const nameMatch = valuesContent.match(/<n>([^<]*)<\/n>/);
        const targetMatch = valuesContent.match(/<t>([^<]*)<\/t>/);
        
        values.templateName = nameMatch ? nameMatch[1] : '';
        values.templateTarget = targetMatch ? targetMatch[1] : '';
    }

    private parseQueryValues(valuesContent: string, values: ComponentValues): void {
        // Parse query tag (with or without CDATA)
        const queryMatch = valuesContent.match(/<query>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/query>/);
        const queryEmptyMatch = valuesContent.match(/<query\s*\/>/);
        
        if (queryMatch) {
            values.query = queryMatch[1] || queryMatch[2] || '';
        } else if (queryEmptyMatch) {
            values.query = '';
        }

        // Parse parameters
        const paramMatches = valuesContent.match(/<param>[\s\S]*?<\/param>/g);
        const params: ComponentParameter[] = [];
        
        if (paramMatches) {
            paramMatches.forEach(paramXml => {
                const nameMatch = paramXml.match(/<n>([^<]+)<\/n>/);
                const typeMatch = paramXml.match(/<t>([^<]+)<\/t>/);
                const valueMatch = paramXml.match(/<v>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/v>/);

                if (nameMatch && typeMatch) {
                    params.push({
                        name: nameMatch[1],
                        type: typeMatch[1] as any,
                        value: valueMatch ? (valueMatch[1] || valueMatch[2] || '') : ''
                    });
                }
            });
        }
        values.params = params;
    }

    private parseScriptValues(valuesContent: string, values: ComponentValues): void {
        const scriptMatch = valuesContent.match(/<v>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/v>/);
        const languageMatch = valuesContent.match(/<lng>([^<]*)<\/lng>/);
        
        values.script = scriptMatch ? (scriptMatch[1] || scriptMatch[2] || '') : '';
        values.language = languageMatch ? languageMatch[1] : '';
    }

    private parseErrorValues(valuesContent: string, values: ComponentValues): void {
        const errorMatch = valuesContent.match(/<v>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/v>/);
        values.errorMessage = errorMatch ? (errorMatch[1] || errorMatch[2] || '') : '';
    }

    private parseIfValues(valuesContent: string, values: ComponentValues): void {
        const conditionMatch = valuesContent.match(/<v>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/v>/);
        values.condition = conditionMatch ? (conditionMatch[1] || conditionMatch[2] || '') : '';
    }

    private parseSetValues(valuesContent: string, values: ComponentValues): void {
        // SET format: alternating n/v pairs for variables
        const nMatches = valuesContent.match(/<n>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/n>/g);
        const vMatches = valuesContent.match(/<v>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/v>/g);

        const variables: SetVariable[] = [];
        
        if (nMatches && vMatches) {
            const minLength = Math.min(nMatches.length, vMatches.length);
            for (let i = 0; i < minLength; i++) {
                const nameMatch = nMatches[i].match(/<n>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/n>/);
                const valueMatch = vMatches[i].match(/<v>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/v>/);
                
                if (nameMatch) {
                    variables.push({
                        name: nameMatch[1] || nameMatch[2] || '',
                        value: valueMatch ? (valueMatch[1] || valueMatch[2] || '') : ''
                    });
                }
            }
        }
        values.variables = variables;
    }

    private parseExternalValues(valuesContent: string, values: ComponentValues): void {
        // External component uses v tag for the rule name
        const valueMatch = valuesContent.match(/<v>([^<]*)<\/v>/);
        values.externalValue = valueMatch ? valueMatch[1] : '';
    }

    private parseLegacyValues(valuesContent: string, values: ComponentValues): void {
        // Legacy parsing for backward compatibility
        const vMatches = valuesContent.match(/<v><!\[CDATA\[([\s\S]*?)\]\]><\/v>/g);
        if (vMatches) {
            values.conditions = vMatches.map(vMatch => {
                const cdataMatch = vMatch.match(/<v><!\[CDATA\[([\s\S]*?)\]\]><\/v>/);
                return cdataMatch ? cdataMatch[1] : '';
            });
        }

        const queryMatch = valuesContent.match(/<query><!\[CDATA\[([\s\S]*?)\]\]><\/query>/);
        if (queryMatch) {
            values.query = queryMatch[1];
        }

        const paramMatches = valuesContent.match(/<param>[\s\S]*?<\/param>/g);
        if (paramMatches) {
            const params: ComponentParameter[] = [];
            paramMatches.forEach(paramXml => {
                const nameMatch = paramXml.match(/<n>([^<]+)<\/n>/);
                const typeMatch = paramXml.match(/<t>([^<]+)<\/t>/);
                const valueMatch = paramXml.match(/<v><!\[CDATA\[([\s\S]*?)\]\]><\/v>/);

                if (nameMatch && typeMatch) {
                    params.push({
                        name: nameMatch[1],
                        type: typeMatch[1] as any,
                        value: valueMatch ? valueMatch[1] : ''
                    });
                }
            });
            values.params = params;
        }
    }
}