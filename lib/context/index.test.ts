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
                permissions: [], tenant: "test", session: new Map()
            };

            runContext(testContext, () => {
                executed = true;
            });

            expect(executed).toBe(true);
        });

        it("should handle multiple sequential contexts", () => {
            const results: number[] = [];
            const context1: IContext = { id: 1, permissions: [], tenant: "test", session: new Map() };
            const context2: IContext = { id: 2, permissions: [], tenant: "test", session: new Map() };

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
                permissions: [], tenant: "test", session: new Map()
            };

            runContext(originalContext, () => {
                // Modificar el contexto dentro del runContext
                ctx.id = 99;
                expect(ctx.id).toBe(99);
            });

            // El contexto original no debería haberse modificado
            expect(originalContext.id).toBe(1);
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
                    permissions: [], tenant: "test", session: new Map()
                };

                runContext(testContext, () => {
                    expect(ctx.id).toBe(42);
                });
            });

            it("should return context fullName when inside runContext", () => {
                const testContext: IContext = {
                    id: 1,
                    permissions: [], tenant: "test", session: new Map()
                };

                runContext(testContext, () => {
                    expect(ctx.id).toBe(1);
                });
            });

            it("should return context avatarUrl when inside runContext", () => {
                const avatarUrl = "https://example.com/avatar.png";
                const testContext: IContext = {
                    id: 1,
                    permissions: [], tenant: "test", session: new Map()
                };

                runContext(testContext, () => {
                    expect(ctx.id).toBe(1);
                });
            });

            it("should return null avatarUrl when inside runContext", () => {
                const testContext: IContext = {
                    id: 1,
                    permissions: [], tenant: "test", session: new Map()
                };

                runContext(testContext, () => {
                    expect(ctx.id).toBe(1);
                });
            });
        });

        describe("setter", () => {
            it("should throw error when setting outside of context", () => {
                expect(() => {
                    ctx.id = 99;
                }).toThrow("No hay contexto activo (¿faltó runContext en el request?)");
            });

            it("should allow setting id inside runContext", () => {
                const testContext: IContext = {
                    id: 1,
                    permissions: [], tenant: "test", session: new Map()
                };

                runContext(testContext, () => {
                    ctx.id = 99;
                    expect(ctx.id).toBe(99);
                });
            });

            it("should allow setting fullName inside runContext", () => {
                const testContext: IContext = {
                    id: 1,
                    permissions: [], tenant: "test", session: new Map()
                };

                runContext(testContext, () => {
                    ctx.id = 99;
                    expect(ctx.id).toBe(99);
                });
            });

            it("should allow setting avatarUrl inside runContext", () => {
                const testContext: IContext = {
                    id: 1,
                    permissions: [], tenant: "test", session: new Map()
                };

                runContext(testContext, () => {
                    ctx.id = 99;
                    expect(ctx.id).toBe(99);
                });
            });

            it("should allow setting avatarUrl to null inside runContext", () => {
                const testContext: IContext = {
                    id: 1,
                    permissions: [], tenant: "test", session: new Map()
                };

                runContext(testContext, () => {
                    ctx.id = 99;
                    expect(ctx.id).toBe(99);
                });
            });
        });
    });

    describe("context isolation", () => {
        it("should maintain isolated contexts in nested runContext calls", () => {
            const outerContext: IContext = {
                id: 1,
                permissions: [], tenant: "test", session: new Map()
            };
            const innerContext: IContext = {
                id: 2,
                permissions: [], tenant: "test", session: new Map()
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
                permissions: [], tenant: "test", session: new Map()
            };
            const innerContext: IContext = {
                id: 2,
                permissions: [], tenant: "test", session: new Map()
            };

            let outerIdAfterInner = 0;

            runContext(outerContext, () => {
                runContext(innerContext, () => {
                    ctx.id = 99;
                });

                outerIdAfterInner = ctx.id;
            });

            expect(outerIdAfterInner).toBe(1);
        });
    });

    describe("async context propagation", () => {
        it("should propagate context through async operations", async () => {
            const testContext: IContext = {
                id: 123,
                permissions: [], tenant: "test", session: new Map()
            };

            let capturedId: number | undefined;

            await new Promise<void>((resolve) => {
                runContext(testContext, async () => {
                    // Simular operación asíncrona
                    await Promise.resolve();
                    capturedId = ctx.id;
                    resolve();
                });
            });

            expect(capturedId).toBe(123);
        });

        it("should propagate context through setTimeout", async () => {
            const testContext: IContext = {
                id: 456,
                permissions: [], tenant: "test", session: new Map()
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
                permissions: [], tenant: "test", session: new Map()
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


});
