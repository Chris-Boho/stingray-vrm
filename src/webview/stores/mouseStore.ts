
import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { create } from 'zustand';


export interface MousePosition {
  x: number;
  y: number;
}

interface MousePositionState {
  position: MousePosition;
  setPosition: (pos: MousePosition) => void;
}

export const useMousePositionStore = create<MousePositionState>((set) => ({
  position: { x: 300, y: 200 },
  setPosition: (pos) => set({ position: pos }),
}));


interface UseMousePositionReturn {
  position: MousePosition;
  updatePosition: (event: React.MouseEvent) => void;
  setPosition: (position: MousePosition) => void;
}


/**
 * Custom hook for tracking and updating mouse position globally using Zustand
 * Converts screen coordinates to flow coordinates automatically
 */
export const useMousePosition = (): UseMousePositionReturn => {
  const reactFlowInstance = useReactFlow();
  const position = useMousePositionStore((state) => state.position);
  const setPosition = useMousePositionStore((state) => state.setPosition);

  // Update mouse position from a React mouse event
  const updatePosition = useCallback((event: React.MouseEvent) => {
    if (!reactFlowInstance) return;
    try {
      const canvasPosition = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      setPosition(canvasPosition);
    } catch (error) {
      // Optionally log error
    }
  }, [reactFlowInstance, setPosition]);

  return {
    position,
    updatePosition,
    setPosition,
  };
};


/**
 * Hook specifically for clipboard operations
 * Provides mouse position for paste operations
 */
export const useMousePositionForClipboard = () => {
  const position = useMousePositionStore((state) => state.position);
  const setPosition = useMousePositionStore((state) => state.setPosition);
  const reactFlowInstance = useReactFlow();

  // For use as an onMouseMove handler
  const trackMousePosition = useCallback((event: React.MouseEvent) => {
    if (!reactFlowInstance) return;
    try {
      const canvasPosition = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      setPosition(canvasPosition);
    } catch {}
  }, [reactFlowInstance, setPosition]);

  return {
    mousePosition: position,
    trackMousePosition,
    getPastePosition: (): MousePosition => ({
      x: Math.max(0, position.x),
      y: Math.max(0, position.y),
    }),
  };
};


/**
 * Hook for connection drawing operations
 * Provides mouse position for temporary connection lines
 */
export const useMousePositionForConnections = () => {
  const position = useMousePositionStore((state) => state.position);
  const setPosition = useMousePositionStore((state) => state.setPosition);
  const reactFlowInstance = useReactFlow();

  // For use as an onMouseMove handler
  const updateConnectionPosition = useCallback((event: React.MouseEvent) => {
    if (!reactFlowInstance) return;
    try {
      const canvasPosition = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      setPosition(canvasPosition);
    } catch {}
  }, [reactFlowInstance, setPosition]);

  return {
    connectionEndPosition: position,
    updateConnectionPosition,
  };
};

