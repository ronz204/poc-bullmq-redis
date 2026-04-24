# Zix — Indoor Mapping Renderer
## Documento de planificación y scoping

> **Qué es Zix:** Una mini-librería Vue para renderizar mapas interiores interactivos. Recibe un SVG de plano + datos de nodos/edges desde una API externa, y los visualiza con soporte de zoom, pan, markers y capas por piso. **Zix no navega ni busca rutas** — esa responsabilidad es de la API. Zix solo renderiza lo que recibe.

---

## 1. Contexto del proyecto

- **Tipo:** Proyecto universitario
- **Framework:** Vue 3 + TypeScript
- **Input principal:** SVG de plano arquitectónico (como `eco-campus-f4.svg`) + datos de la API en formato Nodos/Edges
- **Input de datos:** La API devuelve nodos y edges ya procesados; Zix los consume y los renderiza, sin lógica de pathfinding
- **Inspiración:** Leaflet.js, pero enfocado en interiores (indoor mapping)

---

## 2. Estructura de carpetas

```
zix/
├── src/
│   ├── core/                        # Motor matemático puro — sin Vue, sin reactividad
│   │   ├── Projection.ts            # Conversión imagen ↔ pantalla (la math central)
│   │   ├── Viewport.ts              # Estado de zoom, pan y bounds del viewport
│   │   └── Events.ts                # Normalización de eventos: mouse, touch, trackpad
│   │
│   ├── components/                  # Componentes Vue
│   │   ├── ZixMap.vue               # Contenedor raíz — equivalente a L.Map
│   │   ├── layers/
│   │   │   ├── ImageLayer.vue       # Renderiza el SVG del plano del piso
│   │   │   ├── VectorLayer.vue      # Renderiza edges como líneas SVG
│   │   │   └── MarkerLayer.vue      # Renderiza nodos como iconos/pines
│   │   └── ui/
│   │       ├── ZoomControl.vue      # Botones + / −
│   │       └── LevelControl.vue     # Selector de piso (P1, P2, P3…)
│   │
│   ├── composables/                 # Lógica reactiva reutilizable
│   │   ├── useZixViewport.ts        # Maneja el transform matrix reactivo
│   │   ├── useZixLevels.ts          # Maneja el stack de pisos activos
│   │   └── useZixGestures.ts        # Drag, pinch-zoom, wheel — mouse y touch
│   │
│   ├── types/
│   │   └── index.d.ts               # Todas las interfaces TypeScript de Zix
│   │
│   ├── utils/
│   │   └── math.ts                  # Helpers: clamp, lerp, pointInBounds, etc.
│   │
│   └── index.ts                     # Entry point — exporta todo lo público de Zix
│
├── public/
│   └── eco-campus-f4.svg            # Asset de prueba
│
├── package.json
└── vite.config.ts
```

---

## 3. Tipos de datos (TypeScript)

Estos son los tipos que Zix define internamente. Son **independientes** de los structs de la API — Zix tiene sus propios tipos y la app que lo usa se encarga de mapear.

```typescript
// ── Primitivos geométricos ─────────────────────────────────────────
interface ZixPoint {
  x: number   // coordenada en el espacio de la imagen (px del SVG)
  y: number
}

interface ZixBounds {
  min: ZixPoint
  max: ZixPoint
}

// ── Pisos / Niveles ────────────────────────────────────────────────
interface ZixLevel {
  id: string | number       // Identificador del piso (ej: 1, 2, "P4")
  label: string             // Label visible (ej: "Piso 4", "Planta Baja")
  svgSrc: string            // Ruta al SVG del plano o string SVG inlineado
  bounds?: ZixBounds        // Bounds propios del piso (puede variar entre pisos)
}

// ── Nodos (mapeados desde la API) ─────────────────────────────────
interface ZixNode {
  id: string | number
  position: ZixPoint        // px y py de la API → mapeados a ZixPoint
  floor: number             // piso al que pertenece
  label?: string            // label de la API
  code?: string             // code de la API
  type?: number             // type enum de la API — Zix no interpreta esto
  isLandmark?: boolean
  data?: Record<string, unknown>   // cualquier metadata extra
}

// ── Edges (mapeados desde la API) ─────────────────────────────────
interface ZixEdge {
  id: string | number
  fromNodeId: string | number
  toNodeId: string | number
  floor: number
  type?: number             // type enum de la API
  status?: number           // status enum de la API
  weight?: number
  data?: Record<string, unknown>
}

// ── Markers (capa de presentación sobre los nodos) ─────────────────
interface ZixMarker {
  id: string | number
  position: ZixPoint
  floor: number | string
  icon?: string | VNode     // string SVG, URL de imagen, o componente Vue
  label?: string
  color?: string
  data?: unknown            // para el evento @marker-click
}

// ── Configuración del mapa ─────────────────────────────────────────
interface ZixMapOptions {
  minZoom?: number          // default: 0.5
  maxZoom?: number          // default: 5
  initialZoom?: number      // default: 1
  initialCenter?: ZixPoint  // default: centro del bounds del piso
  wheelSensitivity?: number // default: 0.001
  clampToBounds?: boolean   // default: true — impide que el mapa salga de vista
}
```

---

## 4. Cómo funciona internamente

### 4.1 El sistema de dos coordenadas

Este es el concepto más importante de toda la librería. Zix trabaja con **dos espacios de coordenadas** distintos:

| Espacio | Qué es | Ejemplo |
|---|---|---|
| **Imagen** | Los píxeles del SVG original | "El nodo está en x:350, y:210 del plano" |
| **Pantalla** | Los píxeles del viewport del usuario | "El nodo se pinta en x:520px, y:380px del div" |

Estos dos espacios cambian de relación cada vez que el usuario hace zoom o pan. `Projection.ts` es el módulo que convierte entre ellos.

**La transformación central:**
```
screenX = (imageX * scale) + offsetX
screenY = (imageY * scale) + offsetY
```

Aplicada como CSS:
```css
transform: matrix(scale, 0, 0, scale, offsetX, offsetY)
```

Este `transform` se aplica a un único contenedor raíz (`ZixMap`). Todo lo que esté dentro — el SVG del plano, los markers, los edges — se transforma gratis junto con él. Esto es lo que hace Leaflet y es la base de Zix.

### 4.2 Viewport state

`Viewport.ts` mantiene el estado de la "cámara":

```typescript
interface ViewportState {
  scale: number       // nivel de zoom actual
  offsetX: number     // desplazamiento horizontal en px de pantalla
  offsetY: number     // desplazamiento vertical en px de pantalla
}
```

Toda interacción del usuario (drag, wheel, pinch) modifica estos tres valores. `useZixViewport.ts` los expone como `ref` reactivos para que Vue re-compute el `transform` automáticamente.

### 4.3 La math del zoom centrado en cursor

El zoom debe escalar respecto al punto donde está el cursor (o el centro del pinch), no respecto al centro del contenedor. Si no se hace esto, el mapa "salta" durante el zoom.

**Fórmula (wheel y pinch):**
```typescript
const scaleFactor = newScale / oldScale

newOffsetX = cursorX - (cursorX - currentOffsetX) * scaleFactor
newOffsetY = cursorY - (cursorY - currentOffsetY) * scaleFactor
```

Esta fórmula mantiene el punto bajo el cursor estático en pantalla mientras todo lo demás escala. Se aplica tanto para wheel (con `event.clientX/Y`) como para pinch (con el centroide de los dos dedos).

### 4.4 Stack de capas

El mapa es una pila de capas SVG superpuestas en el mismo contenedor transformado. El orden de renderizado (de abajo hacia arriba):

```
ZixMap (div transformado)
  └── ImageLayer      ← SVG del plano del piso (fondo)
  └── VectorLayer     ← Edges como <line> o <path> SVG
  └── MarkerLayer     ← Nodos como <g> SVG o <div> HTML absolutamente posicionados
  └── UI Controls     ← Zoom control, Level control (fuera del transform)
```

Los controles de UI (zoom, nivel) están **fuera** del contenedor transformado — tienen posición fija sobre el mapa.

---

## 5. Features detallados

### 5.1 Navegación (Core — indispensable)

#### Zoom con rueda del mouse
- Escuchar `wheel` event en el contenedor
- Calcular `newScale = clamp(currentScale * (1 + delta * sensitivity), minZoom, maxZoom)`
- Aplicar la fórmula de zoom centrado en cursor
- Implementado en: `useZixGestures.ts` + `Viewport.ts`

#### Pan con drag (mouse)
- `mousedown` → activar modo drag, guardar posición inicial
- `mousemove` → `offsetX += dx`, `offsetY += dy`
- `mouseup` / `mouseleave` → desactivar modo drag
- Implementado en: `useZixGestures.ts`

#### Pan con touch (1 dedo) y pinch-zoom (2 dedos)
- `touchstart`: registrar posición(es)
- `touchmove` con 1 toque → pan (igual que drag)
- `touchmove` con 2 toques → calcular distancia entre dedos y centroide; aplicar zoom centrado en centroide
- `touchend` → limpiar estado
- Implementado en: `useZixGestures.ts`

#### Zoom mínimo y máximo
- `minZoom` y `maxZoom` como props de `ZixMap`
- Aplicar `clamp` en cada actualización de `scale`
- Implementado en: `Viewport.ts` → `clampScale()`

#### Fit to bounds
- Función que calcula el zoom y offset necesarios para mostrar un área específica del mapa
- Uso: centrar en un nodo específico, mostrar un piso completo al iniciar
- `fitToBounds(bounds: ZixBounds, padding?: number)`
- Implementado en: `Viewport.ts` + expuesto en `ZixMap.vue` como método

### 5.2 Capas (Core — indispensable)

#### ImageLayer — renderizado del plano SVG
- Acepta `svgSrc: string` (ruta al SVG o string SVG inlineado)
- Si es una ruta: usa `<img>` tag (simple, sin interactividad en elementos del SVG)
- Si es SVG inlineado: monta con `v-html` (permite `pointer-events` en elementos del plano)
- El SVG se renderiza sin modificaciones dentro del contenedor transformado
- Importante: el SVG del plano es solo visual — no tiene datos de Zix

#### VectorLayer — renderizado de edges
- Recibe `edges: ZixEdge[]` y `nodes: ZixNode[]` (para resolver `fromNodeId` → posición)
- Renderiza cada edge como `<line>` o `<path>` en un `<svg>` overlay
- El SVG overlay tiene el mismo `viewBox` que el plano para que las coordenadas coincidan
- Props opcionales: `strokeColor`, `strokeWidth`, `edgeFilter` (función para filtrar qué edges mostrar)

#### MarkerLayer — renderizado de nodos
- Recibe `markers: ZixMarker[]`
- Renderiza cada marker como un `<g>` SVG o `<div>` absolutamente posicionado
- La posición en pantalla se calcula con `Projection.imageToScreen(marker.position)`
- Soporta iconos custom: string SVG, URL de imagen, o componente Vue
- Los markers emiten `@marker-click` con el marker y su `data`

### 5.3 Pisos / Niveles (Específico de indoor)

#### Múltiples pisos con `useZixLevels`
- `levels: ZixLevel[]` como prop — define todos los pisos disponibles
- `activeLevel: ref<ZixLevel>` — el piso actualmente visible
- Al cambiar de piso: `ImageLayer` carga el nuevo SVG, `VectorLayer` y `MarkerLayer` filtran por `floor`
- Los bounds del viewport se actualizan con los bounds del nuevo piso (los pisos pueden tener tamaños distintos)

#### LevelControl.vue
- Renderiza botones para cada piso (P1, P2, P3…)
- Emite `@level-change` con el nuevo nivel seleccionado
- Posicionado como overlay sobre el mapa (fuera del transform)

### 5.4 Eventos públicos (API de salida)

Estos son los eventos que `ZixMap.vue` emite hacia la app que lo usa:

| Evento | Payload | Cuándo |
|---|---|---|
| `@marker-click` | `{ marker: ZixMarker, event: MouseEvent }` | Usuario hace click en un marker |
| `@map-click` | `{ position: ZixPoint, event: MouseEvent }` | Click en área vacía del mapa |
| `@zoom-change` | `{ scale: number }` | Scale cambia |
| `@pan-change` | `{ offsetX: number, offsetY: number }` | Offset cambia |
| `@level-change` | `{ level: ZixLevel }` | Cambia el piso activo |
| `@bounds-change` | `{ bounds: ZixBounds }` | Los bounds visibles cambian |
| `@ready` | `{ map: ZixMapInstance }` | El mapa terminó de inicializar |

### 5.5 API pública de ZixMap (métodos expuestos)

Accesibles via `ref` del componente (`mapRef.value.fitToBounds(...)`):

```typescript
interface ZixMapInstance {
  fitToBounds(bounds: ZixBounds, padding?: number): void
  fitToNode(nodeId: string | number): void
  setZoom(scale: number): void
  setCenter(position: ZixPoint): void
  setLevel(levelId: string | number): void
  getViewportState(): ViewportState
  imageToScreen(point: ZixPoint): ZixPoint
  screenToImage(point: ZixPoint): ZixPoint
}
```

---

## 6. Props de ZixMap.vue

```typescript
// Props principales
interface ZixMapProps {
  // Pisos
  levels: ZixLevel[]                  // Requerido — todos los pisos disponibles
  initialLevel?: string | number      // ID del piso a mostrar al iniciar

  // Datos (opcionales — se pueden agregar dinámicamente)
  nodes?: ZixNode[]                   // Nodos de la API (ya mapeados)
  edges?: ZixEdge[]                   // Edges de la API (ya mapeados)
  markers?: ZixMarker[]               // Markers adicionales (custom)

  // Configuración
  options?: ZixMapOptions             // minZoom, maxZoom, etc.

  // Estilos de edges
  edgeStyle?: {
    color?: string                    // default: '#4A90E2'
    width?: number                    // default: 2
    opacity?: number                  // default: 0.7
    activeColor?: string              // color de edge en ruta activa
  }

  // Estilos de markers (default, se pueden overridear por marker)
  markerStyle?: {
    size?: number                     // default: 24
    color?: string
    labelVisible?: boolean
  }

  // Ancho/alto del contenedor
  width?: string                      // default: '100%'
  height?: string                     // default: '100%'
}
```

---

## 7. Uso típico desde la app

```vue
<template>
  <ZixMap
    ref="mapRef"
    :levels="levels"
    :nodes="mappedNodes"
    :edges="mappedEdges"
    :markers="activeMarkers"
    :options="{ minZoom: 0.5, maxZoom: 5 }"
    @marker-click="onMarkerClick"
    @level-change="onLevelChange"
    style="width: 100%; height: 600px"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ZixMap } from 'zix'
import type { ZixLevel, ZixNode, ZixEdge, ZixMarker } from 'zix'

// La app recibe datos de la API y los mapea a tipos Zix
const apiNodes = ref([]) // ← viene de la API (struct Node)
const apiEdges = ref([]) // ← viene de la API (struct Edge)

const levels: ZixLevel[] = [
  { id: 1, label: 'Piso 1', svgSrc: '/maps/floor-1.svg' },
  { id: 4, label: 'Piso 4', svgSrc: '/maps/eco-campus-f4.svg' },
]

// Mapeo de la API a tipos Zix — responsabilidad de la app, no de Zix
const mappedNodes = computed<ZixNode[]>(() =>
  apiNodes.value.map(n => ({
    id: n.id,
    position: { x: n.px, y: n.py },   // px/py del struct → ZixPoint
    floor: n.floor,
    label: n.label,
    code: n.code,
    type: n.type,
    isLandmark: n.isLandmark,
  }))
)

const mappedEdges = computed<ZixEdge[]>(() =>
  apiEdges.value.map(e => ({
    id: e.id,
    fromNodeId: e.fromNodeId,
    toNodeId: e.toNodeId,
    floor: e.floor,
    type: e.type,
    status: e.status,
    weight: e.weight,
  }))
)

// Markers extra (puntos de interés, destino, origen…)
const activeMarkers = ref<ZixMarker[]>([])

const mapRef = ref()

function onMarkerClick({ marker }) {
  console.log('Nodo seleccionado:', marker.data)
  // La app decide qué hacer — por ejemplo, llamar a la API de rutas
}

function onLevelChange({ level }) {
  console.log('Piso activo:', level.label)
}

// Ejemplo: centrar en un nodo
function focusNode(nodeId: number) {
  mapRef.value.fitToNode(nodeId)
}
</script>
```

---

## 8. Consideraciones críticas de implementación

### 8.1 SVG inline vs img tag

Con el SVG de eco-campus como `<img>`: simple, pero los elementos del plano no son interactivos.
Con el SVG inlineado en el DOM (`v-html`): los elementos tienen `pointer-events`, se puede hacer click en aulas directamente.

**Recomendación para Zix:** soportar ambos modos. `ImageLayer.vue` detecta si `svgSrc` es una URL o un string SVG.

### 8.2 Coordenadas de la API (px, py)

Los campos `px` y `py` del struct `Node` son coordenadas en el espacio de la imagen (píxeles del plano SVG). Zix los trata directamente como `ZixPoint { x: px, y: py }`. No hay transformación geográfica (latitud/longitud) — esto simplifica enormemente la `Projection`.

### 8.3 Edges de múltiples pisos

Un edge tiene un campo `floor`. Al renderizar, `VectorLayer` filtra `edges.filter(e => e.floor === activeLevel.id)`. Edges que conectan pisos distintos (escaleras, ascensores) se manejan mostrando solo el nodo de origen en el piso activo.

### 8.4 Filtrado por floor activo

Todos los datos se filtran por el piso activo:

```typescript
// En useZixLevels.ts
const visibleNodes = computed(() => nodes.filter(n => n.floor === activeLevel.value.id))
const visibleEdges = computed(() => edges.filter(e => e.floor === activeLevel.value.id))
const visibleMarkers = computed(() => markers.filter(m => m.floor === activeLevel.value.id))
```

### 8.5 Performance

- Aplicar el `transform` en un solo div contenedor — nunca re-posicionar cada marker individualmente
- Usar `will-change: transform` en el contenedor para que el browser use GPU
- Para mapas con muchos nodos (500+), considerar renderizado solo de lo visible (`visibleBounds`)
- Los edges como `<line>` SVG son más performantes que `<path>` complejos
- Usar `shallowRef` para `nodes` y `edges` si el array es grande

### 8.6 Pinch zoom — el bug más común

La math del pinch-zoom centrado en el centroide de los dos dedos es idéntica a la del wheel, pero usando el punto medio entre `touch[0]` y `touch[1]` como cursor:

```typescript
const centerX = (touch0.clientX + touch1.clientX) / 2
const centerY = (touch0.clientY + touch1.clientY) / 2
const distance = Math.hypot(touch1.clientX - touch0.clientX, touch1.clientY - touch0.clientY)
// newScale basado en ratio de distancias entre frames
```

Si no se calcula el centroide correctamente, el mapa "salta" durante el pinch.

### 8.7 Bounds del viewport vs bounds del piso

- **Bounds del piso:** definen el área del SVG (ej: 0,0 → 700,450 para eco-campus-f4)
- **Bounds del viewport:** el área actualmente visible en pantalla
- `clampToBounds: true` impide que el usuario haga pan fuera del área del plano
- Al cambiar de piso, resetear el viewport a `fitToBounds(newLevel.bounds)`

---

## 9. Lo que Zix NO hace (fuera de scope)

- ❌ Cálculo de rutas o pathfinding
- ❌ Llamadas a la API
- ❌ Interpretación de los enums `nodeType`, `edgeType`, `edgeStatus` — esos los interpreta la app
- ❌ Geocodificación ni coordenadas geográficas (lat/lng)
- ❌ Almacenamiento de datos
- ❌ Autenticación

Todo lo anterior es responsabilidad de la aplicación que usa Zix.

---

## 10. Orden de implementación sugerido

1. **`types/index.d.ts`** — definir todos los tipos antes de escribir código
2. **`core/Projection.ts`** — la math base, testeable sin Vue
3. **`core/Viewport.ts`** — el estado de cámara, testeable sin Vue
4. **`composables/useZixViewport.ts`** — hacer Viewport reactivo en Vue
5. **`components/ZixMap.vue`** — contenedor raíz con transform reactivo
6. **`components/layers/ImageLayer.vue`** — mostrar el SVG del plano
7. **`composables/useZixGestures.ts`** — drag y wheel zoom
8. **`components/ui/ZoomControl.vue`** — botones de zoom
9. **`components/layers/MarkerLayer.vue`** — nodos sobre el mapa
10. **`components/layers/VectorLayer.vue`** — edges entre nodos
11. **`composables/useZixLevels.ts`** — soporte de pisos
12. **`components/ui/LevelControl.vue`** — selector de piso
13. **`composables/useZixGestures.ts`** — agregar touch/pinch
14. **`utils/math.ts`** — helpers (clamp, fitToBounds, etc.)
15. **`index.ts`** — entry point y exports