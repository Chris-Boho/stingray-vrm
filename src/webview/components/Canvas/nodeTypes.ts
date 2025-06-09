import { NodeTypes } from '@xyflow/react';
import { VrmComponentNode } from './VrmComponentNode';

// Define the node types for ReactFlow
export const nodeTypes: NodeTypes = {
  vrmComponent: VrmComponentNode,
};

// Export the node type names as constants for type safety
export const NODE_TYPES = {
  VRM_COMPONENT: 'vrmComponent',
} as const;

export type VrmNodeType = typeof NODE_TYPES[keyof typeof NODE_TYPES];