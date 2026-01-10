import { describe, it, expect, vi, afterEach } from "vitest";
import ctx, { runContext, type IContext } from "./index";

describe("lib/context", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("runContext", () => {
        it("should execute the callback function", () => {
            const callback = vi.fn();
            const testContext: IContext = {
                id: 1,
                fullName: "Test User",
                avatarUrl: null,
                permissions: [],
                tenant: "test",
                session: new Map()
            };

            runContext(testContext, callback);

            expect(callback).toHaveBeenCalledTimes(1);
        });

        it("should allow callback to complete synchronously", () => {
            let executed = false;
            const testContext: IContext = {
                id: 1,
                fullName: "Test User",
                avatarUrl: null, permissions: [], tenant: "test", session: new Map()
            };

            runContext(testContext, () => {
                executed = true;
            });

            expect(executed).toBe(true);
        });

        it("should handle multiple sequential contexts", () => {
            const results: number[] = [];
            const context1: IContext = { id: 1, fullName: "User 1", avatarUrl: null, permissions: [], tenant: "test", session: new Map() };
            const context2: IContext = { id: 2, fullName: "User 2", avatarUrl: null, permissions: [], tenant: "test", session: new Map() };

            runContext(context1, () => {
                results.push(ctx.id);
            });

            runContext(context2, () => {
                results.push(ctx.id);
            });

            expect(results).toEqual([1, 2]);
        });

        it("should create an isolated copy of the context", () => {
            const originalContext: IContext = {
                id: 1,
                fullName: "Original Name",
                avatarUrl: "http://example.com/avatar.jpg", permissions: [], tenant: "test", session: new Map()
            };

            runContext(originalContext, () => {
                // Modificar el contexto dentro del runContext
                ctx.fullName = "Modified Name";
                expect(ctx.fullName).toBe("Modified Name");
            });

            // El contexto original no debería haberse modificado
            expect(originalContext.fullName).toBe("Original Name");
        });
    });

    describe("ctx proxy", () => {
        describe("getter", () => {
            it("should throw error when accessed outside of context", () => {
                expect(() => ctx.id).toThrow(
                    "No hay contexto activo (¿faltó runContext en el request?)"
                );
            });

            it("should return context id when inside runContext", () => {
                const testContext: IContext = {
                    id: 42,
                    fullName: "Test User",
                    avatarUrl: null, permissions: [], tenant: "test", session: new Map()
                };

                runContext(testContext, () => {
                    expect(ctx.id).toBe(42);
                });
            });

            it("should return context fullName when inside runContext", () => {
                const testContext: IContext = {
                    id: 1,
                    fullName: "John Doe",
                    avatarUrl: null, permissions: [], tenant: "test", session: new Map()
                };

                runContext(testContext, () => {
                    expect(ctx.fullName).toBe("John Doe");
                });
            });

            it("should return context avatarUrl when inside runContext", () => {
                const avatarUrl = "https://example.com/avatar.png";
                const testContext: IContext = {
                    id: 1,
                    fullName: "John Doe",
                    avatarUrl, permissions: [], tenant: "test", session: new Map()
                };

                runContext(testContext, () => {
                    expect(ctx.avatarUrl).toBe(avatarUrl);
                });
            });

            it("should return null avatarUrl when inside runContext", () => {
                const testContext: IContext = {
                    id: 1,
                    fullName: "John Doe",
                    avatarUrl: null, permissions: [], tenant: "test", session: new Map()
                };

                runContext(testContext, () => {
                    expect(ctx.avatarUrl).toBeNull();
                });
            });
        });

        describe("setter", () => {
            it("should throw error when setting outside of context", () => {
                expect(() => {
                    ctx.fullName = "New Name";
                }).toThrow("No hay contexto activo (¿faltó runContext en el request?)");
            });

            it("should allow setting id inside runContext", () => {
                const testContext: IContext = {
                    id: 1,
                    fullName: "Test User",
                    avatarUrl: null, permissions: [], tenant: "test", session: new Map()
                };

                runContext(testContext, () => {
                    ctx.id = 99;
                    expect(ctx.id).toBe(99);
                });
            });

            it("should allow setting fullName inside runContext", () => {
                const testContext: IContext = {
                    id: 1,
                    fullName: "Original Name",
                    avatarUrl: null, permissions: [], tenant: "test", session: new Map()
                };

                runContext(testContext, () => {
                    ctx.fullName = "Updated Name";
                    expect(ctx.fullName).toBe("Updated Name");
                });
            });

            it("should allow setting avatarUrl inside runContext", () => {
                const testContext: IContext = {
                    id: 1,
                    fullName: "Test User",
                    avatarUrl: null, permissions: [], tenant: "test", session: new Map()
                };

                runContext(testContext, () => {
                    ctx.avatarUrl = "https://new-avatar.com/image.png";
                    expect(ctx.avatarUrl).toBe("https://new-avatar.com/image.png");
                });
            });

            it("should allow setting avatarUrl to null inside runContext", () => {
                const testContext: IContext = {
                    id: 1,
                    fullName: "Test User",
                    avatarUrl: "https://example.com/avatar.png", permissions: [], tenant: "test", session: new Map()
                };

                runContext(testContext, () => {
                    ctx.avatarUrl = null;
                    expect(ctx.avatarUrl).toBeNull();
                });
            });
        });
    });

    describe("context isolation", () => {
        it("should maintain isolated contexts in nested runContext calls", () => {
            const outerContext: IContext = {
                id: 1,
                fullName: "Outer User",
                avatarUrl: null, permissions: [], tenant: "test", session: new Map()
            };
            const innerContext: IContext = {
                id: 2,
                fullName: "Inner User",
                avatarUrl: null, permissions: [], tenant: "test", session: new Map()
            };

            const results: { outer: number; inner: number }[] = [];

            runContext(outerContext, () => {
                const outerIdBefore = ctx.id;

                runContext(innerContext, () => {
                    results.push({ outer: outerIdBefore, inner: ctx.id });
                });

                // After inner context ends, we should still be in outer context
                // Note: Due to how AsyncLocalStorage works, the context is restored
                results.push({ outer: ctx.id, inner: -1 });
            });

            expect(results[0]).toEqual({ outer: 1, inner: 2 });
            expect(results[1]).toEqual({ outer: 1, inner: -1 });
        });

        it("should not leak context modifications to parent context", () => {
            const outerContext: IContext = {
                id: 1,
                fullName: "Outer User",
                avatarUrl: null, permissions: [], tenant: "test", session: new Map()
            };
            const innerContext: IContext = {
                id: 2,
                fullName: "Inner User",
                avatarUrl: null, permissions: [], tenant: "test", session: new Map()
            };

            let outerNameAfterInner = "";

            runContext(outerContext, () => {
                runContext(innerContext, () => {
                    ctx.fullName = "Modified Inner User";
                });

                outerNameAfterInner = ctx.fullName;
            });

            expect(outerNameAfterInner).toBe("Outer User");
        });
    });

    describe("async context propagation", () => {
        it("should propagate context through async operations", async () => {
            const testContext: IContext = {
                id: 123,
                fullName: "Async User",
                avatarUrl: "https://async.example.com/avatar.png", permissions: [], tenant: "test", session: new Map()
            };

            let capturedId: number | undefined;
            let capturedName: string | undefined;

            await new Promise<void>((resolve) => {
                runContext(testContext, async () => {
                    // Simular operación asíncrona
                    await Promise.resolve();
                    capturedId = ctx.id;
                    capturedName = ctx.fullName;
                    resolve();
                });
            });

            expect(capturedId).toBe(123);
            expect(capturedName).toBe("Async User");
        });

        it("should propagate context through setTimeout", async () => {
            const testContext: IContext = {
                id: 456,
                fullName: "Timeout User",
                avatarUrl: null, permissions: [], tenant: "test", session: new Map()
            };

            let capturedId: number | undefined;

            await new Promise<void>((resolve) => {
                runContext(testContext, () => {
                    setTimeout(() => {
                        capturedId = ctx.id;
                        resolve();
                    }, 10);
                });
            });

            expect(capturedId).toBe(456);
        });

        it("should propagate context through Promise chains", async () => {
            const testContext: IContext = {
                id: 789,
                fullName: "Promise User",
                avatarUrl: null, permissions: [], tenant: "test", session: new Map()
            };

            const results: number[] = [];

            await new Promise<void>((resolve) => {
                runContext(testContext, async () => {
                    await Promise.resolve()
                        .then(() => {
                            results.push(ctx.id);
                            return Promise.resolve();
                        })
                        .then(() => {
                            results.push(ctx.id);
                            return Promise.resolve();
                        })
                        .then(() => {
                            results.push(ctx.id);
                            resolve();
                        });
                });
            });

            expect(results).toEqual([789, 789, 789]);
        });
    });

    describe("IUserSession type", () => {
        it("should accept IContext as a valid context", () => {
            const context: IContext = {
                id: 1,
                fullName: "Type Test User",
                avatarUrl: null, permissions: [], tenant: "test", session: new Map()
            };

            // This test ensures the type is correctly exported and usable
            let capturedContext: Partial<IContext> = {};

            runContext(context, () => {
                capturedContext = {
                    id: ctx.id,
                    fullName: ctx.fullName,
                    avatarUrl: ctx.avatarUrl,
                    tenant: ctx.tenant,
                    session: ctx.session,
                };
            });

            expect(capturedContext).toEqual(context);
        });
    });
});
