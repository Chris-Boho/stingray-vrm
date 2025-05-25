export class VrmParser {
  constructor(private content: string) {}

  public extractHtml(): string {
      // Extract content from <html><![CDATA[...]]></html>
      const htmlMatch = this.content.match(/<html><!\[CDATA\[([\s\S]*?)\]\]><\/html>/);
      if (!htmlMatch) {
          throw new Error('No HTML content found in VRM file');
      }
      
      let htmlContent = htmlMatch[1];
      
      // Remove the js-component div and its contents from HTML editor
      htmlContent = htmlContent.replace(/<div[^>]*class="js-component"[^>]*>[\s\S]*?<\/div>/g, '');
      
      return htmlContent;
  }

  public extractJavaScript(): string {
      try {
          // Get the original HTML content (with js-component div)
          const htmlMatch = this.content.match(/<html><!\[CDATA\[([\s\S]*?)\]\]><\/html>/);
          if (!htmlMatch) {
              return '';
          }
          const fullHtmlContent = htmlMatch[1];
          
          // Look for JavaScript inside <div class="js-component"><pre>...</pre></div>
          const jsMatch = fullHtmlContent.match(/<div[^>]*class="js-component"[^>]*>[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>[\s\S]*?<\/div>/);
          
          if (!jsMatch) {
              // If no js-component div found, return empty string
              return '';
          }
          
          // Decode HTML entities and clean up the JavaScript
          let jsContent = jsMatch[1];
          
          // Decode common HTML entities
          jsContent = jsContent
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&amp;/g, '&')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'");
          
          return jsContent.trim();
      } catch (error) {
          console.error('Error extracting JavaScript:', error);
          return '';
      }
  }

  public updateHtml(newHtml: string): string {
      // Get the original full HTML content to preserve the js-component div
      const htmlMatch = this.content.match(/<html><!\[CDATA\[([\s\S]*?)\]\]><\/html>/);
      if (!htmlMatch) {
          throw new Error('No HTML content found in VRM file');
      }
      const originalFullHtml = htmlMatch[1];
      
      // Extract the js-component div from original HTML
      const jsComponentMatch = originalFullHtml.match(/(<div[^>]*class="js-component"[^>]*>[\s\S]*?<\/div>)/);
      const jsComponentDiv = jsComponentMatch ? jsComponentMatch[1] : '';
      
      // Combine the new HTML with the preserved js-component div
      let updatedHtml = newHtml;
      if (jsComponentDiv) {
          // Add the js-component div back to the HTML
          updatedHtml = newHtml + '\n' + jsComponentDiv;
      }
      
      // Replace the HTML content while preserving CDATA structure
      const htmlRegex = /(<html><!\[CDATA\[)([\s\S]*?)(\]\]><\/html>)/;
      return this.content.replace(htmlRegex, `$1${updatedHtml}$3`);
  }

  public updateJavaScript(newJs: string): string {
      try {
          // Get the original full HTML content
          const htmlMatch = this.content.match(/<html><!\[CDATA\[([\s\S]*?)\]\]><\/html>/);
          if (!htmlMatch) {
              throw new Error('No HTML content found in VRM file');
          }
          const fullHtmlContent = htmlMatch[1];
          
          // Encode special characters for HTML
          const encodedJs = newJs
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');
          
          // Update the JavaScript within the HTML
          const jsRegex = /(<div[^>]*class="js-component"[^>]*>[\s\S]*?<pre[^>]*>)([\s\S]*?)(<\/pre>[\s\S]*?<\/div>)/;
          let updatedHtml;
          
          if (jsRegex.test(fullHtmlContent)) {
              // Update existing js-component div
              updatedHtml = fullHtmlContent.replace(jsRegex, `$1${encodedJs}$3`);
          } else {
              // Create new js-component div if it doesn't exist
              const jsDiv = `<div ref="js" mp-id="1" class="js-component" style=""><pre>${encodedJs}</pre></div>`;
              updatedHtml = fullHtmlContent + '\n' + jsDiv;
          }
          
          // Update the full VRM content
          const htmlRegex = /(<html><!\[CDATA\[)([\s\S]*?)(\]\]><\/html>)/;
          return this.content.replace(htmlRegex, `$1${updatedHtml}$3`);
      } catch (error) {
          console.error('Error updating JavaScript:', error);
          return this.content;
      }
  }

  public getFullContent(): string {
      return this.content;
  }
}