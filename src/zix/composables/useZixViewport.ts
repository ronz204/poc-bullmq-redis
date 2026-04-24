import type { ZixMapOptions } from "@zix/types/Options";
import type { ZixBounds, ZixPoint } from "@zix/types/Geometric";
import type { UseZixViewportReturn } from "@zix/types/Composables";

import { ref, computed } from "vue";
import { Viewport } from "@zix/core/Viewport";
import { Projection } from "@zix/core/Projection";

/**
 * Main hook for managing the map viewport
 */
export function useZixViewport(options: ZixMapOptions = {}): UseZixViewportReturn {
  // Create the viewport instance
  const viewport = new Viewport(options)
  
  // Reactive state derived from the viewport
  const scale = ref(viewport.getTransform().scale)
  const offsetX = ref(viewport.getTransform().offsetX)
  const offsetY = ref(viewport.getTransform().offsetY)
  
  // Reactive transform matrix for CSS application
  const transformMatrix = computed(() => 
    Projection.getTransformMatrix({
      scale: scale.value,
      offsetX: offsetX.value,
      offsetY: offsetY.value
    })
  )
  
  /**
   * Sync refs with the current viewport state
   */
  function syncRefs(): void {
    const transform = viewport.getTransform()
    scale.value = transform.scale
    offsetX.value = transform.offsetX
    offsetY.value = transform.offsetY
  }
  
  /**
   * Set the zoom level
   */
  function setZoom(zoom: number): void {
    viewport.setZoom(zoom)
    syncRefs()
  }
  
  /**
   * Apply zoom centered on a specific screen point
   */
  function zoomAt(cursorScreen: ZixPoint, newScale: number): void {
    viewport.zoomAt(cursorScreen, newScale)
    syncRefs()
  }
  
  /**
   * Apply a relative offset (pan)
   */
  function pan(deltaX: number, deltaY: number): void {
    viewport.pan(deltaX, deltaY)
    syncRefs()
  }
  
  /**
   * Set the absolute offset
   */
  function setOffset(x: number, y: number): void {
    viewport.setOffset(x, y)
    syncRefs()
  }
  
  /**
   * Fit the viewport to show a specific area
   */
  function fitToBounds(
    bounds: ZixBounds, 
    viewportSize: { width: number; height: number }, 
    padding = 20
  ): void {
    const transform = Projection.calculateFitTransform(bounds, viewportSize, padding)
    viewport.setTransform(transform)
    syncRefs()
  }
  
  /**
   * Update the map bounds
   */
  function setBounds(bounds: ZixBounds | undefined): void {
    viewport.setBounds(bounds)
  }
  
  return {
    // Reactive state
    scale,
    offsetX,
    offsetY,
    transformMatrix,
    
    // Methods
    setZoom,
    zoomAt,
    pan,
    setOffset,
    fitToBounds,
    setBounds,
    
    // Viewport instance
    viewport
  }
}
