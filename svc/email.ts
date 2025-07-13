import { eq } from "drizzle-orm";
import { db } from "#lib/db";
import { agape } from "#models/agape";
import MailManager from "#lib/services/mail/MailManager";
import type { IMail } from "#lib/services/mail/MailManager";


const DAILY_EMAIL_LIMIT = process.env.NODE_ENV === "production" ? 10 : 9999;

/**
 * Envía un correo si no se ha superado el límite diario.
 */
export async function sendEmail(message: IMail) {
    const [record] = await db.select().from(agape).where(eq(agape.key, "mailStats"));

    // Obtener el estado actual del control de correos
    const mailStats: MailControl = record?.value as MailControl ?? {
        amount: 0,
        lastDate: Date.now(),
    };

    const today = new Date();
    const lastSentDate = new Date(mailStats.lastDate);

    const isSameDay =
        today.getFullYear() === lastSentDate.getFullYear() &&
        today.getMonth() === lastSentDate.getMonth() &&
        today.getDay() === lastSentDate.getDay();

    // Si no es el mismo día, reiniciar el contador y establecer fecha actual
    if (!isSameDay) {
        mailStats.amount = 0;
        mailStats.lastDate = Date.now();
    }

    // Validar si se superó el límite diario
    if (mailStats.amount >= 10) {
        throw new Error("Daily email limit reached");
    }

    // Enviar el correo
    await MailManager.sendMail(message);

    // Actualizar estado del contador
    mailStats.amount += 1;
    mailStats.lastDate = Date.now();

    // Guardar de nuevo en la base de datos
    await db
        .insert(agape)
        .values({ value: mailStats, key: "mailStats" })
        .onConflictDoUpdate({
            target: agape.key,
            set: {
                value: mailStats
            }
        });
}

/**
 * Control del envío de correos diarios
 */
interface MailControl {
    amount: number;
    lastDate: number; // usar timestamp para facilidad
}