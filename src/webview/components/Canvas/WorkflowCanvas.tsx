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
import { useConnectionStore } from '../../stores/connectionStore';
import { VrmComponent, SectionType, ComponentTemplate } from '../../types/vrm';
import { nodeTypes, NODE_TYPES } from './nodeTypes';
import StingrayEdge from './StingrayEdge';

// Define custom edge types
const edgeTypes = {
  stingray: StingrayEdge,
};

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
          type: 'stingray',  // Use our custom edge type
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
          type: 'stingray',  // Use our custom edge type
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
  const { 
    isCreating, 
    cancelConnection, 
    updateTempConnection, 
    tempConnection 
  } = useConnectionStore();
  
  // Use React Flow instance for coordinate conversion
  const reactFlowInstance = useReactFlow();
  
  // State for drag over effect
  const [isDragOver, setIsDragOver] = useState(false);

  // Get components for the current section
  const sectionComponents = useMemo(() => {
    if (!document) return [];
    return section === 'preproc' ? document.preproc : document.postproc;
  }, [document, section]);

  // Calculate dynamic canvas size based on component positions
  const canvasSize = useMemo(() => {
    if (sectionComponents.length === 0) {
      return { width: 1200, height: 800 }; // Default size for empty sections
    }

    // Find the bounds of all components
    const maxX = Math.max(...sectionComponents.map(c => c.x + 128)); // Add component width
    const maxY = Math.max(...sectionComponents.map(c => c.y + 32));  // Add component height
    
    // Add padding: 500px below highest component, 200px to the right of rightmost
    const dynamicWidth = Math.max(1200, maxX + 200);
    const dynamicHeight = Math.max(800, maxY + 500);
    
    console.log('Canvas size calculated:', { 
      componentsCount: sectionComponents.length,
      maxX, 
      maxY, 
      dynamicWidth, 
      dynamicHeight 
    });
    
    return { width: dynamicWidth, height: dynamicHeight };
  }, [sectionComponents]);

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

  const onNodesChangeHandler = useCallback((changes: any[]) => {
    // Handle position changes to update VRM data
    changes.forEach(change => {
      if (change.type === 'position' && change.position && !change.dragging) {
        // Update VRM component position when drag ends
        const componentId = parseInt(change.id);
        const documentStore = useDocumentStore.getState();
        documentStore.updateComponent(componentId, {
          x: Math.round(change.position.x),
          y: Math.round(change.position.y)
        });
      }
    });
    
    // Apply the changes to ReactFlow
    onNodesChange(changes);
  }, [onNodesChange]);

  const onSelectionChange = useCallback((params: { nodes: Node[]; edges: Edge[] }) => {
    const selectedNodeIds = params.nodes.map(node => parseInt(node.id));
    selectComponents(selectedNodeIds);
  }, [selectComponents]);

  const onPaneClick = useCallback((event: React.MouseEvent) => {
    // Cancel connection creation if clicking on empty space
    if (isCreating) {
      cancelConnection();
      console.log('Connection cancelled by clicking on empty space');
      return;
    }

    clearSelection();
  }, [clearSelection, isCreating, cancelConnection]);

  const onViewportChange = useCallback((viewport: { x: number; y: number; zoom: number }) => {
    setZoom(viewport.zoom);
    setPan({ x: viewport.x, y: viewport.y });
  }, [setZoom, setPan]);

  // Mouse move handler for connection preview
  const onMouseMove = useCallback((event: React.MouseEvent) => {
    if (isCreating) {
      // Update temp connection position
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      updateTempConnection(position);
    }
  }, [isCreating, updateTempConnection, reactFlowInstance]);

  // Keyboard handler for ESC key
  const onKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && isCreating) {
      cancelConnection();
      console.log('Connection cancelled with ESC key');
    }
  }, [isCreating, cancelConnection]);

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
    // Preserve current node positions when updating
    setNodes(currentNodes => {
      const nodeMap = new Map(currentNodes.map(node => [node.id, node]));
      return newNodes.map(newNode => {
        const existingNode = nodeMap.get(newNode.id);
        if (existingNode) {
          // Keep the current position if node already exists
          return {
            ...newNode,
            position: existingNode.position,
            selected: existingNode.selected
          };
        }
        return newNode;
      });
    });
  }, [sectionComponents, setNodes]);

  useEffect(() => {
    const newEdges = convertConnectionsToEdges(sectionComponents);
    setEdges(newEdges);
  }, [sectionComponents, setEdges]);

  // Add keyboard event listener for ESC key
  useEffect(() => {
    window.document.addEventListener('keydown', onKeyDown);
    return () => {
      window.document.removeEventListener('keydown', onKeyDown);
    };
  }, [onKeyDown]);

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
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChangeHandler}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={onSelectionChange}
          onPaneClick={onPaneClick}
          onPaneMouseMove={onMouseMove}
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
            [canvasSize.width, canvasSize.height]
          ]}
          style={{ 
            width: '100%', 
            height: '600px',
            backgroundColor: isDragOver ? 'rgba(96, 165, 250, 0.1)' : undefined,
            transition: 'background-color 0.2s',
            cursor: isCreating ? 'crosshair' : 'default'
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
              {isCreating && (
                <span className="ml-2 text-blue-400">
                  • Creating connection...
                </span>
              )}
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

          {/* Temporary Connection Line */}
          {isCreating && tempConnection && (
            <svg 
              className="absolute inset-0 pointer-events-none"
              style={{ zIndex: 1001 }}
            >
              <defs>
                <marker
                  id="temp-arrowhead"
                  markerWidth="6"
                  markerHeight="6"
                  refX="5"
                  refY="3"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 6 3, 0 6"
                    fill="#60a5fa"
                  />
                </marker>
              </defs>
              <line
                x1={tempConnection.start.x}
                y1={tempConnection.start.y}
                x2={tempConnection.end.x}
                y2={tempConnection.end.y}
                stroke="#60a5fa"
                strokeWidth="2"
                strokeDasharray="5,5"
                markerEnd="url(#temp-arrowhead)"
              />
            </svg>
          )}
        </ReactFlow>
      </div>

      {/* Connection Mode Instructions */}
      {isCreating && (
        <div className="absolute top-4 left-4 bg-blue-500 text-white p-3 rounded shadow-lg z-50">
          <div className="text-sm font-medium">Creating Connection</div>
          <div className="text-xs mt-1">
            Click on target component to connect<br/>
            Press ESC or click empty space to cancel
          </div>
        </div>
      )}
    </div>
  );
};