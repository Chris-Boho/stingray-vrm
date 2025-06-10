import React, { useCallback, useMemo } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/base.css';
import '../../../../tailwind.config.ts';

import { useDocumentStore } from '../../stores/documentStore';
import { useEditorStore } from '../../stores/editorStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { VrmComponent, SectionType } from '../../types/vrm';
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
    if (component.j[0] && component.j[0] > 0) {
      edges.push({
        id: `${component.n}-primary-${component.j[0]}`,
        source: component.n.toString(),
        target: component.j[0].toString(),
        type: 'smoothstep',
        sourceHandle: 'primary',
        style: { stroke: '#60a5fa', strokeWidth: 2 }, // Light blue
        data: { connectionType: 'primary' }
      });
    }
    
    // Secondary connection (second j element) - Grey
    if (component.j[1] && component.j[1] > 0) {
      edges.push({
        id: `${component.n}-secondary-${component.j[1]}`,
        source: component.n.toString(),
        target: component.j[1].toString(),
        type: 'smoothstep',
        sourceHandle: 'secondary',
        style: { stroke: '#9ca3af', strokeWidth: 2 }, // Grey
        data: { connectionType: 'secondary' }
      });
    }
  });
  
  return edges;
};

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ 
  section, 
  className = '' 
}) => {
  const { document } = useDocumentStore();
  const { zoom, setZoom, pan, setPan, grid } = useEditorStore();
  const { selectedComponents, selectComponents, clearSelection } = useSelectionStore();

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

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when components change
  React.useEffect(() => {
    const newNodes = sectionComponents.map(convertVrmComponentToNode);
    setNodes(newNodes);
  }, [sectionComponents, setNodes]);

  // Update edges when components change
  React.useEffect(() => {
    const newEdges = convertConnectionsToEdges(sectionComponents);
    setEdges(newEdges);
  }, [sectionComponents, setEdges]);

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
      // TODO: Update the VRM component data
    },
    [setEdges]
  );

  // Handle node selection
  const onSelectionChange = useCallback((params: { nodes: Node[]; edges: Edge[] }) => {
    const selectedNodeIds = params.nodes.map(node => parseInt(node.id));
    selectComponents(selectedNodeIds);
  }, [selectComponents]);

  // Handle canvas click (clear selection)
  const onPaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  // Handle zoom changes
  const onViewportChange = useCallback((viewport: { x: number; y: number; zoom: number }) => {
    setZoom(viewport.zoom);
    setPan({ x: viewport.x, y: viewport.y });
  }, [setZoom, setPan]);

  if (!document) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-vscode-secondary">No document loaded</div>
      </div>
    );
  }

  if (sectionComponents.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center space-y-2">
          <div className="text-vscode-foreground">No components in {section} section</div>
          <div className="text-sm text-vscode-secondary">Add components to see the workflow</div>
        </div>
      </div>
    );
  }

  console.log('Rendering ReactFlow with:', { nodes: nodes.length, edges: edges.length });
  console.log('First node example:', nodes[0]);
  console.log('Node types:', nodeTypes);

  return (
    <div className={`w-full relative ${className}`}>
      {/* ReactFlow Canvas */}
      <div 
        className="w-full h-full" 
        style={{ 
          overflow: 'visible'
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
          style={{ width: '100%', height: '600px' }}
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
        </ReactFlow>
      </div>
    </div>
  );
};