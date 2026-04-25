import type { ZixPoint } from "./Geometric";

export interface ZixMarker<ZixData> {
  id: number;
  label: string;
  floor: number;
  data: ZixData;
  position: ZixPoint;
};
