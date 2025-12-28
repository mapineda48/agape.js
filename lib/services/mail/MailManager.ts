import logger from "#lib/log/logger";
import { Resend } from "resend";

const log = logger.scope("Mail");

let resend: Resend | null = null;

export default class MailManager {
  /**
   * Initializes the mail service with the provided API key.
   * If apiKey is undefined or empty, the service will be disabled.
   */
  public static init(apiKey: string | undefined): typeof MailManager {
    if (apiKey) {
      resend = new Resend(apiKey);
      log.info("✅ Enabled");
    } else {
      resend = null;
      log.warn("❌ Disabled - RESEND_API_KEY not set");
    }

    return MailManager;
  }

  private static isEnabled(): boolean {
    return resend !== null;
  }

  public static async sendMail(msg: IMail): Promise<void> {
    if (!MailManager.isEnabled() || !resend) {
      throw new Error("❌ Mail service not initialized - RESEND_API_KEY is required");
    }

    try {
      const { data, error } = await resend.emails.send({
        from: msg.from ?? "noreply@mapineda48.de",
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
      });

      if (error) {
        log.error("Error sending email", error);
        throw new Error("❌ Error sending email");
      }

      log.info("✅ Email sent successfully", { id: data?.id });
    } catch (error) {
      log.error("Error sending email", error);
      throw new Error("❌ Error sending email");
    }
  }
}

/**
 * Types
 */
export interface IMail {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}
