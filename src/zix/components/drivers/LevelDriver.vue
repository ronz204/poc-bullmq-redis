<script setup lang="ts">
import type { ZixLevel } from "@zix/types/Geometric";
import { ref, computed } from "vue";

const props = withDefaults(defineProps<{
  levels: ZixLevel[];
  initialActive?: number;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}>(), {
  position: "bottom-left"
});

const emit = defineEmits<{
  "update:active": [id: number];
}>();

const activeId = ref<number>(props.initialActive ?? props.levels[0]?.id);

function select(id: number): void {
  activeId.value = id;
  emit("update:active", id);
};

const positionClasses = computed(() => ({
  "top-4 right-4": props.position === "top-right",
  "top-4 left-4": props.position === "top-left",
  "bottom-4 right-4": props.position === "bottom-right",
  "bottom-4 left-4": props.position === "bottom-left"
}));
</script>

<template>
  <div class="flex flex-col gap-1 absolute z-1000" :class="positionClasses">
    <button v-for="level in levels" :key="level.id"
      class="rounded-lg shadow-lg transition-all flex items-center justify-center w-10 h-10 border text-xs font-bold active:scale-95"
      :class="level.id === activeId
        ? 'bg-blue-600 border-blue-500 hover:bg-blue-500 text-white'
        : 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-100'"
      :title="level.label"
      @click="select(level.id)">
      {{ level.label }}
    </button>
  </div>
</template>
