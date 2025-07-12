// src/data/DateTime.ts
import {
  addHours as dfAddHours,
  addDays as dfAddDays,
  isBefore as dfIsBefore,
  isAfter as dfIsAfter,
  differenceInHours as dfDifferenceInHours,
  differenceInMinutes as dfDifferenceInMinutes
} from 'date-fns';
import type { Extension } from 'msgpackr';

/**
 * Clase que extiende Date con helpers de date-fns.
 */
export default class DateTime extends Date {
  addHours(hours: number): DateTime {
    return new DateTime(dfAddHours(this, hours));
  }

  addDays(days: number): DateTime {
    return new DateTime(dfAddDays(this, days));
  }

  isBefore(date: Date | DateTime): boolean {
    return dfIsBefore(this, date);
  }

  isAfter(date: Date | DateTime): boolean {
    return dfIsAfter(this, date);
  }

  diffInHours(date: Date | DateTime): number {
    return dfDifferenceInHours(this, date);
  }

  diffInMinutes(date: Date | DateTime): number {
    return dfDifferenceInMinutes(this, date);
  }

  clone(): DateTime {
    return new DateTime(this);
  }
}

export const EXT_DATETIME = 40;

/**
 * Definición de extensión para msgpackr:
 * - pack: serializa el epoch en un Uint8Array (big-endian).
 * - unpack: reconstruye DateTime desde ese buffer.
 */
export const extensionCodecDateTime: Extension = {
  Class: DateTime,
  type: EXT_DATETIME,
  pack: (instance: DateTime): Uint8Array => {
    const epochMs = instance.getTime();
    const buffer = new ArrayBuffer(8);
    new DataView(buffer).setFloat64(0, epochMs, false); // big-endian
    return new Uint8Array(buffer);
  },
  unpack: (buf: Uint8Array): DateTime => {
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    const epochMs = view.getFloat64(0, false); // big-endian
    return new DateTime(epochMs);
  }
};
