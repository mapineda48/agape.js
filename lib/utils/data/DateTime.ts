import {
    addHours,
    addDays,
    isBefore,
    isAfter,
    differenceInHours,
    differenceInMinutes,
} from "date-fns";

export default class DateTime extends Date {
    // Agregar horas
    addHours(hours: number): DateTime {
        return new DateTime(addHours(this, hours));
    }

    // Agregar días
    addDays(days: number): DateTime {
        return new DateTime(addDays(this, days));
    }

    // Comparaciones
    isBefore(date: Date | DateTime): boolean {
        return isBefore(this, date);
    }

    isAfter(date: Date | DateTime): boolean {
        return isAfter(this, date);
    }

    // Diferencias
    diffInHours(date: Date | DateTime): number {
        return differenceInHours(this, date);
    }

    diffInMinutes(date: Date | DateTime): number {
        return differenceInMinutes(this, date);
    }

    // Clon
    clone(): DateTime {
        return new DateTime(this);
    }
}

export const EXT_DATETIME = 43;

export const extensionCodecDateTime = {
    type: EXT_DATETIME,

    encode: (input: unknown) => {
        if (input instanceof DateTime) {
            const epochMs = input.getTime(); // getTime() → número
            const buffer = new ArrayBuffer(8);
            new DataView(buffer).setFloat64(0, epochMs, false); // big-endian
            return new Uint8Array(buffer);
        }
        return null;
    },

    decode: (buffer: Uint8Array) => {
        const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        const epochMs = view.getFloat64(0, false); // big-endian
        return new DateTime(epochMs);
    },
};