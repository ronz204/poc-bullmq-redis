import type { Ref } from "vue";
import type { ZixLevel } from "@zix/types/Geometric";

import { ref } from "vue";

export interface UseZixLevelsReturn {
  activeLevel: Ref<ZixLevel>;
  setLevel: (id: number) => void;
};

export function useZixLevels(
  levels: ZixLevel[],
  initialId?: number
): UseZixLevelsReturn {
  const initial = levels.find(l => l.id === initialId) ?? levels[0];
  const activeLevel = ref<ZixLevel>(initial);

  function setLevel(id: number): void {
    const found = levels.find(l => l.id === id);
    if (found) activeLevel.value = found;
  };

  return { activeLevel, setLevel };
};
