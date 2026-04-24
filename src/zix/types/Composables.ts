import type { Ref } from "vue";
import type { ZixViewport } from "./Geometric";
import type { ZixBounds, ZixPoint } from "./Geometric";
import type { Viewport } from "@zix/core/Viewport";

export interface UseZixViewportReturn {
  // Reactive state
  scale: Ref<number>
  offsetX: Ref<number>
  offsetY: Ref<number>
  transformMatrix: Ref<string>

  // Control methods
  setZoom: (zoom: number) => void
  zoomAt: (cursorScreen: ZixPoint, newScale: number) => void
  pan: (deltaX: number, deltaY: number) => void
  setOffset: (x: number, y: number) => void
  fitToBounds: (bounds: ZixBounds, viewportSize: ZixViewport, padding?: number) => void
  setBounds: (bounds: ZixBounds | undefined) => void

  // Viewport instance (for advanced access)
  viewport: Viewport
}
