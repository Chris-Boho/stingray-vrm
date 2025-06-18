import React, { useCallback, useMemo, useEffect, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Panel,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/base.css';

import { useDocumentStore } from '../../stores/documentStore';
import { useEditorStore } from '../../stores/editorStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { useComponentStore } from '../../stores/componentStore';
import { VrmComponent, SectionType, ComponentTemplate } from '../../types/vrm';
import { nodeTypes, NODE_TYPES } from './nodeTypes';

interface WorkflowCanvasProps {
  section: SectionType;
  className?: string;
}

// Convert VRM component to ReactFlow node
const convertVrmComponentToNode = (component: VrmComponent): Node => {
  return {
    id: component.n.toString(),
    type: NODE_TYPES.VRM_COMPONENT,
    position: { 
      x: component.x, 
      y: component.y 
    },
    data: {
      component,
      label: component.c || component.t,
      type: component.t,
    },
    selected: false,
  };
};

// Convert VRM connections to ReactFlow edges
const convertConnectionsToEdges = (components: VrmComponent[]): Edge[] => {
  const edges: Edge[] = [];
  
  components.forEach(component => {
    // Primary connection (first j element) - Light blue
    if (component.j && component.j[0] && component.j[0] > 0) {
      const targetExists = components.some(c => c.n === component.j[0]);
      if (targetExists) {
        edges.push({
          id: `e${component.n}-${component.j[0]}`,
          source: component.n.toString(),
          target: component.j[0].toString(),
          type: 'smoothstep',
          style: { stroke: '#60a5fa', strokeWidth: 2 }, // Light blue
          data: { connectionType: 'primary' }
        });
      }
    }
    
    // Secondary connection (second j element) - Grey
    if (component.j && component.j[1] && component.j[1] > 0) {
      const targetExists = components.some(c => c.n === component.j[1]);
      if (targetExists) {
        edges.push({
          id: `e${component.n}-${component.j[1]}-secondary`,
          source: component.n.toString(),
          target: component.j[1].toString(),
          type: 'smoothstep',
          style: { stroke: '#9ca3af', strokeWidth: 2 }, // Grey
          data: { connectionType: 'secondary' }
        });
      }
    }
  });
  
  console.log('Generated edges:', edges);
  return edges;
};

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ 
  section, 
  className = '' 
}) => {
  // ✅ ALL HOOKS FIRST - before any conditional logic or early returns
  const { document } = useDocumentStore();
  const { zoom, setZoom, pan, setPan, grid } = useEditorStore();
  const { selectedComponents, selectComponents, clearSelection } = useSelectionStore();
  const { createComponent } = useComponentStore();
  
  // Use React Flow instance for coordinate conversion
  const reactFlowInstance = useReactFlow();
  
  // State for drag over effect
  const [isDragOver, setIsDragOver] = useState(false);

  // Get components for the current section
  const sectionComponents = useMemo(() => {
    if (!document) return [];
    return section === 'preproc' ? document.preproc : document.postproc;
  }, [document, section]);

  // Convert VRM components to ReactFlow nodes
  const initialNodes = useMemo(() => {
    return sectionComponents.map(convertVrmComponentToNode);
  }, [sectionComponents]);

  // Convert VRM connections to ReactFlow edges
  const initialEdges = useMemo(() => {
    return convertConnectionsToEdges(sectionComponents);
  }, [sectionComponents]);

  // ✅ Initialize ReactFlow state hooks
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // ✅ All callback hooks
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
      // TODO: Update the VRM component data
    },
    [setEdges]
  );

  const onSelectionChange = useCallback((params: { nodes: Node[]; edges: Edge[] }) => {
    const selectedNodeIds = params.nodes.map(node => parseInt(node.id));
    selectComponents(selectedNodeIds);
  }, [selectComponents]);

  const onPaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const onViewportChange = useCallback((viewport: { x: number; y: number; zoom: number }) => {
    setZoom(viewport.zoom);
    setPan({ x: viewport.x, y: viewport.y });
  }, [setZoom, setPan]);

  // Drop handling
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
    console.log('Drag over canvas');
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    console.log('Drop event on ReactFlow canvas');
    
    // Get the template data from the drag event
    const templateData = event.dataTransfer.getData('application/json');
    
    if (!templateData) {
      console.log('No template data in drop event');
      return;
    }
    
    try {
      const template: ComponentTemplate = JSON.parse(templateData);
      console.log('Template data:', template);
      
      // Calculate the position where the component was dropped
      // Convert screen coordinates to flow coordinates
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      // Adjust for component size (center the component on the drop point)
      // Component is now 32px × 32px (w-8 = 2rem = 32px)
      const adjustedPosition = {
        x: position.x - 16, // Half of component width (32/2)
        y: position.y - 16, // Half of component height (32/2)
      };
      
      console.log('Drop coordinates:', { 
        client: { x: event.clientX, y: event.clientY },
        flow: position,
        adjusted: adjustedPosition 
      });
      
      // Create the new component with adjusted position
      const newComponent = createComponent(template.type, adjustedPosition, section);
      console.log('Created component:', newComponent);
      
      // The component store should have already added it to the document
      // React will re-render and update our nodes
      
    } catch (error) {
      console.error('Error processing drop:', error);
    }
  }, [createComponent, section, reactFlowInstance]);

  // ✅ All effect hooks
  useEffect(() => {
    const newNodes = sectionComponents.map(convertVrmComponentToNode);
    setNodes(newNodes);
  }, [sectionComponents, setNodes]);

  useEffect(() => {
    const newEdges = convertConnectionsToEdges(sectionComponents);
    setEdges(newEdges);
  }, [sectionComponents, setEdges]);

  // ✅ NOW handle conditional rendering - after all hooks are declared
  if (!document) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-vscode-secondary">No document loaded</div>
      </div>
    );
  }

  if (sectionComponents.length === 0 && !isDragOver) {
    return (
      <div 
        className={`flex items-center justify-center h-full ${className}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="text-center space-y-2">
          <div className="text-vscode-foreground">No components in {section} section</div>
          <div className="text-sm text-vscode-secondary">Drag components from the palette to add them</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full relative ${className}`}>
      {/* ReactFlow Canvas */}
      <div 
        className="w-full h-full" 
        style={{ 
          overflow: 'visible',
          position: 'relative'
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={onSelectionChange}
          onPaneClick={onPaneClick}
          onViewportChange={onViewportChange}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          defaultViewport={{ x: pan.x, y: pan.y, zoom }}
          selectNodesOnDrag={false}
          selectionOnDrag={true}
          panOnDrag={true}
          minZoom={0.1}
          maxZoom={3}
          snapToGrid={grid.snapToGrid}
          snapGrid={[grid.cellSize.x, grid.cellSize.y]}
          fitView
          fitViewOptions={{ 
            padding: 0.2,
            includeHiddenNodes: false,
            minZoom: 0.5,
            maxZoom: 1.5 
          }}
          translateExtent={[
            [0, 0],
            [2000, 1000]
          ]}
          style={{ 
            width: '100%', 
            height: '600px',
            backgroundColor: isDragOver ? 'rgba(96, 165, 250, 0.1)' : undefined,
            transition: 'background-color 0.2s'
          }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={grid.cellSize.x}
            size={2}
            color={grid.showGrid ? 'var(--vscode-panel-border)' : 'transparent'}
          />
          <Controls
            position="top-right"
            showZoom={true}
            showFitView={true}
            showInteractive={true}
            style={{
              backgroundColor: 'var(--vscode-editor-background)',
              border: '1px solid var(--vscode-panel-border)',
            }}
          />
          <MiniMap
            position="bottom-right"
            nodeColor="var(--vscode-button-background)"
            nodeStrokeColor="var(--vscode-button-border)"
            maskColor="rgba(0,0,0,0.2)"
            style={{
              backgroundColor: 'var(--vscode-editor-background)',
              border: '1px solid var(--vscode-panel-border)',
            }}
          />
          <Panel position="top-center">
            <div className="bg-vscode-editor-bg border border-vscode-border rounded px-3 py-1 text-sm text-vscode-foreground">
              {section.charAt(0).toUpperCase() + section.slice(1)} Section - {sectionComponents.length} Components
            </div>
          </Panel>
          
          {/* Drop indicator */}
          {isDragOver && (
            <div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ zIndex: 1000 }}
            >
              <div className="bg-vscode-button-background text-vscode-button-foreground px-4 py-2 rounded shadow-lg">
                Drop component here
              </div>
            </div>
          )}
        </ReactFlow>
      </div>
    </div>
  );
};