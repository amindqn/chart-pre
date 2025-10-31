const randomSegment = () => Math.random().toString(36).slice(2, 10);

export const createFunctionId = () =>
  `func-${randomSegment()}-${Date.now().toString(36)}`;

export const createSeriesId = () =>
  `series-${randomSegment()}-${Date.now().toString(36)}`;

export const createPointId = () =>
  `point-${randomSegment()}-${Date.now().toString(36)}`;
