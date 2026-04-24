import type { ZixPoint, ZixBounds } from "./Geome";

export interface ZixMarker<ZixData> {
  id: number;
  label: string;
  floor: number;
  data: ZixData;
  position: ZixPoint;
};

export interface ZixLevel {
  id: number;
  name: string;
  image: string;
  bounds: ZixBounds;
};
