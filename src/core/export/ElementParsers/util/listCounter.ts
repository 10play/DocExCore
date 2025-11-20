let listInstance = 0;

export function resetListCounter() {
  listInstance = 0;
}

export function nextListInstance(): number {
  return ++listInstance;
}
