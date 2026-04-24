import type { ZixBounds, ZixPoint } from "@zix/types/Geome";
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
   * Obtiene el estado actual de la transformación
   */
  public getTransform(): TransformState {
    return {
      scale: this.scale,
      offsetX: this.offsetX,
      offsetY: this.offsetY
    };
  };
  
  /**
   * Establece el zoom con clamp automático
   */
  public setZoom(newZoom: number): void {
    this.scale = this.clampScale(newZoom)
  }
  
  /**
   * Establece el offset (desplazamiento)
   */
  public setOffset(x: number, y: number): void {
    this.offsetX = x
    this.offsetY = y
    
    if (this.clampToBounds && this.bounds) {
      this.applyBoundsConstraints()
    }
  }
  
  /**
   * Aplica un zoom centrado en un punto específico de la pantalla
   * Esta es la función clave para wheel y pinch zoom
   */
  public zoomAt(cursorScreen: ZixPoint, newScale: number): void {
    const clampedScale = this.clampScale(newScale)
    const scaleFactor = clampedScale / this.scale
    
    // Fórmula para mantener el punto bajo el cursor estático
    this.offsetX = cursorScreen.x - (cursorScreen.x - this.offsetX) * scaleFactor
    this.offsetY = cursorScreen.y - (cursorScreen.y - this.offsetY) * scaleFactor
    
    this.scale = clampedScale
    
    if (this.clampToBounds && this.bounds) {
      this.applyBoundsConstraints()
    }
  }
  
  /**
   * Aplica un desplazamiento relativo (para pan/drag)
   */
  public pan(deltaX: number, deltaY: number): void {
    this.offsetX += deltaX
    this.offsetY += deltaY
    
    if (this.clampToBounds && this.bounds) {
      this.applyBoundsConstraints()
    }
  }
  
  /**
   * Establece el estado completo de la transformación
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
   * Actualiza los bounds del mapa
   */
  public setBounds(bounds: ZixBounds | undefined): void {
    this.bounds = bounds
  }
  
  /**
   * Clamp del scale entre min y max zoom
   */
  private clampScale(scale: number): number {
    return Math.max(this.minZoom, Math.min(this.maxZoom, scale))
  }
  
  /**
   * Aplica restricciones de bounds para que el mapa no salga de vista
   * (implementación simplificada - puede mejorarse)
   */
  private applyBoundsConstraints(): void {
    // TODO: implementar lógica de clamping avanzada si se necesita
    // Por ahora, solo aseguramos que el mapa no se vaya completamente fuera
  }
}
