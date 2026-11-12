export interface Point {
  x: number;
  y: number;
}

export interface ProcessedPoint extends Point {
  z: number;
}

export interface ProcessedLine {
  x1: number;
  y1: number;
  z1: number;
  x2: number;
  y2: number;
  z2: number;
}

export interface CanvasResponse {
  points: ProcessedPoint[];
  lines: ProcessedLine[];
}
