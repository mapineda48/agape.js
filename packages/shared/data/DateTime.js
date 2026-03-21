import { addHours as dfAddHours, addDays as dfAddDays, isBefore as dfIsBefore, isAfter as dfIsAfter, differenceInHours as dfDifferenceInHours, differenceInMinutes as dfDifferenceInMinutes } from 'date-fns';
export const EXT_DATETIME = 40;
/**
 * Clase que extiende Date con helpers de date-fns.
 */
export default class DateTime extends Date {
    addHours(hours) {
        return new DateTime(dfAddHours(this, hours));
    }
    addDays(days) {
        return new DateTime(dfAddDays(this, days));
    }
    isBefore(date) {
        return dfIsBefore(this, date);
    }
    isAfter(date) {
        return dfIsAfter(this, date);
    }
    diffInHours(date) {
        return dfDifferenceInHours(this, date);
    }
    diffInMinutes(date) {
        return dfDifferenceInMinutes(this, date);
    }
    clone() {
        return new DateTime(this);
    }
}
/**
 * Definición de extensión para msgpackr:
 * - pack: serializa el epoch en un Uint8Array (big-endian).
 * - unpack: reconstruye DateTime desde ese buffer.
 */
export const extensionCodecDateTime = {
    Class: DateTime,
    type: EXT_DATETIME,
    pack: (instance) => {
        const epochMs = instance.getTime();
        const buffer = new ArrayBuffer(8);
        new DataView(buffer).setFloat64(0, epochMs, false); // big-endian
        return new Uint8Array(buffer);
    },
    unpack: (buf) => {
        const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
        const epochMs = view.getFloat64(0, false); // big-endian
        return new DateTime(epochMs);
    }
};
