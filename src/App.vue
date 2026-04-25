<script setup lang="ts">
import type { ZixLevel } from "@zix/types/Geometric";
import type { ZixMapOptions } from "@zix/types/Options";

import { ref, watch, nextTick } from "vue";
import ZixMap from "@zix/components/ZixMap.vue";
import OverlayPane from "@zix/components/panes/OverlayPane.vue";
import ZoomDriver from "@zix/components/drivers/ZoomDriver.vue";
import LevelDriver from "@zix/components/drivers/LevelDriver.vue";
import { useZixLevels } from "@zix/composables/useZixLevels";

const mapOptions: ZixMapOptions = {
  minZoom: 0.3,
  maxZoom: 5,
  initialZoom: 0.8,
  clampToBounds: true,
  wheelSensitivity: 0.001
};

const levels: ZixLevel[] = [
  {
    id: 4,
    label: "F4",
    imagePath: "/src/assets/images/eco-campus-f4.svg",
    bounds: { min: { x: 0, y: 0 }, max: { x: 700, y: 450 } }
  },
  {
    id: 5,
    label: "F5",
    imagePath: "/src/assets/images/eco-campus-f5.svg",
    bounds: { min: { x: 0, y: 0 }, max: { x: 700, y: 450 } }
  }
];

const { activeLevel, setLevel } = useZixLevels(levels);
const mapRef = ref<InstanceType<typeof ZixMap>>();

function fitView(): void {
  if (mapRef.value) {
    const container = mapRef.value.getContainer();
    if (container) {
      const rect = container.getBoundingClientRect();
      mapRef.value.fitToBounds(activeLevel.value.bounds, { width: rect.width, height: rect.height }, 60);
    };
  };
};

function resetView(): void {
  fitView();
};

watch(activeLevel, () => nextTick(fitView));
</script>

<template>
  <div class="w-screen h-screen flex flex-col bg-gray-950 text-gray-100">
    <!-- Header -->
    <header class="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800 shadow-lg">
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 flex items-center justify-center bg-linear-to-br from-blue-500 to-purple-600 rounded-lg text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
        <div>
          <h1 class="text-xl font-bold text-gray-100">Zix Indoor Map</h1>
          <p class="text-sm text-gray-400">Campus Map Renderer</p>
        </div>
      </div>

      <button @click="resetView"
        class="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium rounded-lg border border-gray-700 transition-all hover:shadow-lg active:scale-95"
        title="Reset view">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
          <path d="M21 3v5h-5"></path>
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
          <path d="M3 21v-5h5"></path>
        </svg>
        Reset View
      </button>
    </header>

    <!-- Map Container -->
    <main class="flex-1 relative overflow-hidden">
      <ZixMap ref="mapRef" :options="mapOptions" :bounds="activeLevel.bounds" class="w-full h-full">
        <template #layers>
          <OverlayPane :image-path="activeLevel.imagePath" :bounds="activeLevel.bounds" />
        </template>

        <template #controls>
          <ZoomDriver position="top-right" />
          <LevelDriver :levels="levels" :initial-active="levels[0].id" @update:active="setLevel" />
        </template>
      </ZixMap>
    </main>

    <!-- Footer Info -->
    <footer class="flex items-center justify-between px-6 py-3 bg-gray-900 border-t border-gray-800">
      <div class="flex items-center gap-6 text-sm text-gray-400">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span>Map Active</span>
        </div>
        <div>
          Zoom: {{ Math.round((mapRef?.viewport.scale.value ?? 1) * 100) }}%
        </div>
        <div>
          Bounds: {{ activeLevel.bounds.max.x }} × {{ activeLevel.bounds.max.y }}px
        </div>
      </div>

      <div class="text-sm text-gray-500">
        Vue 3 + TypeScript | Indoor Mapping
      </div>
    </footer>
  </div>
</template>
