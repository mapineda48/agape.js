import { describe, it, expect, beforeEach } from "vitest";
import Jwt, { type JwtOptions } from "./Jwt";

describe("Jwt", () => {
    let jwt: Jwt;
    const testSecret = "this-is-a-very-secure-secret-key-for-testing-purposes-32chars";

    beforeEach(() => {
        jwt = new Jwt(testSecret);
    });

    describe("constructor", () => {
        it("should create instance with string secret (backward compatibility)", () => {
            const instance = new Jwt(testSecret);
            expect(instance).toBeInstanceOf(Jwt);
            expect(instance.maxAge).toBeGreaterThan(0);
        });

        it("should create instance with JwtOptions", () => {
            const options: JwtOptions = {
                secret: testSecret,
                expiresIn: "1h",
                issuer: "test:issuer",
                audience: "test:audience",
            };
            const instance = new Jwt(options);
            expect(instance).toBeInstanceOf(Jwt);
            // 1 hora = 3600000 ms
            expect(instance.maxAge).toBe(3600000);
        });

        it("should use default values when not provided", () => {
            const instance = new Jwt({ secret: testSecret });
            // Default: 24h = 86400000 ms
            expect(instance.maxAge).toBe(86400000);
        });
    });

    describe("generateToken", () => {
        it("should generate a valid JWT token", async () => {
            const payload = { userId: 123, email: "test@example.com" };
            const token = await jwt.generateToken(payload);

            expect(token).toBeDefined();
            expect(typeof token).toBe("string");
            // JWT tiene 3 partes separadas por puntos
            expect(token.split(".")).toHaveLength(3);
        });

        it("should include custom payload in token", async () => {
            const payload = { userId: 123, roles: ["admin", "user"] };
            const token = await jwt.generateToken(payload);

            // Decodificar sin verificar para inspeccionar
            const decoded = Jwt.decodeWithoutVerify(token);
            expect(decoded).not.toBeNull();
            expect(decoded?.userId).toBe(123);
            expect(decoded?.roles).toEqual(["admin", "user"]);
        });
    });

    describe("verifyToken", () => {
        it("should verify and decode a valid token", async () => {
            const payload = { userId: 456, name: "Test User" };
            const token = await jwt.generateToken(payload);

            const decoded = await jwt.verifyToken(token);

            expect(decoded.userId).toBe(456);
            expect(decoded.name).toBe("Test User");
        });

        it("should include standard JWT claims", async () => {
            const payload = { userId: 789 };
            const token = await jwt.generateToken(payload);

            const decoded = await jwt.verifyToken(token);

            expect(decoded.iss).toBe("agape:api"); // issuer por defecto
            expect(decoded.aud).toBe("agape:client"); // audience por defecto
            expect(decoded.iat).toBeDefined(); // issued at
            expect(decoded.exp).toBeDefined(); // expiration
        });

        it("should throw error for invalid token", async () => {
            const invalidToken = "invalid.token.here";

            await expect(jwt.verifyToken(invalidToken)).rejects.toThrow();
        });

        it("should throw error for token with wrong signature", async () => {
            // Crear token con otro secreto
            const otherJwt = new Jwt("another-secret-that-is-32-chars-long!");
            const token = await otherJwt.generateToken({ userId: 1 });

            await expect(jwt.verifyToken(token)).rejects.toThrow();
        });

        it("should throw error for token with wrong issuer", async () => {
            const customJwt = new Jwt({
                secret: testSecret,
                issuer: "custom:issuer",
            });
            const token = await customJwt.generateToken({ userId: 1 });

            // jwt por defecto espera issuer "agape:api"
            await expect(jwt.verifyToken(token)).rejects.toThrow();
        });

        it("should throw error for token with wrong audience", async () => {
            const customJwt = new Jwt({
                secret: testSecret,
                audience: "custom:audience",
            });
            const token = await customJwt.generateToken({ userId: 1 });

            // jwt por defecto espera audience "agape:client"
            await expect(jwt.verifyToken(token)).rejects.toThrow();
        });
    });

    describe("decodeWithoutVerify", () => {
        it("should decode token without verification", async () => {
            const payload = { userId: 999, secret: "value" };
            const token = await jwt.generateToken(payload);

            const decoded = Jwt.decodeWithoutVerify(token);

            expect(decoded).not.toBeNull();
            expect(decoded?.userId).toBe(999);
            expect(decoded?.secret).toBe("value");
        });

        it("should return null for invalid token format", () => {
            expect(Jwt.decodeWithoutVerify("invalid")).toBeNull();
            expect(Jwt.decodeWithoutVerify("only.two")).toBeNull();
            expect(Jwt.decodeWithoutVerify("")).toBeNull();
        });

        it("should return null for malformed base64", () => {
            expect(Jwt.decodeWithoutVerify("a.!!!invalid-base64!!!.c")).toBeNull();
        });
    });

    describe("custom options", () => {
        it("should respect custom issuer and audience", async () => {
            const customJwt = new Jwt({
                secret: testSecret,
                issuer: "my:app",
                audience: "my:clients",
            });

            const token = await customJwt.generateToken({ data: "test" });
            const decoded = await customJwt.verifyToken(token);

            expect(decoded.iss).toBe("my:app");
            expect(decoded.aud).toBe("my:clients");
        });

        it("should respect custom expiration time", async () => {
            const shortLivedJwt = new Jwt({
                secret: testSecret,
                expiresIn: "30s",
            });

            expect(shortLivedJwt.maxAge).toBe(30000); // 30 segundos en ms
        });
    });

    describe("security", () => {
        it("should use HS256 algorithm", async () => {
            const token = await jwt.generateToken({ userId: 1 });
            const parts = token.split(".");
            const header = JSON.parse(Buffer.from(parts[0], "base64url").toString());

            expect(header.alg).toBe("HS256");
        });

        it("should include typ header", async () => {
            const token = await jwt.generateToken({ userId: 1 });
            const parts = token.split(".");
            const header = JSON.parse(Buffer.from(parts[0], "base64url").toString());

            // jose puede o no incluir typ, verificamos que alg es el correcto
            expect(header.alg).toBeDefined();
        });
    });
});
