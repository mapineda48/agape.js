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
