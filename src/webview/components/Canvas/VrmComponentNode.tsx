import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { VrmComponent, ComponentType } from '../../types/vrm';
import { useSelectionStore } from '../../stores/selectionStore';
import { useComponentStore } from '../../stores/componentStore';

interface VrmComponentNodeData {
  component: VrmComponent;
  label: string;
  type: ComponentType;
}

// Properly typed NodeProps for our VRM component
type VrmComponentNodeProps = NodeProps & {
  data: VrmComponentNodeData;
};

// Component type to color mapping - Each component type has a unique, meaningful color
const getComponentColor = (type: ComponentType): { bg: string; border: string; text: string; shadow: string } => {
  switch (type) {
    // Database Components - Blue family
    case 'SQLTRN':
      return {
        bg: 'bg-gradient-to-r from-blue-600 to-blue-700',
        border: 'border-blue-400',
        text: 'text-white',
        shadow: 'shadow-blue-500/20'
      };
    case 'SELECTQUERY':
      return {
        bg: 'bg-gradient-to-r from-sky-500 to-sky-600',
        border: 'border-sky-300',
        text: 'text-white',
        shadow: 'shadow-sky-500/20'
      };
    case 'INSERTUPDATEQUERY':
      return {
        bg: 'bg-gradient-to-r from-cyan-500 to-cyan-600',
        border: 'border-cyan-300',
        text: 'text-white',
        shadow: 'shadow-cyan-500/20'
      };
    
    // Script Components - Green family
    case 'CSF':
      return {
        bg: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
        border: 'border-emerald-300',
        text: 'text-white',
        shadow: 'shadow-emerald-500/20'
      };
    case 'SCRIPT':
      return {
        bg: 'bg-gradient-to-r from-green-500 to-green-600',
        border: 'border-green-300',
        text: 'text-white',
        shadow: 'shadow-green-500/20'
      };
    
    // Control Flow Components - Distinct colors
    case 'IF':
      return {
        bg: 'bg-gradient-to-r from-amber-500 to-amber-600',
        border: 'border-amber-300',
        text: 'text-white',
        shadow: 'shadow-amber-500/20'
      };
    case 'ERROR':
      return {
        bg: 'bg-gradient-to-r from-red-500 to-red-600',
        border: 'border-red-300',
        text: 'text-white',
        shadow: 'shadow-red-500/20'
      };
    
    // Data Components - Purple family
    case 'SET':
      return {
        bg: 'bg-gradient-to-r from-purple-500 to-purple-600',
        border: 'border-purple-300',
        text: 'text-white',
        shadow: 'shadow-purple-500/20'
      };
    case 'MATH':
      return {
        bg: 'bg-gradient-to-r from-violet-500 to-violet-600',
        border: 'border-violet-300',
        text: 'text-white',
        shadow: 'shadow-violet-500/20'
      };
    
    // Integration Components - Distinct colors
    case 'EXTERNAL':
      return {
        bg: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
        border: 'border-indigo-300',
        text: 'text-white',
        shadow: 'shadow-indigo-500/20'
      };
    case 'TEMPLATE':
      return {
        bg: 'bg-gradient-to-r from-pink-500 to-pink-600',
        border: 'border-pink-300',
        text: 'text-white',
        shadow: 'shadow-pink-500/20'
      };
    
    default:
      return {
        bg: 'bg-gradient-to-r from-gray-500 to-gray-600',
        border: 'border-gray-300',
        text: 'text-white',
        shadow: 'shadow-gray-500/20'
      };
  }
};

// Component type to abbreviation mapping
const getComponentAbbreviation = (type: ComponentType): string => {
  switch (type) {
    case 'SQLTRN': return 'ST';
    case 'SELECTQUERY': return 'SQ';
    case 'INSERTUPDATEQUERY': return 'IU';
    case 'CSF': return 'CF';
    case 'SCRIPT': return 'SC';
    case 'IF': return 'IF';
    case 'ERROR': return 'ER';
    case 'SET': return 'SE';
    case 'MATH': return 'MA';
    case 'EXTERNAL': return 'EX';
    case 'TEMPLATE': return 'TP';
    default: return 'UN';
  }
};

export const VrmComponentNode: React.FC<VrmComponentNodeProps> = memo(({ 
  data, 
  selected 
}) => {
  const { component, type } = data;
  const { isSelected } = useSelectionStore();
  const { setEditingComponent } = useComponentStore();
  
  const colors = getComponentColor(type);
  const abbreviation = getComponentAbbreviation(type);
  const isComponentSelected = isSelected(component.n);

  // Truncate comment to fit in the available space (approximately 35 characters)
  const maxCommentLength = 35;
  const truncatedComment = component.c && component.c.length > maxCommentLength 
    ? component.c.substring(0, maxCommentLength) + '...'
    : component.c;

  const handleDoubleClick = () => {
    setEditingComponent(component.n);
  };

  return (
    <div className="vrm-component-node relative">
      {/* Input Handle - Top center */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        className="!w-3 !h-3 !border-2 !border-vscode-button-border !bg-vscode-button-background !rounded-full"
        style={{
          top: -6,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      />
      
      {/* Main Component Container - 32 × 32px */}
      <div
        className={`
          relative w-8 h-8 rounded-md border-2 cursor-pointer overflow-visible
          transition-all duration-200 ease-in-out
          ${colors.bg} ${colors.border} ${colors.text} ${colors.shadow}
          hover:scale-105 hover:shadow-lg hover:shadow-current/30
          ${isComponentSelected || selected 
            ? 'ring-2 ring-vscode-focusBorder shadow-lg scale-105' 
            : 'shadow-md'
          }
          ${component.wp === true ? 'ring-2 ring-red-400 ring-offset-1' : ''}
        `}
        onDoubleClick={handleDoubleClick}
        title={component.c ? `${component.n}: ${component.c}` : `Component ${component.n}`}
      >
        {/* Left section - Component type abbreviation */}
        <div className="absolute left-0 top-0 bottom-0 flex items-center px-2 z-10">
          <div className="text-xs font-bold tracking-wide drop-shadow-sm">
            {abbreviation}
          </div>
        </div>
        
        {/* Right section - Component number and comment */}
        <div className="absolute left-8 top-0 bottom-0 min-w-max pr-2 flex items-center">
          <div className="flex items-center text-xs bg-inherit pl-2 rounded-r">
            <span className="font-semibold text-white/90">{component.n}</span>
            {truncatedComment && (
              <>
                <span className="mx-1 text-white/60">:</span>
                <span className="text-white/80">{truncatedComment}</span>
              </>
            )}
          </div>
        </div>
        
        {/* Watchpoint Indicator */}
        {/* {component.wp === true && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-md">
            <div className="w-full h-full bg-red-500 rounded-full animate-ping"></div>
          </div>
        )} */}
      </div>
      
      {/* Output Handle - Bottom center */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="primary"
        className="!w-3 !h-3 !border-2 !border-vscode-button-border !bg-gray-500 !rounded-full"
        style={{
          bottom: -6,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      />
      
      {/* Secondary Output Handle - For IF components and dual connections */}
      {(type === 'IF' || (component.j && component.j[1] > 0)) && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="secondary"
          className="!w-3 !h-3 !border-2 !border-vscode-button-border !bg-red-500 !rounded-full"
          style={{
            bottom: -6,
            left: '75%',
            transform: 'translateX(-50%)',
          }}
        />
      )}
    </div>
  );
});

VrmComponentNode.displayName = 'VrmComponentNode';