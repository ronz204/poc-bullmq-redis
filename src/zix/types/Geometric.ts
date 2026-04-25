export interface ZixPoint {
  x: number;
  y: number;
};

export interface ZixBounds {
  min: ZixPoint;
  max: ZixPoint;
};

export interface ZixViewport {
  width: number;
  height: number;
};

export interface ZixLevel {
  id: number;
  label: string;
  imagePath: string;
  bounds: ZixBounds;
};
