import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import MailManager, { type IMail } from "./MailManager";

// Mock resend client
const mockResendEmails = {
    send: vi.fn().mockResolvedValue({ data: { id: "mock-email-id" }, error: null }),
};

// Mock Resend as a class constructor
vi.mock("resend", () => ({
    Resend: class MockResend {
        emails = mockResendEmails;
        constructor(_apiKey: string) {
            // Mock constructor
        }
    },
}));

// Mock logger
vi.mock("../../log/logger", () => ({
    default: {
        scope: vi.fn(() => ({
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
        })),
    },
}));

describe("lib/services/mail/MailManager", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset the internal resend instance by re-initializing with undefined
        MailManager.init(undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("init()", () => {
        it("should initialize with API key", () => {
            const result = MailManager.init("test-api-key");
            expect(result).toBe(MailManager);
        });

        it("should return MailManager class for chaining", () => {
            const result = MailManager.init("test-api-key");
            expect(result).toBe(MailManager);
        });

        it("should not throw when initialized without API key", () => {
            expect(() => MailManager.init(undefined)).not.toThrow();
        });

        it("should not throw when initialized with empty string", () => {
            expect(() => MailManager.init("")).not.toThrow();
        });
    });

    describe("sendMail() - not initialized", () => {
        it("should throw error when mail service is not initialized", async () => {
            // Ensure not initialized
            MailManager.init(undefined);

            const mail: IMail = {
                to: "test@example.com",
                subject: "Test Subject",
                html: "<p>Test content</p>",
            };

            await expect(MailManager.sendMail(mail)).rejects.toThrow(
                "❌ Mail service not initialized - RESEND_API_KEY is required"
            );
        });

        it("should throw error when initialized with empty string", async () => {
            MailManager.init("");

            const mail: IMail = {
                to: "test@example.com",
                subject: "Test Subject",
                html: "<p>Test content</p>",
            };

            await expect(MailManager.sendMail(mail)).rejects.toThrow(
                "❌ Mail service not initialized - RESEND_API_KEY is required"
            );
        });
    });

    describe("sendMail() - initialized", () => {
        beforeEach(() => {
            MailManager.init("valid-api-key");
        });

        it("should send email successfully", async () => {
            const mail: IMail = {
                to: "recipient@example.com",
                subject: "Test Subject",
                html: "<p>Hello World</p>",
            };

            await expect(MailManager.sendMail(mail)).resolves.not.toThrow();
            expect(mockResendEmails.send).toHaveBeenCalledTimes(1);
        });

        it("should use default from address when not provided", async () => {
            const mail: IMail = {
                to: "recipient@example.com",
                subject: "Test Subject",
                html: "<p>Hello World</p>",
            };

            await MailManager.sendMail(mail);

            expect(mockResendEmails.send).toHaveBeenCalledWith({
                from: "noreply@mapineda48.de",
                to: "recipient@example.com",
                subject: "Test Subject",
                html: "<p>Hello World</p>",
            });
        });

        it("should use custom from address when provided", async () => {
            const mail: IMail = {
                to: "recipient@example.com",
                subject: "Test Subject",
                html: "<p>Hello World</p>",
                from: "custom@example.com",
            };

            await MailManager.sendMail(mail);

            expect(mockResendEmails.send).toHaveBeenCalledWith({
                from: "custom@example.com",
                to: "recipient@example.com",
                subject: "Test Subject",
                html: "<p>Hello World</p>",
            });
        });

        it("should accept array of recipients", async () => {
            const mail: IMail = {
                to: ["recipient1@example.com", "recipient2@example.com"],
                subject: "Test Subject",
                html: "<p>Hello World</p>",
            };

            await MailManager.sendMail(mail);

            expect(mockResendEmails.send).toHaveBeenCalledWith({
                from: "noreply@mapineda48.de",
                to: ["recipient1@example.com", "recipient2@example.com"],
                subject: "Test Subject",
                html: "<p>Hello World</p>",
            });
        });

        it("should throw error when Resend API returns an error", async () => {
            mockResendEmails.send.mockResolvedValueOnce({
                data: null,
                error: { message: "API Error", name: "validation_error" },
            });

            const mail: IMail = {
                to: "recipient@example.com",
                subject: "Test Subject",
                html: "<p>Hello World</p>",
            };

            await expect(MailManager.sendMail(mail)).rejects.toThrow(
                "❌ Error sending email"
            );
        });

        it("should throw error when Resend API throws exception", async () => {
            mockResendEmails.send.mockRejectedValueOnce(new Error("Network error"));

            const mail: IMail = {
                to: "recipient@example.com",
                subject: "Test Subject",
                html: "<p>Hello World</p>",
            };

            await expect(MailManager.sendMail(mail)).rejects.toThrow(
                "❌ Error sending email"
            );
        });
    });

    describe("re-initialization", () => {
        it("should allow re-initialization with different API key", async () => {
            // First init without key - should fail
            MailManager.init(undefined);

            const mail: IMail = {
                to: "test@example.com",
                subject: "Test",
                html: "<p>Test</p>",
            };

            await expect(MailManager.sendMail(mail)).rejects.toThrow();

            // Re-init with valid key - should work
            MailManager.init("new-api-key");

            await expect(MailManager.sendMail(mail)).resolves.not.toThrow();
        });

        it("should disable service when re-initialized with undefined", async () => {
            // First init with key
            MailManager.init("valid-key");

            const mail: IMail = {
                to: "test@example.com",
                subject: "Test",
                html: "<p>Test</p>",
            };

            await expect(MailManager.sendMail(mail)).resolves.not.toThrow();

            // Re-init without key - should fail
            MailManager.init(undefined);

            await expect(MailManager.sendMail(mail)).rejects.toThrow(
                "❌ Mail service not initialized - RESEND_API_KEY is required"
            );
        });
    });
});
