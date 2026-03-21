import DecimalJs from 'decimal.js';
// 3) Código de extensión
export const EXT_DECIMAL = 41;
// 1) Creamos el clon con nuestra configuración colombiana
const ColombianDecimalBase = DecimalJs.clone({
    precision: 20,
    rounding: DecimalJs.ROUND_HALF_UP
});
// 2) Extendemos para añadir toJSON()
export default class Decimal extends ColombianDecimalBase {
    toJSON() {
        // Siempre dos decimales, HALF_UP
        return this.toFixed(2);
    }
}
// 4) Definición de extensión para msgpackr
export const extensionCodecDecimal = {
    Class: Decimal, // permite serializar / deserializar como instancia
    type: EXT_DECIMAL, // valor entre 1–100
    pack: (instance) => {
        // devuelve Uint8Array con la representación textual
        return new TextEncoder().encode(instance.toString());
    },
    unpack: (buf) => {
        // reconstruye la instancia desde el texto
        return new Decimal(new TextDecoder().decode(buf));
    }
};
