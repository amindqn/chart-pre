const PALETTE = [
  '#2563eb', // blue
  '#a855f7', // purple
  '#f97316', // orange
  '#22c55e', // green
  '#ef4444', // red
  '#14b8a6', // teal
  '#f43f5e', // rose
  '#0ea5e9', // sky
  '#facc15', // amber
  '#8b5cf6', // violet
];

let nextColorIndex = 0;

export const getNextColor = () => {
  const color = PALETTE[nextColorIndex % PALETTE.length];
  nextColorIndex += 1;
  return color;
};

export const resetColorCycle = () => {
  nextColorIndex = 0;
};
