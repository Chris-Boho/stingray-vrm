// src/webview/services/componentRegistry.ts

import { ComponentType, ComponentTemplate } from '../types/vrm';
import { webviewUriService } from './webviewUriServices';

// Import all icons
import errorIcon from '../icons/Error.png';
import externalIcon from '../icons/External.png';
import ifIcon from '../icons/IF.png';
import insertUpdateIcon from '../icons/Insert-Update.png';
import mathIcon from '../icons/MATH.png';
import multiSetIcon from '../icons/Multi-Set.png';
import scriptIcon from '../icons/Script.png';
import selectIcon from '../icons/Select.png';
import selectAltIcon from '../icons/Select-ICON.png'
import selectAltIconSM from '../icons/Select-ICON-SM.png'
import selectAltIconTrans from '../icons/Select-ICON-Transparent.png'
import systemFunctionIcon from '../icons/System_Function.png';
import templateIcon from '../icons/Template.png';
import transactionIcon from '../icons/Transaction.png';

// Component metadata including visual properties
export interface ComponentMetadata extends ComponentTemplate {
  paletteIconUrl: string;
  editorIconUrl: string;
  abbreviation: string;
  colors: {
    bg: string;
    border: string;
    text: string;
    shadow: string;
  };
}

class ComponentRegistry {
  private static instance: ComponentRegistry;
  private components: Map<ComponentType, ComponentMetadata>;

  private constructor() {
    this.components = new Map();
    this.initializeComponents();
  }

  private initializeComponents() {
    const componentData: Array<{
      type: ComponentType;
      label: string;
      description: string;
      category: 'database' | 'script' | 'control' | 'data' | 'integration';
      icon: string;
      paletteIconFile: string;
      editorIconFile: string;
      abbreviation: string;
      colors: ComponentMetadata['colors'];
      defaultValues: any;
    }> = [
      // Database components
      {
        type: 'SQLTRN',
        label: 'SQL Transaction',
        description: 'Begin/Commit/Rollback database transactions',
        category: 'database',
        icon: 'database',
        paletteIconFile: transactionIcon,
        editorIconFile: transactionIcon,
        abbreviation: 'ST',
        colors: {
          bg: 'bg-gradient-to-r from-blue-600 to-blue-700',
          border: 'border-blue-400',
          text: 'text-white',
          shadow: 'shadow-blue-500/20'
        },
        defaultValues: {
          transactionName: '',
          transactionType: 'BEGIN'
        }
      },
      {
        type: 'SELECTQUERY',
        label: 'Select Query',
        description: 'Execute database select queries',
        category: 'database',
        icon: 'search',
        paletteIconFile: selectAltIconSM,
        editorIconFile: selectAltIcon,
        abbreviation: 'SQ',
        colors: {
          bg: 'bg-gradient-to-r from-sky-500 to-sky-600',
          border: 'border-sky-300',
          text: 'text-white',
          shadow: 'shadow-sky-500/20'
        },
        defaultValues: {
          query: '',
          params: []
        }
      },
      {
        type: 'INSERTUPDATEQUERY',
        label: 'Insert/Update Query',
        description: 'Execute database insert/update queries',
        category: 'database',
        icon: 'edit',
        paletteIconFile: insertUpdateIcon,
        editorIconFile: insertUpdateIcon,
        abbreviation: 'IU',
        colors: {
          bg: 'bg-gradient-to-r from-cyan-500 to-cyan-600',
          border: 'border-cyan-300',
          text: 'text-white',
          shadow: 'shadow-cyan-500/20'
        },
        defaultValues: {
          query: '',
          params: []
        }
      },
      // Script components
      {
        type: 'CSF',
        label: 'Script Function',
        description: 'Call script functions with parameters',
        category: 'script',
        icon: 'function',
        paletteIconFile: systemFunctionIcon,
        editorIconFile: systemFunctionIcon,
        abbreviation: 'CF',
        colors: {
          bg: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
          border: 'border-emerald-300',
          text: 'text-white',
          shadow: 'shadow-emerald-500/20'
        },
        defaultValues: {
          functionName: '',
          returnValue: '',
          functionParams: []
        }
      },
      {
        type: 'SCRIPT',
        label: 'Script Block',
        description: 'Execute custom Pascal scripts',
        category: 'script',
        icon: 'code',
        paletteIconFile: scriptIcon,
        editorIconFile: scriptIcon,
        abbreviation: 'SC',
        colors: {
          bg: 'bg-gradient-to-r from-green-500 to-green-600',
          border: 'border-green-300',
          text: 'text-white',
          shadow: 'shadow-green-500/20'
        },
        defaultValues: {
          script: '',
          language: 'Pascal'
        }
      },
      // Control components
      {
        type: 'IF',
        label: 'Condition',
        description: 'Conditional branching logic',
        category: 'control',
        icon: 'fork',
        paletteIconFile: ifIcon,
        editorIconFile: ifIcon,
        abbreviation: 'IF',
        colors: {
          bg: 'bg-gradient-to-r from-amber-500 to-amber-600',
          border: 'border-amber-300',
          text: 'text-white',
          shadow: 'shadow-amber-500/20'
        },
        defaultValues: {
          condition: ''
        }
      },
      {
        type: 'ERROR',
        label: 'Error',
        description: 'Display errors and halt execution',
        category: 'control',
        icon: 'error',
        paletteIconFile: errorIcon,
        editorIconFile: errorIcon,
        abbreviation: 'ER',
        colors: {
          bg: 'bg-gradient-to-r from-red-500 to-red-600',
          border: 'border-red-300',
          text: 'text-white',
          shadow: 'shadow-red-500/20'
        },
        defaultValues: {
          errorMessage: ''
        }
      },
      // Data components
      {
        type: 'SET',
        label: 'Multi-Set Variables',
        description: 'Variable assignment operations',
        category: 'data',
        icon: 'variable',
        paletteIconFile: multiSetIcon,
        editorIconFile: multiSetIcon,
        abbreviation: 'SE',
        colors: {
          bg: 'bg-gradient-to-r from-purple-500 to-purple-600',
          border: 'border-purple-300',
          text: 'text-white',
          shadow: 'shadow-purple-500/20'
        },
        defaultValues: {
          variables: []
        }
      },
      {
        type: 'MATH',
        label: 'Math Operation',
        description: 'Mathematical calculations',
        category: 'data',
        icon: 'calculator',
        paletteIconFile: mathIcon,
        editorIconFile: mathIcon,
        abbreviation: 'MA',
        colors: {
          bg: 'bg-gradient-to-r from-violet-500 to-violet-600',
          border: 'border-violet-300',
          text: 'text-white',
          shadow: 'shadow-violet-500/20'
        },
        defaultValues: {
          mathName: '',
          mathFormat: '',
          mathParam: ''
        }
      },
      // Integration components
      {
        type: 'EXTERNAL',
        label: 'External Call',
        description: 'Call external rules/procedures',
        category: 'integration',
        icon: 'external',
        paletteIconFile: externalIcon,
        editorIconFile: externalIcon,
        abbreviation: 'EX',
        colors: {
          bg: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
          border: 'border-indigo-300',
          text: 'text-white',
          shadow: 'shadow-indigo-500/20'
        },
        defaultValues: {
          externalValue: ''
        }
      },
      {
        type: 'TEMPLATE',
        label: 'Template',
        description: 'Process and generate templates',
        category: 'integration',
        icon: 'template',
        paletteIconFile: templateIcon,
        editorIconFile: templateIcon,
        abbreviation: 'TP',
        colors: {
          bg: 'bg-gradient-to-r from-pink-500 to-pink-600',
          border: 'border-pink-300',
          text: 'text-white',
          shadow: 'shadow-pink-500/20'
        },
        defaultValues: {
          templateName: '',
          templateTarget: ''
        }
      }
    ];

    // Initialize the map with resolved icon URLs
    componentData.forEach(data => {
      this.components.set(data.type, {
        type: data.type,
        label: data.label,
        description: data.description,
        category: data.category,
        icon: data.icon,
        paletteIconUrl: webviewUriService.resolveAssetUri(data.paletteIconFile),
        editorIconUrl: webviewUriService.resolveAssetUri(data.editorIconFile),

        abbreviation: data.abbreviation,
        colors: data.colors,
        defaultValues: data.defaultValues
      });
    });
  }

  public static getInstance(): ComponentRegistry {
    if (!ComponentRegistry.instance) {
      ComponentRegistry.instance = new ComponentRegistry();
    }
    return ComponentRegistry.instance;
  }

  public getComponent(type: ComponentType): ComponentMetadata | undefined {
    return this.components.get(type);
  }

  public getAllComponents(): ComponentMetadata[] {
    return Array.from(this.components.values());
  }

  public getComponentsByCategory(category: string): ComponentMetadata[] {
    return Array.from(this.components.values()).filter(c => c.category === category);
  }

  public getComponentPaletteIcon(type: ComponentType): string | undefined {
    return this.components.get(type)?.paletteIconUrl;
  }

  public getComponentEditorIcon(type: ComponentType): string | undefined {
    return this.components.get(type)?.editorIconUrl;
  }

  public getComponentColors(type: ComponentType): ComponentMetadata['colors'] | undefined {
    return this.components.get(type)?.colors;
  }

  public getComponentAbbreviation(type: ComponentType): string {
    return this.components.get(type)?.abbreviation || 'UN';
  }
}

export const componentRegistry = ComponentRegistry.getInstance();