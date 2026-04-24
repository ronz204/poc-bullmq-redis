import type { ZixPoint, ZixBounds } from "@zix/types/Geome"

export interface TransformState {
  scale: number;      // factor de zoom
  offsetX: number;    // desplazamiento horizontal en px de pantalla
  offsetY: number;    // desplazamiento vertical en px de pantalla
};

/**
 * Convierte un punto de coordenadas de imagen a coordenadas de pantalla
 */
export function imageToScreen(point: ZixPoint, transform: TransformState): ZixPoint {
  return {
    x: point.x * transform.scale + transform.offsetX,
    y: point.y * transform.scale + transform.offsetY
  }
}

/**
 * Convierte un punto de coordenadas de pantalla a coordenadas de imagen
 */
export function screenToImage(point: ZixPoint, transform: TransformState): ZixPoint {
  return {
    x: (point.x - transform.offsetX) / transform.scale,
    y: (point.y - transform.offsetY) / transform.scale
  }
}

/**
 * Genera la matriz CSS transform para aplicar al contenedor del mapa
 * Esta es la transformación que se aplica a todo el contenido (SVG, markers, edges)
 */
export function getTransformMatrix(transform: TransformState): string {
  const { scale, offsetX, offsetY } = transform
  return `matrix(${scale}, 0, 0, ${scale}, ${offsetX}, ${offsetY})`
}

/**
 * Calcula el zoom y offset necesarios para encuadrar un área específica
 * dentro del viewport con padding opcional
 */
export function calculateFitTransform(
  imageBounds: ZixBounds,
  viewportSize: { width: number; height: number },
  padding = 20,
): TransformState {
  const imageWidth = imageBounds.max.x - imageBounds.min.x;
  const imageHeight = imageBounds.max.y - imageBounds.min.y;
  
  const availableWidth = viewportSize.width - padding * 2;
  const availableHeight = viewportSize.height - padding * 2;
  
  // Calcular el scale que permite que toda el área entre con padding
  const scaleX = availableWidth / imageWidth;
  const scaleY = availableHeight / imageHeight;
  const scale = Math.min(scaleX, scaleY);
  
  // Calcular el offset para centrar el área
  const scaledWidth = imageWidth * scale;
  const scaledHeight = imageHeight * scale;
  
  const offsetX = (viewportSize.width - scaledWidth) / 2 - imageBounds.min.x * scale;
  const offsetY = (viewportSize.height - scaledHeight) / 2 - imageBounds.min.y * scale;
  
  return { scale, offsetX, offsetY };
};

export const Projection = Object.freeze({
  imageToScreen,
  screenToImage,
  getTransformMatrix,
  calculateFitTransform
});
