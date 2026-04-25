<script setup lang="ts">
import type { ZixBounds } from "@zix/types/Geometric";
import type { UseZixViewportReturn } from "@zix/types/Composables";

import { inject, watch } from "vue";

const props = defineProps<{
  imagePath: string
  bounds: ZixBounds
}>()

const viewport = inject<UseZixViewportReturn>('zixViewport')

watch(() => props.bounds, (b) => { viewport?.setBounds(b) }, { immediate: true })
</script>

<template>
  <img :src="imagePath" class="block pointer-events-none" />
</template>
