import logger from "#lib/log/logger";
import sgMail from "@sendgrid/mail";

const { SENDGRID_API_KEY = "" } = process.env;

if (SENDGRID_API_KEY) {
    sgMail.setApiKey(SENDGRID_API_KEY);
    //logger.log("[MailManager] ✅ Enabled");
} else {
    //logger.warning("[MailManager] ❌ Disabled")
}


export default class MailManager {
    public static async sendMail(msg: IMail) {
        try {
            await sgMail.send({
                ...msg,
                from: "noreply@mapineda48.de"
            });

            logger.log("[MailManager] ✅ Correo enviado correctamente")
        } catch (error) {
            logger.error(error);

            throw new Error("❌ Error al enviar el correo")
        }
    }
}

/**
 * Types
 */
export interface IMail {
    to: string;
    subject: string;
    html: string;
}