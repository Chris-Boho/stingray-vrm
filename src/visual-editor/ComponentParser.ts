import { VrmComponent } from './VrmComponent';

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
                const wpMatch = afterMatch.match(/^\s*<wp>\d+<\/wp>\s*<\/c>/);
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
            const wpMatch = componentXml.match(/<wp>([01])<\/wp>/);

            // Extract comment (look for <c>content</c> that comes after <y> and before <wp>)
            let comment = '';
            const commentPattern = /<y>\d+<\/y>\s*<c>([^<]*)<\/c>\s*<wp>/;
            const commentMatch = componentXml.match(commentPattern);

            if (commentMatch) {
                comment = commentMatch[1].trim();
            }

            // Extract jump connections
            const jMatches = componentXml.match(/<j>(\d*)<\/j>/g);
            const jumps: number[] = [];
            if (jMatches) {
                jMatches.forEach(jMatch => {
                    const jValue = jMatch.match(/<j>(\d*)<\/j>/);
                    if (jValue && jValue[1] !== '') {
                        jumps.push(parseInt(jValue[1]));
                    }
                });
            }

            // Extract values section
            let values = null;
            const valuesMatch = componentXml.match(/<values>([\s\S]*?)<\/values>/);
            if (valuesMatch) {
                values = this.parseValues(valuesMatch[1]);
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
                wp: wpMatch ? wpMatch[1] === '1' : false,
                section: 'preproc' // Will be overridden by caller
            };
        } catch (error) {
            console.error('Error parsing component XML:', error);
            return null;
        }
    }

    private parseValues(valuesContent: string): any {
        // Parse different types of values (this can be expanded)
        const result: any = {};

        // Parse <v> tags with CDATA
        const vMatches = valuesContent.match(/<v><!\[CDATA\[([\s\S]*?)\]\]><\/v>/g);
        if (vMatches) {
            result.conditions = vMatches.map(vMatch => {
                const cdataMatch = vMatch.match(/<v><!\[CDATA\[([\s\S]*?)\]\]><\/v>/);
                return cdataMatch ? cdataMatch[1] : '';
            });
        }

        // Parse query tags
        const queryMatch = valuesContent.match(/<query><!\[CDATA\[([\s\S]*?)\]\]><\/query>/);
        if (queryMatch) {
            result.query = queryMatch[1];
        }

        // Parse param tags
        const paramMatches = valuesContent.match(/<param>[\s\S]*?<\/param>/g);
        if (paramMatches) {
            result.params = paramMatches.map(paramXml => {
                const nameMatch = paramXml.match(/<n>([^<]+)<\/n>/);
                const typeMatch = paramXml.match(/<t>([^<]+)<\/t>/);
                const valueMatch = paramXml.match(/<v><!\[CDATA\[([\s\S]*?)\]\]><\/v>/);

                return {
                    name: nameMatch ? nameMatch[1] : '',
                    type: typeMatch ? typeMatch[1] : '',
                    value: valueMatch ? valueMatch[1] : ''
                };
            });
        }

        return Object.keys(result).length > 0 ? result : null;
    }
}