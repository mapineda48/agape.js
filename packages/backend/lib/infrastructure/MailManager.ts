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

  /**
   * Sends an email without attachments
   */
  public static async sendMail(msg: IMail): Promise<void> {
    if (!MailManager.isEnabled() || !resend) {
      throw new Error(
        "❌ Mail service not initialized - RESEND_API_KEY is required",
      );
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

  /**
   * Sends an email with file attachments
   * @param msg - The email message with attachments
   */
  public static async sendMailWithAttachments(
    msg: IMailWithAttachments,
  ): Promise<void> {
    if (!MailManager.isEnabled() || !resend) {
      throw new Error(
        "❌ Mail service not initialized - RESEND_API_KEY is required",
      );
    }

    try {
      // Convert attachments to Resend format
      const attachments = msg.attachments.map((att) => ({
        filename: att.filename,
        content: att.content, // Base64 encoded content
      }));

      const { data, error } = await resend.emails.send({
        from: msg.from ?? "noreply@mapineda48.de",
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
        attachments,
      });

      if (error) {
        log.error("Error sending email with attachments", error);
        throw new Error("❌ Error sending email");
      }

      log.info("✅ Email with attachments sent successfully", {
        id: data?.id,
        attachmentCount: attachments.length,
      });
    } catch (error) {
      log.error("Error sending email with attachments", error);
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

export interface IMailAttachment {
  /** Filename with extension (e.g., "invoice.pdf") */
  filename: string;
  /** Base64 encoded file content */
  content: string;
}

export interface IMailWithAttachments extends IMail {
  attachments: IMailAttachment[];
}
