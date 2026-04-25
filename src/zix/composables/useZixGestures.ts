import type { Ref } from "vue";
import type { UseZixViewportReturn } from "@zix/types/Composables";

import { onMounted, onUnmounted } from "vue";

export interface UseZixGesturesOptions {
  wheelSensitivity?: number;
};

export function useZixGestures(
  container: Ref<HTMLElement | undefined>,
  viewport: UseZixViewportReturn,
  options: UseZixGesturesOptions = {}
): void {
  // Plain variables — no need for reactivity here
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let touchStart: { x: number; y: number } | null = null;
  let pinchStart: { distance: number; center: { x: number; y: number } } | null = null;

  // ── Wheel ──────────────────────────────────────────────────────────

  function onWheel(event: WheelEvent): void {
    event.preventDefault();

    const el = container.value;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const sensitivity = options.wheelSensitivity ?? 0.001;
    const delta = -event.deltaY * sensitivity;
    const newScale = viewport.scale.value * (1 + delta);

    viewport.zoomAt(
      { x: event.clientX - rect.left, y: event.clientY - rect.top },
      newScale
    );
  };

  // ── Mouse ──────────────────────────────────────────────────────────

  function onMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return;

    isDragging = true;
    dragStart = { x: event.clientX, y: event.clientY };

    if (container.value) container.value.style.cursor = "grabbing";
  };

  function onMouseMove(event: MouseEvent): void {
    if (!isDragging) return;

    viewport.pan(event.clientX - dragStart.x, event.clientY - dragStart.y);
    dragStart = { x: event.clientX, y: event.clientY };
  };

  function onMouseUp(): void {
    isDragging = false;
    if (container.value) container.value.style.cursor = "grab";
  };

  function onMouseLeave(): void {
    if (!isDragging) return;
    isDragging = false;
    if (container.value) container.value.style.cursor = "grab";
  };

  // ── Touch ──────────────────────────────────────────────────────────

  function onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      const t = event.touches[0];
      touchStart = { x: t.clientX, y: t.clientY };
    } else if (event.touches.length === 2) {
      const t1 = event.touches[0];
      const t2 = event.touches[1];
      const el = container.value;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const distance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

      pinchStart = {
        distance,
        center: {
          x: (t1.clientX + t2.clientX) / 2 - rect.left,
          y: (t1.clientY + t2.clientY) / 2 - rect.top
        }
      };
    };
  };

  function onTouchMove(event: TouchEvent): void {
    event.preventDefault();

    if (event.touches.length === 1 && touchStart) {
      const t = event.touches[0];
      viewport.pan(t.clientX - touchStart.x, t.clientY - touchStart.y);
      touchStart = { x: t.clientX, y: t.clientY };
    } else if (event.touches.length === 2 && pinchStart) {
      const t1 = event.touches[0];
      const t2 = event.touches[1];
      const distance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

      viewport.zoomAt(pinchStart.center, viewport.scale.value * (distance / pinchStart.distance));
      pinchStart.distance = distance;
    };
  };

  function onTouchEnd(): void {
    touchStart = null;
    pinchStart = null;
  };

  // ── Lifecycle ──────────────────────────────────────────────────────

  onMounted(() => {
    const el = container.value;
    if (!el) return;

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseup", onMouseUp);
    el.addEventListener("mouseleave", onMouseLeave);
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
  });

  onUnmounted(() => {
    const el = container.value;
    if (!el) return;

    el.removeEventListener("wheel", onWheel);
    el.removeEventListener("mousedown", onMouseDown);
    el.removeEventListener("mousemove", onMouseMove);
    el.removeEventListener("mouseup", onMouseUp);
    el.removeEventListener("mouseleave", onMouseLeave);
    el.removeEventListener("touchstart", onTouchStart);
    el.removeEventListener("touchmove", onTouchMove);
    el.removeEventListener("touchend", onTouchEnd);
  });
};
