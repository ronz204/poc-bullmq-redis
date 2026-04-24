<script setup lang="ts">
import type { UseZixViewportReturn } from "@zix/types/Composables";
import { inject, computed } from "vue";

const props = defineProps({
  position: {
    type: String as () => 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left',
    default: 'top-right',
  },
  step: {
    type: Number,
    default: 0.25,
  },
});

const viewport = inject<UseZixViewportReturn>('zixViewport');

const canZoomIn = computed(() => {
  if (!viewport) return false;
  return viewport.scale.value < (viewport.viewport.getTransform().scale * 4);
});

const canZoomOut = computed(() => {
  if (!viewport) return false;
  return viewport.scale.value > 0.5;
});

function zoomIn() {
  if (!viewport) return;
  const newZoom = viewport.scale.value + props.step;
  viewport.setZoom(newZoom);
};

function zoomOut() {
  if (!viewport) return;
  const newZoom = viewport.scale.value - props.step;
  viewport.setZoom(newZoom);
};

const positionClasses = computed(() => ({
  'top-4 right-4': props.position === 'top-right',
  'top-4 left-4': props.position === 'top-left',
  'bottom-4 right-4': props.position === 'bottom-right',
  'bottom-4 left-4': props.position === 'bottom-left'
}));
</script>

<template>
  <div class="flex flex-col gap-1 absolute z-1000" :class="positionClasses">
    <button
      class="bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-lg shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-800 flex items-center justify-center w-10 h-10 border border-gray-700 active:scale-95"
      :disabled="!canZoomIn" @click="zoomIn" title="Zoom in">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>

    <button
      class="bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-lg shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-800 flex items-center justify-center w-10 h-10 border border-gray-700 active:scale-95"
      :disabled="!canZoomOut" @click="zoomOut" title="Zoom out">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>

    <!-- Zoom level indicator -->
    <div
      class="bg-gray-800 text-gray-300 text-xs font-mono rounded-lg shadow-lg px-2 py-1 text-center border border-gray-700">
      {{ Math.round((viewport?.scale.value ?? 1) * 100) }}%
    </div>
  </div>
</template>
