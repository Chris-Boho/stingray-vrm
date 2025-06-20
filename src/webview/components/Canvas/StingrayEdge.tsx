import React, { memo } from 'react';
import { EdgeProps, getBezierPath, BaseEdge } from '@xyflow/react';

// Custom path calculation for StingrayEdge
const getStingrayPath = (
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourcePosition: string,
  targetPosition: string
): string => {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const pathOffset = 20; // Fixed offset length for start and end segments
  let path = '';
  
  // Check if components are aligned
  const isVerticallyAligned = Math.abs(dx) < 5; // Allow small tolerance for alignment
  const isHorizontallyAligned = Math.abs(dy) < 5;
  
  // Check if components are vertically aligned AND very close (within 10px)
  if (isVerticallyAligned && Math.abs(dy) < 12.6) {
    console.log('Vertical alignment detected:', isVerticallyAligned, Math.abs(dy));
    // Create a left-side loop
    const loopOffset = 25; // How far to the left to make the loop
    
    if (dy >= 0) {
      // Target is below or at same level as source
      path = `M ${sourceX},${sourceY} L ${sourceX - loopOffset},${sourceY} L ${sourceX - loopOffset},${targetY} L ${targetX},${targetY}`;
    } else {
      // Target is above source
      path = `M ${sourceX},${sourceY} L ${sourceX - loopOffset},${sourceY} L ${sourceX - loopOffset},${targetY} L ${targetX},${targetY}`;
    }
    return path;
  }
  
  // If vertically aligned but further apart, draw a straight line
  if (isVerticallyAligned) {
    return `M ${sourceX},${sourceY} L ${targetX},${targetY}`;
  }
  
  // If horizontally aligned (same Y), draw a straight line
  if (isHorizontallyAligned) {
    return `M ${sourceX},${sourceY} L ${targetX},${targetY}`;
  }  
  
  // Calculate midpoint between source and target X
  const midX = sourceX + dx / 2;
  
  if (dy > 0) {
    // Target is below source
    path = `M ${sourceX},${sourceY} L ${sourceX},${sourceY + pathOffset} L ${midX},${sourceY + pathOffset} L ${midX},${targetY - pathOffset} L ${targetX},${targetY - pathOffset} L ${targetX},${targetY}`;
  } else {
    // Target is above source - go up to target
    // Calculate midpoint - same as downward connection
    const midX = sourceX + dx / 2;
    
    // Steps for upward connection:
    // 1. Path offset from source (down 20px)
    // 2. Horizontal to midway point
    // 3. Go up until 20px above the target
    // 4. Horizontal to target X position
    // 5. Final path offset to connect to target
    
    path = `M ${sourceX},${sourceY} L ${sourceX},${sourceY + pathOffset} L ${midX},${sourceY + pathOffset} L ${midX},${targetY - pathOffset} L ${targetX},${targetY - pathOffset} L ${targetX},${targetY}`;
  }
  
  return path;
};

// Smooth the corners of the path
const smoothPath = (path: string, radius: number = 10): string => {
  // This is a simplified version - in production you might want to use a proper SVG path smoothing algorithm
  // For now, we'll convert sharp corners to rounded corners using quadratic bezier curves
  const commands = path.trim().split(/\s+/);
  const smoothedPath: string[] = [];
  
  let i = 0;
  while (i < commands.length) {
    const cmd = commands[i];
    
    if (cmd === 'M' || cmd === 'L') {
      smoothedPath.push(cmd);
      i++;
      // Add the coordinates
      if (i < commands.length - 1) {
        smoothedPath.push(commands[i]); // x,y coordinates
        i++;
      }
    } else {
      smoothedPath.push(cmd);
      i++;
    }
  }
  
  return smoothedPath.join(' ');
};

interface StingrayEdgeProps extends EdgeProps {
  data?: {
    connectionType?: 'primary' | 'secondary';
  };
}

const StingrayEdge: React.FC<StingrayEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}) => {
  // Generate the custom path
  const edgePath = getStingrayPath(
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition || 'bottom',
    targetPosition || 'top'
  );
  
  // Determine edge color based on connection type
  const strokeColor = data?.connectionType === 'secondary' ? '#9ca3af' : '#60a5fa';
  
  return (
    <>
      <defs>
      <marker
        id={`arrowhead-${id}`}
        markerWidth="6"
        markerHeight="6"
        refX="5"
        refY="3"
        orient="auto"
      >
        <polygon
          points="0 0, 6 3, 0 6"
          fill={strokeColor}
        />
      </marker>
      </defs>
      <path
        id={id}
        style={{
          strokeWidth: 2,
          stroke: strokeColor,
          fill: 'none',
          ...style,
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={`url(#arrowhead-${id})`}
      />
    </>
  );
};

export default memo(StingrayEdge);