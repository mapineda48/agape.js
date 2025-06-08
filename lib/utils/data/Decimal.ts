import DecimalJs from 'decimal.js';

// 1) Creamos un nuevo constructor con la configuración que queremos
const ColombianDecimalBase = DecimalJs.clone({
    precision: 20,
    rounding: DecimalJs.ROUND_HALF_UP
});

// 2) Extendemos ese constructor “clonado” para añadir el toJSON()
export default class Decimal extends ColombianDecimalBase {
    toJSON() {
        // Siempre dos decimales, con HALF_UP
        return this.toFixed(2);
    }
}

export const EXT_DECIMAL = 42;

export const extensionCodecDecimal = {
    type: EXT_DECIMAL,

    encode: (obj: unknown) => {
        if (obj instanceof Decimal) {
            return new TextEncoder().encode(obj.toString());
        }
        return null;
    },

    decode: (buffer: Uint8Array) => {
        return new Decimal(new TextDecoder().decode(buffer));
    },
}