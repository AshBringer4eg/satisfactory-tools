import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import type { ColorCode, SatisfactoryColor } from "@/data/colors";
import type { FloatingMove, GridToken, ReorderCommit } from "./types";

const REORDER_STAGGER_STEP = 0.018;
const REORDER_STAGGER_MAX = 0.42;
const FLOAT_MOVE_MIN_DURATION = 0.28;
const FLOAT_MOVE_MAX_DURATION = 1.2;
const FLOAT_MOVE_PIXELS_PER_SECOND = 680;

interface UseColorReorderAnimationParams {
  filteredColors: SatisfactoryColor[];
}

interface UseColorReorderAnimationResult {
  movingColorCode: ColorCode | null;
  floatingMove: FloatingMove | null;
  gridTokens: GridToken[];
  reorderDelayByCode: Map<ColorCode, number>;
  floatingMoveDuration: number;
  placeholderRef: MutableRefObject<HTMLDivElement | null>;
  registerSwatchNode: (
    colorCode: ColorCode,
    node: HTMLDivElement | null,
  ) => void;
  startReorder: (params: ReorderCommit) => void;
  completeFloatingMove: () => void;
  reset: () => void;
}

export const useColorReorderAnimation = ({
  filteredColors,
}: UseColorReorderAnimationParams): UseColorReorderAnimationResult => {
  const [movingColorCode, setMovingColorCode] = useState<ColorCode | null>(
    null,
  );
  const [floatingMove, setFloatingMove] = useState<FloatingMove | null>(null);
  const movingIndicatorTimeoutRef = useRef<number | null>(null);
  const previousOrderRef = useRef<ColorCode[]>([]);
  const swatchNodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const placeholderRef = useRef<HTMLDivElement | null>(null);

  const clearMovingIndicatorTimeout = useCallback(() => {
    if (movingIndicatorTimeoutRef.current === null) return;
    window.clearTimeout(movingIndicatorTimeoutRef.current);
    movingIndicatorTimeoutRef.current = null;
  }, []);

  useEffect(() => {
    return clearMovingIndicatorTimeout;
  }, [clearMovingIndicatorTimeout]);

  const scheduleMovingIndicatorReset = useCallback(
    (delay = 900) => {
      clearMovingIndicatorTimeout();

      movingIndicatorTimeoutRef.current = window.setTimeout(() => {
        setMovingColorCode(null);
        movingIndicatorTimeoutRef.current = null;
      }, delay);
    },
    [clearMovingIndicatorTimeout],
  );

  const registerSwatchNode = useCallback(
    (colorCode: ColorCode, node: HTMLDivElement | null) => {
      if (node) swatchNodeRefs.current[colorCode] = node;
      else delete swatchNodeRefs.current[colorCode];
    },
    [],
  );

  const currentOrder = useMemo(
    () => filteredColors.map((color) => color.code),
    [filteredColors],
  );

  const reorderDelayByCode = useMemo(() => {
    const delays = new Map<ColorCode, number>();

    if (!movingColorCode) return delays;

    const previousOrder = previousOrderRef.current;
    if (
      previousOrder.length !== currentOrder.length ||
      currentOrder.length === 0
    ) {
      return delays;
    }

    const previousIndexByCode = new Map<ColorCode, number>();
    previousOrder.forEach((code, index) => {
      previousIndexByCode.set(code, index);
    });

    for (const code of currentOrder) {
      if (!previousIndexByCode.has(code)) return delays;
    }

    const movedPrevIndex = previousIndexByCode.get(movingColorCode);
    const movedNextIndex = currentOrder.indexOf(movingColorCode);

    if (
      movedPrevIndex === undefined ||
      movedNextIndex < 0 ||
      movedPrevIndex === movedNextIndex
    ) {
      return delays;
    }

    if (movedPrevIndex > movedNextIndex) {
      // Moving up: animate neighbors below the old slot first, then propagate upward.
      currentOrder.forEach((code) => {
        if (code === movingColorCode) return;
        const prevIndex = previousIndexByCode.get(code);
        if (prevIndex === undefined) return;
        if (prevIndex >= movedNextIndex && prevIndex < movedPrevIndex) {
          const step = movedPrevIndex - 1 - prevIndex;
          delays.set(
            code,
            Math.min(step * REORDER_STAGGER_STEP, REORDER_STAGGER_MAX),
          );
        }
      });
    } else {
      // Moving down: animate neighbors above the old slot first, then propagate downward.
      currentOrder.forEach((code) => {
        if (code === movingColorCode) return;
        const prevIndex = previousIndexByCode.get(code);
        if (prevIndex === undefined) return;
        if (prevIndex > movedPrevIndex && prevIndex <= movedNextIndex) {
          const step = prevIndex - (movedPrevIndex + 1);
          delays.set(
            code,
            Math.min(step * REORDER_STAGGER_STEP, REORDER_STAGGER_MAX),
          );
        }
      });
    }

    return delays;
  }, [movingColorCode, currentOrder]);

  const gridTokens = useMemo<GridToken[]>(() => {
    if (!floatingMove) {
      return filteredColors.map((color) => ({ kind: "color", color }));
    }

    const withoutMoving = filteredColors.filter(
      (color) => color.code !== floatingMove.colorCode,
    );
    const insertIndex = Math.max(
      0,
      Math.min(floatingMove.targetIndex, withoutMoving.length),
    );
    const tokens = withoutMoving.map(
      (color) => ({ kind: "color", color }) as GridToken,
    );

    tokens.splice(insertIndex, 0, {
      kind: "placeholder",
      key: `floating-placeholder-${floatingMove.colorCode}`,
    });

    return tokens;
  }, [filteredColors, floatingMove]);

  const floatingMoveDuration = useMemo(() => {
    if (!floatingMove?.toRect) return FLOAT_MOVE_MIN_DURATION;

    const dx = floatingMove.toRect.left - floatingMove.fromRect.left;
    const dy = floatingMove.toRect.top - floatingMove.fromRect.top;
    const distance = Math.hypot(dx, dy);
    const duration = distance / FLOAT_MOVE_PIXELS_PER_SECOND;

    return Math.min(
      FLOAT_MOVE_MAX_DURATION,
      Math.max(FLOAT_MOVE_MIN_DURATION, duration),
    );
  }, [floatingMove]);

  useEffect(() => {
    if (!floatingMove || floatingMove.toRect) return;

    const placeholderNode = placeholderRef.current;
    if (!placeholderNode) return;

    const animationFrame = window.requestAnimationFrame(() => {
      const rect = placeholderNode.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      setFloatingMove((current) => {
        if (!current || current.toRect) return current;
        return {
          ...current,
          toRect: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          },
        };
      });
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [floatingMove, gridTokens]);

  useEffect(() => {
    previousOrderRef.current = currentOrder;
  }, [currentOrder]);

  const startReorder = useCallback(
    ({ colorCode, color, sourceIndex, targetIndex }: ReorderCommit) => {
      setMovingColorCode(colorCode);

      const sourceNode = swatchNodeRefs.current[colorCode];
      const sourceRect = sourceNode?.getBoundingClientRect();
      const canUseFloatingMove =
        !floatingMove &&
        sourceRect !== undefined &&
        sourceIndex >= 0 &&
        targetIndex >= 0 &&
        sourceIndex !== targetIndex;

      if (canUseFloatingMove) {
        setFloatingMove({
          colorCode,
          color,
          targetIndex,
          fromRect: {
            top: sourceRect.top,
            left: sourceRect.left,
            width: sourceRect.width,
            height: sourceRect.height,
          },
          toRect: null,
        });
        return;
      }

      scheduleMovingIndicatorReset(850);
    },
    [floatingMove, scheduleMovingIndicatorReset],
  );

  const completeFloatingMove = useCallback(() => {
    if (!floatingMove?.toRect) return;
    setFloatingMove(null);
    setMovingColorCode(null);
  }, [floatingMove]);

  const reset = useCallback(() => {
    clearMovingIndicatorTimeout();
    setMovingColorCode(null);
    setFloatingMove(null);
  }, [clearMovingIndicatorTimeout]);

  return {
    movingColorCode,
    floatingMove,
    gridTokens,
    reorderDelayByCode,
    floatingMoveDuration,
    placeholderRef,
    registerSwatchNode,
    startReorder,
    completeFloatingMove,
    reset,
  };
};
