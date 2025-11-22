import logger from "#lib/log/logger";
import sgMail from "@sendgrid/mail";

const { SENDGRID_API_KEY = "" } = process.env;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  //logger.scope('Mail').info("✅ Enabled");
} else {
  //logger.scope('Mail').warn("❌ Disabled")
}

export default class MailManager {
  public static async sendMail(msg: IMail) {
    try {
      await sgMail.send({
        ...msg,
        from: "noreply@mapineda48.de",
      });

      logger.scope("Mail").info("✅ Email sent successfully");
    } catch (error) {
      logger.scope("Mail").error("Error sending email", error);

      throw new Error("❌ Error sending email");
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
