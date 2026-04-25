<script setup lang="ts">
import type { ZixBounds } from "@zix/types/Geometric";
import type { ZixMapOptions } from "@zix/types/Options";

import { ref, onMounted, provide, type PropType } from "vue";
import { useZixViewport } from "@zix/composables/useZixViewport";
import { useZixGestures } from "@zix/composables/useZixGestures";

const props = defineProps({
  options: {
    type: Object as PropType<ZixMapOptions>,
    default: () => ({
      minZoom: 0.5,
      maxZoom: 4,
      initialZoom: 1,
      clampToBounds: true,
      wheelSensitivity: 0.001
    }),
  },
  bounds: {
    type: Object as PropType<ZixBounds>,
    required: false
  },
});

const mapContainer = ref<HTMLDivElement>();
const viewport = useZixViewport(props.options);

provide("zixViewport", viewport);
provide("zixMapContainer", mapContainer);

useZixGestures(mapContainer, viewport, { wheelSensitivity: props.options.wheelSensitivity });

onMounted(() => {
  if (props.bounds && mapContainer.value) {
    const rect = mapContainer.value.getBoundingClientRect();
    viewport.fitToBounds(props.bounds, { width: rect.width, height: rect.height }, 40);
  };
});

defineExpose({
  viewport,
  fitToBounds: viewport.fitToBounds,
  setZoom: viewport.setZoom,
  getContainer: () => mapContainer.value
});
</script>

<template>
  <div ref="mapContainer" class="relative w-full h-full overflow-hidden cursor-grab bg-gray-950 select-none touch-none">

    <!-- Transformed container — all content goes here (SVG, markers, etc.) -->
    <div class="absolute top-0 left-0 origin-top-left will-change-transform"
      :style="{ transform: viewport.transformMatrix.value }">
      <slot name="layers" />
    </div>

    <!-- UI controls — outside the transform -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="pointer-events-auto">
        <slot name="controls" />
      </div>
    </div>
  </div>
</template>
