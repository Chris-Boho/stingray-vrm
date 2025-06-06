import { VrmDocument, VrmComponent, ComponentValues, ComponentParameter, CsfParameter, SetVariable, SectionType, ComponentType } from '../types/vrm';

export class VrmParserService {
  private static instance: VrmParserService;

  public static getInstance(): VrmParserService {
    if (!VrmParserService.instance) {
      VrmParserService.instance = new VrmParserService();
    }
    return VrmParserService.instance;
  }

  /**
   * Parse VRM XML content into structured data
   */
  public parseVrmContent(xmlContent: string): VrmDocument {
    try {
      // Extract main sections
      const functionData = this.parseFunctionSection(xmlContent);
      const preprocComponents = this.parseComponentSection(xmlContent, 'preproc');
      const htmlContent = this.parseHtmlSection(xmlContent);
      const postprocComponents = this.parseComponentSection(xmlContent, 'postproc');
      const languagesContent = this.parseLanguagesSection(xmlContent);
      const scriptsContent = this.parseScriptsSection(xmlContent);

      return {
        function: functionData,
        preproc: preprocComponents,
        html: htmlContent,
        postproc: postprocComponents,
        languages: languagesContent,
        scripts: scriptsContent
      };
    } catch (error) {
      console.error('Error parsing VRM content:', error);
      throw new Error(`Failed to parse VRM content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate VRM XML from structured data
   */
  public generateVrmXml(document: VrmDocument): string {
    let xml = '<vrm>\n';

    // Function section
    if (document.function) {
      xml += '\t<function>\n';
      xml += `\t\t<fn>${this.escapeXml(document.function.fn)}</fn>\n`;
      xml += `\t\t<lockedBy>${this.escapeXml(document.function.lockedBy)}</lockedBy>\n`;
      if (document.function.DenyURLExecution) {
        xml += '\t\t<DenyURLExecution/>\n';
      }
      if (document.function.DenyAjaxExecution) {
        xml += '\t\t<DenyAjaxExecution/>\n';
      }
      xml += `\t\t<lintMsg>${this.escapeXml(document.function.lintMsg || '')}</lintMsg>\n`;
      xml += '\t</function>\n';
    }

    // Preproc section
    xml += '\t<preproc>\n';
    for (const component of document.preproc) {
      xml += this.generateComponentXml(component, '\t\t');
    }
    xml += '\t</preproc>\n';

    // HTML section
    xml += '\t<html>';
    if (document.html.includes('<') || document.html.includes('&')) {
      xml += `<![CDATA[${document.html}]]>`;
    } else {
      xml += this.escapeXml(document.html);
    }
    xml += '</html>\n';

    // Postproc section
    xml += '\t<postproc>\n';
    for (const component of document.postproc) {
      xml += this.generateComponentXml(component, '\t\t');
    }
    xml += '\t</postproc>\n';

    // Languages section
    if (document.languages) {
      xml += `\t<languages><![CDATA[${document.languages}]]></languages>\n`;
    }

    // Scripts section
    if (document.scripts) {
      xml += `\t<scripts><![CDATA[${document.scripts}]]></scripts>\n`;
    }

    xml += '</vrm>';
    return xml;
  }

  private parseFunctionSection(xmlContent: string) {
    const functionMatch = xmlContent.match(/<function>([\s\S]*?)<\/function>/);
    if (!functionMatch) return undefined;

    const functionXml = functionMatch[1];
    const fnMatch = functionXml.match(/<fn>([^<]*)<\/fn>/);
    const lockedByMatch = functionXml.match(/<lockedBy>([^<]*)<\/lockedBy>/);
    const lintMsgMatch = functionXml.match(/<lintMsg>([^<]*)<\/lintMsg>/);
    const denyURLMatch = functionXml.includes('<DenyURLExecution');
    const denyAjaxMatch = functionXml.includes('<DenyAjaxExecution');

    return {
      fn: fnMatch ? fnMatch[1] : '',
      lockedBy: lockedByMatch ? lockedByMatch[1] : '',
      DenyURLExecution: denyURLMatch,
      DenyAjaxExecution: denyAjaxMatch,
      lintMsg: lintMsgMatch ? lintMsgMatch[1] : ''
    };
  }

  private parseComponentSection(xmlContent: string, sectionType: SectionType): VrmComponent[] {
    const sectionMatch = xmlContent.match(new RegExp(`<${sectionType}>([\\s\\S]*?)<\\/${sectionType}>`));
    if (!sectionMatch) return [];

    const components: VrmComponent[] = [];
    const componentXmls = this.extractComponents(sectionMatch[1]);

    for (const componentXml of componentXmls) {
      try {
        const component = this.parseComponent(componentXml, sectionType);
        if (component) {
          components.push(component);
        }
      } catch (error) {
        console.error('Error parsing component:', error);
      }
    }

    return components;
  }

  private parseHtmlSection(xmlContent: string): string {
    const htmlMatch = xmlContent.match(/<html>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/html>/);
    if (htmlMatch) {
      return htmlMatch[1] || htmlMatch[2] || '';
    }
    return '';
  }

  private parseLanguagesSection(xmlContent: string): string {
    const languagesMatch = xmlContent.match(/<languages>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/languages>/);
    if (languagesMatch) {
      return languagesMatch[1] || languagesMatch[2] || '';
    }
    return '';
  }

  private parseScriptsSection(xmlContent: string): string {
    const scriptsMatch = xmlContent.match(/<scripts>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/scripts>/);
    if (scriptsMatch) {
      return scriptsMatch[1] || scriptsMatch[2] || '';
    }
    return '';
  }

  private extractComponents(xmlContent: string): string[] {
    const components: string[] = [];
    const componentPattern = /<c>[\s\S]*?<\/c>/g;
    let match;

    while ((match = componentPattern.exec(xmlContent)) !== null) {
      let componentXml = match[0];

      // Check if this component has nested <c> tags (comment tags)
      const hasCommentPattern = /<y>\d+<\/y>\s*<c>[^<]*<\/c>\s*<wp>/.test(componentXml);

      if (!hasCommentPattern) {
        // This might be a component that got cut off at the comment tag
        const afterMatch = xmlContent.substring(componentPattern.lastIndex);
        const wpMatch = afterMatch.match(/^\s*<wp>[\s\S]*?<\/wp>\s*<\/c>/);
        if (wpMatch) {
          componentXml += wpMatch[0];
          componentPattern.lastIndex += wpMatch[0].length;
        }
      }
      components.push(componentXml);
    }

    return components;
  }

  private parseComponent(componentXml: string, sectionType: SectionType): VrmComponent | null {
    try {
      // Extract basic component data
      const nMatch = componentXml.match(/<n>(\d+)<\/n>/);
      const tMatch = componentXml.match(/<t>([^<]+)<\/t>/);
      const xMatch = componentXml.match(/<x>(\d+)<\/x>/);
      const yMatch = componentXml.match(/<y>(\d+)<\/y>/);

      // Handle watchpoint parsing
      let watchpoint: boolean | null = null;
      const wpEmptyMatch = componentXml.match(/<wp\s*\/>/);
      const wpEmptyTagMatch = componentXml.match(/<wp><\/wp>/);
      const wpValueMatch = componentXml.match(/<wp>([01])<\/wp>/);

      if (wpEmptyMatch || wpEmptyTagMatch) {
        watchpoint = null;
      } else if (wpValueMatch) {
        watchpoint = wpValueMatch[1] === '1';
      }

      // Extract comment
      let comment = '';
      const commentPattern = /<y>\d+<\/y>\s*<c>([^<]*)<\/c>\s*<wp>/;
      const commentMatch = componentXml.match(commentPattern);
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
            jumps.push(0);
          }
        });
      }

      // Ensure we have at least 2 jump connections
      while (jumps.length < 2) {
        jumps.push(0);
      }

      // Extract values section
      let values: ComponentValues | undefined = undefined;
      const valuesMatch = componentXml.match(/<values>([\s\S]*?)<\/values>/);
      if (valuesMatch && tMatch) {
        values = this.parseValuesByType(valuesMatch[1], tMatch[1] as ComponentType);
      }

      if (!nMatch || !tMatch || !xMatch || !yMatch) {
        return null;
      }

      return {
        n: parseInt(nMatch[1]),
        t: tMatch[1] as ComponentType,
        values: values,
        j: jumps,
        x: parseInt(xMatch[1]),
        y: parseInt(yMatch[1]),
        c: comment,
        wp: watchpoint,
        section: sectionType
      };
    } catch (error) {
      console.error('Error parsing component XML:', error);
      return null;
    }
  }

  private parseValuesByType(valuesContent: string, componentType: ComponentType): ComponentValues {
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
        this.parseLegacyValues(valuesContent, values);
        break;
    }

    return values;
  }

  private parseCsfValues(valuesContent: string, values: ComponentValues): void {
    const nMatches = valuesContent.match(/<n>([^<]*)<\/n>/g);
    const vMatches = valuesContent.match(/<v>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/v>/g);

    if (nMatches && nMatches.length > 0) {
      const functionNameMatch = nMatches[0].match(/<n>([^<]*)<\/n>/);
      values.functionName = functionNameMatch ? functionNameMatch[1] : '';
    }

    if (vMatches && vMatches.length > 0) {
      const returnValueMatch = vMatches[0].match(/<v>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/v>/);
      values.returnValue = returnValueMatch ? (returnValueMatch[1] || returnValueMatch[2] || '') : '';
    }

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
    const queryMatch = valuesContent.match(/<query>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/query>/);
    const queryEmptyMatch = valuesContent.match(/<query\s*\/>/);
    
    if (queryMatch) {
      values.query = queryMatch[1] || queryMatch[2] || '';
    } else if (queryEmptyMatch) {
      values.query = '';
    }

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
    const nameMatch = valuesContent.match(/<n>([^<]*)<\/n>/);
    values.externalValue = nameMatch ? nameMatch[1] : '';
  }

  private parseLegacyValues(valuesContent: string, values: ComponentValues): void {
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

  private generateComponentXml(component: VrmComponent, indent: string): string {
    let xml = `${indent}<c>\n`;
    xml += `${indent}\t<n>${component.n}</n>\n`;
    xml += `${indent}\t<t>${component.t}</t>\n`;
    
    if (component.values) {
      xml += `${indent}\t<values>\n`;
      xml += this.generateValuesXml(component.values, component.t, `${indent}\t\t`);
      xml += `${indent}\t</values>\n`;
    }
    
    // Jump connections
    component.j.forEach(jump => {
      xml += `${indent}\t<j>${jump || ''}</j>\n`;
    });
    
    xml += `${indent}\t<x>${component.x}</x>\n`;
    xml += `${indent}\t<y>${component.y}</y>\n`;
    xml += `${indent}\t<c>${this.escapeXml(component.c)}</c>\n`;
    
    // Watchpoint
    if (component.wp === null) {
      xml += `${indent}\t<wp/>\n`;
    } else {
      xml += `${indent}\t<wp>${component.wp ? '1' : '0'}</wp>\n`;
    }
    
    xml += `${indent}</c>\n`;
    return xml;
  }

  private generateValuesXml(values: ComponentValues, componentType: ComponentType, indent: string): string {
    let xml = '';

    switch (componentType) {
      case 'CSF':
        if (values.functionName) {
          xml += `${indent}<n>${this.escapeXml(values.functionName)}</n>\n`;
        }
        if (values.returnValue) {
          xml += `${indent}<v><![CDATA[${values.returnValue}]]></v>\n`;
        }
        if (values.functionParams) {
          values.functionParams.forEach(param => {
            xml += `${indent}<n>${this.escapeXml(param.label)}</n>\n`;
            xml += `${indent}<v><![CDATA[${param.value}]]></v>\n`;
          });
        }
        break;

      case 'SELECTQUERY':
      case 'INSERTUPDATEQUERY':
        if (values.query) {
          xml += `${indent}<query><![CDATA[${values.query}]]></query>\n`;
        }
        if (values.params) {
          values.params.forEach(param => {
            xml += `${indent}<param>\n`;
            xml += `${indent}\t<n>${this.escapeXml(param.name)}</n>\n`;
            xml += `${indent}\t<t>${param.type}</t>\n`;
            xml += `${indent}\t<v><![CDATA[${param.value}]]></v>\n`;
            xml += `${indent}</param>\n`;
          });
        }
        break;

      case 'SET':
        if (values.variables) {
          values.variables.forEach(variable => {
            xml += `${indent}<n><![CDATA[${variable.name}]]></n>\n`;
            xml += `${indent}<v><![CDATA[${variable.value}]]></v>\n`;
          });
        }
        break;

      case 'SCRIPT':
        if (values.script) {
          xml += `${indent}<v><![CDATA[${values.script}]]></v>\n`;
        }
        if (values.language) {
          xml += `${indent}<lng>${this.escapeXml(values.language)}</lng>\n`;
        }
        break;

      case 'IF':
        if (values.condition) {
          xml += `${indent}<v><![CDATA[${values.condition}]]></v>\n`;
        }
        break;

      case 'ERROR':
        if (values.errorMessage) {
          xml += `${indent}<v><![CDATA[${values.errorMessage}]]></v>\n`;
        }
        break;

      case 'EXTERNAL':
        if (values.externalValue) {
          xml += `${indent}<n>${this.escapeXml(values.externalValue)}</n>\n`;
        }
        break;

      case 'TEMPLATE':
        if (values.templateName) {
          xml += `${indent}<n>${this.escapeXml(values.templateName)}</n>\n`;
        }
        if (values.templateTarget) {
          xml += `${indent}<t>${this.escapeXml(values.templateTarget)}</t>\n`;
        }
        break;

      case 'MATH':
        if (values.mathName) {
          xml += `${indent}<n>${this.escapeXml(values.mathName)}</n>\n`;
        }
        if (values.mathFormat) {
          xml += `${indent}<f>${this.escapeXml(values.mathFormat)}</f>\n`;
        }
        if (values.mathParam) {
          xml += `${indent}<v>${this.escapeXml(values.mathParam)}</v>\n`;
        }
        break;

      case 'SQLTRN':
        if (values.transactionName) {
          xml += `${indent}<n>${this.escapeXml(values.transactionName)}</n>\n`;
        }
        if (values.transactionType) {
          xml += `${indent}<t>${this.escapeXml(values.transactionType)}</t>\n`;
        }
        break;
    }

    return xml;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Validate VRM document structure
   */
  public validateDocument(document: VrmDocument): string[] {
    const errors: string[] = [];

    // Check for duplicate component IDs
    const allComponents = [...document.preproc, ...document.postproc];
    const componentIds = allComponents.map(c => c.n);
    const duplicateIds = componentIds.filter((id, index) => componentIds.indexOf(id) !== index);
    
    if (duplicateIds.length > 0) {
      errors.push(`Duplicate component IDs found: ${duplicateIds.join(', ')}`);
    }

    // Validate component connections
    allComponents.forEach(component => {
      component.j.forEach((targetId, index) => {
        if (targetId > 0 && !componentIds.includes(targetId)) {
          errors.push(`Component ${component.n} has invalid connection to non-existent component ${targetId}`);
        }
      });
    });

    return errors;
  }

  /**
   * Extract JavaScript content from HTML
   */
  public extractJavaScript(htmlContent: string): string {
    // Look for JS component or script blocks in HTML
    const jsComponentMatch = htmlContent.match(/<div[^>]*class="js-component"[^>]*>[\s\S]*?<pre>([\s\S]*?)<\/pre>[\s\S]*?<\/div>/);
    if (jsComponentMatch) {
      return this.unescapeHtml(jsComponentMatch[1]);
    }

    const scriptMatch = htmlContent.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    if (scriptMatch) {
      return this.unescapeHtml(scriptMatch[1]);
    }

    return '';
  }

  /**
   * Inject JavaScript content back into HTML
   */
  public injectJavaScript(htmlContent: string, jsContent: string): string {
    const escapedJs = this.escapeHtml(jsContent);
    
    // Replace in JS component if it exists
    const jsComponentRegex = /(<div[^>]*class="js-component"[^>]*>[\s\S]*?<pre>)([\s\S]*?)(<\/pre>[\s\S]*?<\/div>)/;
    if (jsComponentRegex.test(htmlContent)) {
      return htmlContent.replace(jsComponentRegex, `$1${escapedJs}$3`);
    }

    // Replace in script tag if it exists
    const scriptRegex = /(<script[^>]*>)([\s\S]*?)(<\/script>)/;
    if (scriptRegex.test(htmlContent)) {
      return htmlContent.replace(scriptRegex, `$1${escapedJs}$3`);
    }

    // If no existing JS container, add a script tag at the end
    return htmlContent + `\n<script>\n${jsContent}\n</script>`;
  }

  private unescapeHtml(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}