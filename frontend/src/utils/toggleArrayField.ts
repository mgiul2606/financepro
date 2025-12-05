export function toggleArrayField<T, K extends keyof T>(
  state: T,
  key: K,
  value: string
): T {
    const current = state[key];

  // Se la proprietà è undefined, trattiamo come array vuoto
  const arr = Array.isArray(current) ? current as string[] : [];

  const newArr = arr.includes(value)
    ? arr.filter(v => v !== value)
    : [...arr, value];

  return { ...state, [key]: newArr};
}