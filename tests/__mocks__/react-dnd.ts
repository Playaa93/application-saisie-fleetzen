/**
 * Mock React DnD for testing
 */

export const useDrag = jest.fn(() => [
  { isDragging: false },
  jest.fn(),
  jest.fn(),
]);

export const useDrop = jest.fn(() => [
  { isOver: false, canDrop: false },
  jest.fn(),
]);

export const DndProvider = ({ children }: { children: React.ReactNode }) => children;

export const HTML5Backend = {};
