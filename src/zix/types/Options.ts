import type { ZixBounds, ZixPoint } from "./Geometric";

export interface ZixMapOptions {
  minZoom?: number            // minimum allowed zoom (default: 0.5)
  maxZoom?: number            // maximum allowed zoom (default: 4)
  initialZoom?: number        // initial zoom level (default: 1)
  initialCenter?: ZixPoint    // initial map center
  bounds?: ZixBounds          // map bounds in image coordinates
  clampToBounds?: boolean     // prevent the map from going out of view (default: true)
  wheelSensitivity?: number   // wheel zoom sensitivity (default: 0.001)
};
