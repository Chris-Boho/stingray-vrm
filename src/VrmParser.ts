export class VrmParser {
    constructor(private content: string) { }

    public extractHtml(): string {
        // Extract content from <html><![CDATA[...]]></html>
        const htmlMatch = this.content.match(/<html><!\[CDATA\[([\s\S]*?)\]\]><\/html>/);
        if (!htmlMatch) {
            return ''; // Return empty string if no HTML content found
        }

        let htmlContent = htmlMatch[1];

        // Remove the js-component div and its contents from HTML editor
        // This ensures HTML editor only shows HTML content
        htmlContent = htmlContent.replace(/<div[^>]*class="js-component"[^>]*>[\s\S]*?<\/div>/g, '');

        return htmlContent.trim();
    }

    public extractJavaScript(): string {
        // Extract JavaScript from the js-component div
        const jsMatch = this.content.match(/<div[^>]*class="js-component"[^>]*>[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>[\s\S]*?<\/div>/);
        if (!jsMatch) {
            return ''; // Return empty string if no JavaScript content found
        }

        // Decode HTML entities
        return jsMatch[1]
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();
    }

    public updateHtml(newHtml: string): string {
        try {
            // Get the original full HTML content
            const htmlMatch = this.content.match(/<html><!\[CDATA\[([\s\S]*?)\]\]><\/html>/);
            if (!htmlMatch) {
                // If no HTML section exists, create one
                const jsContent = this.extractJavaScript();
                const jsDiv = jsContent ? `<div ref="js" mp-id="1" class="js-component" style=""><pre>${this.encodeHtmlEntities(jsContent)}</pre></div>` : '';
                const newHtmlSection = `<html><![CDATA[${newHtml}\n${jsDiv}]]></html>`;
                return this.content.replace(/<\/vrm>/, `${newHtmlSection}\n</vrm>`);
            }

            // Preserve the js-component div if it exists
            const jsMatch = htmlMatch[1].match(/<div[^>]*class="js-component"[^>]*>[\s\S]*?<\/div>/);
            const jsDiv = jsMatch ? jsMatch[0] : '';

            // Update the HTML content while preserving the js-component div
            const updatedHtml = `${newHtml}\n${jsDiv}`;
            return this.content.replace(/(<html><!\[CDATA\[)[\s\S]*?(\]\]><\/html>)/, `$1${updatedHtml}$2`);
        } catch (error) {
            console.error('Error updating HTML:', error);
            throw new Error(`Failed to update HTML content: ${error}`);
        }
    }

    public updateJavaScript(newJs: string): string {
        try {
            // Get the original full HTML content
            const htmlMatch = this.content.match(/<html><!\[CDATA\[([\s\S]*?)\]\]><\/html>/);
            if (!htmlMatch) {
                throw new Error('No HTML content found in VRM file');
            }

            const fullHtmlContent = htmlMatch[1];
            const encodedJs = this.encodeHtmlEntities(newJs);

            // Update or create the js-component div
            const jsRegex = /<div[^>]*class="js-component"[^>]*>[\s\S]*?<\/div>/;
            let updatedHtml;

            if (jsRegex.test(fullHtmlContent)) {
                // Update existing js-component div
                updatedHtml = fullHtmlContent.replace(jsRegex, `<div ref="js" mp-id="1" class="js-component" style=""><pre>${encodedJs}</pre></div>`);
            } else {
                // Create new js-component div
                updatedHtml = `${fullHtmlContent}\n<div ref="js" mp-id="1" class="js-component" style=""><pre>${encodedJs}</pre></div>`;
            }

            // Update the full VRM content
            return this.content.replace(/(<html><!\[CDATA\[)[\s\S]*?(\]\]><\/html>)/, `$1${updatedHtml}$2`);
        } catch (error) {
            console.error('Error updating JavaScript:', error);
            throw new Error(`Failed to update JavaScript content: ${error}`);
        }
    }

    private encodeHtmlEntities(content: string): string {
        return content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    public getFullContent(): string {
        return this.content;
    }
}