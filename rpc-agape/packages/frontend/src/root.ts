export const root = document.getElementById("root") as HTMLElement;

export function tryGetProps() {
  const scriptElement = document.querySelector(
    'script#props[type="application/json"]'
  );

  if (!scriptElement) {
    return null;
  }

  scriptElement.remove();

  if (!scriptElement.textContent) {
    return null;
  }

  return JSON.parse(scriptElement.textContent);
}
