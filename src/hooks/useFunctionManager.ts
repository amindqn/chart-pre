import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DEFAULT_FUNCTION } from '../constants/presets';
import type { GraphedFunction } from '../types/plot';
import { getNextColor, resetColorCycle } from '../utils/colors';
import { createFunctionId } from '../utils/id';

const initFunctions = () => {
  resetColorCycle();
  const first: GraphedFunction = {
    ...DEFAULT_FUNCTION,
    id: createFunctionId(),
    color: getNextColor(),
  };
  return [first];
};

export const useFunctionManager = () => {
  const seedRef = useRef<GraphedFunction[] | null>(null);
  if (!seedRef.current) {
    seedRef.current = initFunctions();
  }

  const [functions, setFunctions] = useState<GraphedFunction[]>(
    () => seedRef.current as GraphedFunction[]
  );
  const [activeFunctionId, setActiveFunctionId] = useState<string>(
    () => functions[0]?.id ?? createFunctionId()
  );

  useEffect(() => {
    if (
      functions.length > 0 &&
      !functions.some((fn) => fn.id === activeFunctionId)
    ) {
      setActiveFunctionId(functions[0].id);
    }
  }, [functions, activeFunctionId]);

  const updateFunction = useCallback(
    (id: string, patch: Partial<GraphedFunction>) => {
      setFunctions((prev) =>
        prev.map((fn) => (fn.id === id ? { ...fn, ...patch } : fn))
      );
    },
    []
  );

  const removeFunction = useCallback(
    (id: string) => {
      setFunctions((prev) => {
        if (prev.length === 0) {
          return prev;
        }
        const next = prev.filter((fn) => fn.id !== id);
        if (!next.length) {
          return next;
        }
        if (!next.some((fn) => fn.id === activeFunctionId)) {
          setActiveFunctionId(next[0].id);
        }
        return next;
      });
    },
    [activeFunctionId]
  );

  const addFunction = useCallback(() => {
    const nextFn: GraphedFunction = {
      id: createFunctionId(),
      label: `f${functions.length + 1}(x)`,
      expression: '',
      color: getNextColor(),
      visible: true,
    };
    setFunctions((prev) => [...prev, nextFn]);
    setActiveFunctionId(nextFn.id);
  }, [functions.length]);

  return useMemo(
    () => ({
      functions,
      activeFunctionId,
      setActiveFunctionId,
      updateFunction,
      removeFunction,
      addFunction,
    }),
    [functions, activeFunctionId, updateFunction, removeFunction, addFunction]
  );
};
