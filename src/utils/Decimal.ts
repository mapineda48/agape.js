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