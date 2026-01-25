/**
 * Virtual module namespace for Vite plugin imports.
 */
export const VIRTUAL_MODULE_NAMESPACE = "#services";

/**
 * Internal virtual module ID prefix.
 * We use a different string than the namespace to avoid using '#'
 * in the internal ID, which browser/Vite treats as an URL fragment.
 */
export const VIRTUAL_MODULE_ID = "virtual:services";

/**
 * Virtual module prefix used by Vite for internal resolution.
 */
export const VIRTUAL_MODULE_PREFIX = "\0";
