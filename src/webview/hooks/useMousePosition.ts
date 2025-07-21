import { useState, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';

interface MousePosition {
  x: number;
  y: number;
}

interface UseMousePositionReturn {
  position: MousePosition;
  updatePosition: (event: React.MouseEvent) => void;
  setPosition: (position: MousePosition) => void;
}

/**
 * Custom hook for tracking mouse position on the ReactFlow canvas
 * Converts screen coordinates to flow coordinates automatically
 */
export const useMousePosition = (initialPosition?: MousePosition): UseMousePositionReturn => {
  const reactFlowInstance = useReactFlow();
  
  // Default to a reasonable center position if not provided
  const [position, setPosition] = useState<MousePosition>(
    initialPosition || { x: 300, y: 200 }
  );

  /**
   * Update mouse position from a React mouse event
   * Automatically converts screen coordinates to flow coordinates
   */
  const updatePosition = useCallback((event: React.MouseEvent) => {
    if (!reactFlowInstance) {
      console.warn('ReactFlow instance not available for mouse position tracking');
      return;
    }

    try {
      const canvasPosition = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      setPosition(canvasPosition);
      
      // Optional: Log for debugging (can be removed in production)
      // console.log(`🖱️ Mouse position updated: (${canvasPosition.x.toFixed(1)}, ${canvasPosition.y.toFixed(1)})`);
    } catch (error) {
      console.error('Error updating mouse position:', error);
    }
  }, [reactFlowInstance]);

  /**
   * Manually set position (useful for programmatic positioning)
   */
  const setPositionManually = useCallback((newPosition: MousePosition) => {
    setPosition(newPosition);
  }, []);

  return {
    position,
    updatePosition,
    setPosition: setPositionManually
  };
};

/**
 * Hook specifically for clipboard operations
 * Provides mouse position for paste operations
 */
export const useMousePositionForClipboard = () => {
  const { position, updatePosition } = useMousePosition({ x: 300, y: 200 });
  
  return {
    /** Current mouse position in canvas coordinates */
    mousePosition: position,
    
    /** Update function to attach to onMouseMove events */
    trackMousePosition: updatePosition,
    
    /** Get position for paste operations with fallback */
    getPastePosition: (): MousePosition => {
      // Ensure position is within reasonable bounds
      return {
        x: Math.max(0, position.x),
        y: Math.max(0, position.y)
      };
    }
  };
};

/**
 * Hook for connection drawing operations
 * Provides mouse position for temporary connection lines
 */
export const useMousePositionForConnections = () => {
  const { position, updatePosition } = useMousePosition();
  
  return {
    /** Current mouse position for connection end point */
    connectionEndPosition: position,
    
    /** Update function for mouse tracking during connection creation */
    updateConnectionPosition: updatePosition
  };
};

export default useMousePosition;