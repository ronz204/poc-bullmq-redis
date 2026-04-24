import type { ZixBounds, ZixPoint } from "@zix/types/Geometric";
import type { ZixMapOptions } from "@zix/types/Options";
import type { TransformState } from "./Projection";

export class Viewport {
  private scale: number;
  private offsetX: number;
  private offsetY: number;
  
  private minZoom: number;
  private maxZoom: number;
  private bounds?: ZixBounds;
  private clampToBounds: boolean;
  
  constructor(options: ZixMapOptions = {}) {
    this.scale = options.initialZoom ?? 1
    this.offsetX = 0;
    this.offsetY = 0;
    
    this.maxZoom = options.maxZoom ?? 4;
    this.minZoom = options.minZoom ?? 0.5;

    this.bounds = options.bounds;
    this.clampToBounds = options.clampToBounds ?? true;
    
    if (options.initialCenter) {
      this.offsetX = -options.initialCenter.x * this.scale;
      this.offsetY = -options.initialCenter.y * this.scale;
    };
  };
  
  /**
   * Returns the current transform state
   */
  public getTransform(): TransformState {
    return {
      scale: this.scale,
      offsetX: this.offsetX,
      offsetY: this.offsetY
    };
  };
  
  /**
   * Sets the zoom level, clamped to min/max bounds
   */
  public setZoom(newZoom: number): void {
    this.scale = this.clampScale(newZoom)
  }
  
  /**
   * Sets the absolute offset
   */
  public setOffset(x: number, y: number): void {
    this.offsetX = x
    this.offsetY = y
    
    if (this.clampToBounds && this.bounds) {
      this.applyBoundsConstraints()
    }
  }
  
  /**
   * Applies zoom centered on a specific screen point (wheel & pinch)
   */
  public zoomAt(cursorScreen: ZixPoint, newScale: number): void {
    const clampedScale = this.clampScale(newScale)
    const scaleFactor = clampedScale / this.scale
    
    // Keep the point under the cursor fixed in screen space
    this.offsetX = cursorScreen.x - (cursorScreen.x - this.offsetX) * scaleFactor
    this.offsetY = cursorScreen.y - (cursorScreen.y - this.offsetY) * scaleFactor
    
    this.scale = clampedScale
    
    if (this.clampToBounds && this.bounds) {
      this.applyBoundsConstraints()
    }
  }
  
  /**
   * Applies a relative offset (pan/drag)
   */
  public pan(deltaX: number, deltaY: number): void {
    this.offsetX += deltaX
    this.offsetY += deltaY
    
    if (this.clampToBounds && this.bounds) {
      this.applyBoundsConstraints()
    }
  }
  
  /**
   * Sets the full transform state
   */
  public setTransform(transform: TransformState): void {
    this.scale = this.clampScale(transform.scale)
    this.offsetX = transform.offsetX
    this.offsetY = transform.offsetY
    
    if (this.clampToBounds && this.bounds) {
      this.applyBoundsConstraints()
    }
  }
  
  /**
   * Updates the map bounds
   */
  public setBounds(bounds: ZixBounds | undefined): void {
    this.bounds = bounds
  }
  
  /**
   * Clamps scale between min and max zoom
   */
  private clampScale(scale: number): number {
    return Math.max(this.minZoom, Math.min(this.maxZoom, scale))
  }
  
  /**
   * Applies bounds constraints to keep the map in view
   */
  private applyBoundsConstraints(): void {
    // TODO: implement advanced clamping logic if needed
  }
}
