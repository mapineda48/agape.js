
/**
 * Ceder el control al event loop para que el navegador pueda actualizar la UI antes de continuar con una función costosa
 */
export default function yieldToUI(time = 0) {
    return new Promise(resolve => setTimeout(resolve, time));
}
