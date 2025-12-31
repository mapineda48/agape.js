import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import React from "react";
import PortalProvider, { createPortalHook, type PortalInjectedProps } from "./portal";

// Mock notifyError since it might be called in ErrorBoundary
vi.mock("@agape/spa", () => ({
    notifyError: vi.fn().mockResolvedValue(undefined),
}));

describe("Portal Components", () => {
    const TestComponent = ({ remove, text = "Portal Content", zIndex }: PortalInjectedProps & { text?: string }) => (
        <div data-testid="portal-content">
            <span data-testid="z-index-value">{zIndex}</span>
            {text}
            <button onClick={remove}>Close</button>
        </div>
    );

    const useTestPortal = createPortalHook(TestComponent);

    const TestTrigger = ({ portalProps }: { portalProps?: { text?: string } }) => {
        const openPortal = useTestPortal();
        return <button onClick={() => openPortal(portalProps || {})}>Open Portal</button>;
    };

    beforeEach(() => {
        document.body.innerHTML = "";
        document.body.style.overflow = "";
        vi.clearAllMocks();
    });

    it("should render PortalProvider and its children", () => {
        render(
            <PortalProvider>
                <div data-testid="child">Child Content</div>
            </PortalProvider>
        );
        expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("should throw error if usePortalTrigger is used outside PortalProvider", () => {
        // Suppress console.error for this test as we expect an error from React
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });

        const ComponentWithError = () => {
            const openPortal = useTestPortal();
            return <button onClick={() => openPortal({})}>Open</button>;
        };

        expect(() => render(<ComponentWithError />)).toThrow(
            "Portal Context not found. Wrap your app in <PortalProvider>"
        );

        consoleSpy.mockRestore();
    });

    it("should open a portal component when triggered", async () => {
        render(
            <PortalProvider>
                <TestTrigger />
            </PortalProvider>
        );

        const openButton = screen.getByText("Open Portal");
        act(() => {
            openButton.click();
        });

        await waitFor(() => {
            expect(screen.getByTestId("portal-content")).toBeInTheDocument();
            expect(screen.getByText("Portal Content")).toBeInTheDocument();
        });

        // Check if it's in a portal (outside the root container)
        expect(document.body).toContainElement(screen.getByTestId("portal-content"));
    });

    it("should pass props to the portal component", async () => {
        render(
            <PortalProvider>
                <TestTrigger portalProps={{ text: "Custom Proprietary Text" }} />
            </PortalProvider>
        );

        act(() => {
            screen.getByText("Open Portal").click();
        });

        await waitFor(() => {
            expect(screen.getByText("Custom Proprietary Text")).toBeInTheDocument();
        });
    });

    it("should remove the portal component when close is called", async () => {
        render(
            <PortalProvider>
                <TestTrigger />
            </PortalProvider>
        );

        act(() => {
            screen.getByText("Open Portal").click();
        });

        await waitFor(() => {
            expect(screen.getByTestId("portal-content")).toBeInTheDocument();
        });

        const closeButton = screen.getByText("Close");
        act(() => {
            closeButton.click();
        });

        await waitFor(() => {
            expect(screen.queryByTestId("portal-content")).not.toBeInTheDocument();
        });
    });

    it("should support multiple portals with different z-indices", async () => {
        render(
            <PortalProvider>
                <TestTrigger portalProps={{ text: "Portal 1" }} />
                <TestTrigger portalProps={{ text: "Portal 2" }} />
            </PortalProvider>
        );

        const openButtons = screen.getAllByText("Open Portal");

        act(() => {
            openButtons[0].click();
        });
        act(() => {
            openButtons[1].click();
        });

        await waitFor(() => {
            expect(screen.getByText("Portal 1")).toBeInTheDocument();
            expect(screen.getByText("Portal 2")).toBeInTheDocument();
        });

        const zIndices = screen.getAllByTestId("z-index-value");
        // Based on implementation: const zIndex = 1500 + index * 100;
        expect(zIndices[0]).toHaveTextContent("1500");
        expect(zIndices[1]).toHaveTextContent("1600");
    });

    it("should set body overflow to hidden when portals are open", async () => {
        render(
            <PortalProvider>
                <TestTrigger />
            </PortalProvider>
        );

        expect(document.body.style.overflow).not.toBe("hidden");

        act(() => {
            screen.getByText("Open Portal").click();
        });

        await waitFor(() => {
            expect(document.body.style.overflow).toBe("hidden");
        });

        act(() => {
            screen.getByText("Close").click();
        });

        await waitFor(() => {
            expect(document.body.style.overflow).not.toBe("hidden");
        });
    });

    it("should handle errors using PortalErrorBoundary", async () => {
        const BuggyComponent = () => {
            throw new Error("Portal Crash!");
        };
        const useBuggyPortal = createPortalHook(BuggyComponent);
        const BuggyTrigger = () => {
            const open = useBuggyPortal();
            return <button onClick={() => open({})}>Trigger Bug</button>;
        };

        // Suppress expected error logs
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });

        render(
            <PortalProvider>
                <BuggyTrigger />
            </PortalProvider>
        );

        act(() => {
            screen.getByText("Trigger Bug").click();
        });

        await waitFor(() => {
            expect(screen.getByText("Error en el componente")).toBeInTheDocument();
            expect(screen.getByText("Portal Crash!")).toBeInTheDocument();
        });

        act(() => {
            screen.getByText("Cerrar").click();
        });

        await waitFor(() => {
            expect(screen.queryByText("Error en el componente")).not.toBeInTheDocument();
        });

        consoleSpy.mockRestore();
    });

    it("should call notifyError when an error occurs (if not in development)", async () => {
        vi.stubEnv("NODE_ENV", "production");

        const BuggyComponent = () => {
            throw new Error("Production Crash!");
        };
        const useBuggyPortal = createPortalHook(BuggyComponent);
        const BuggyTrigger = () => {
            const open = useBuggyPortal();
            return <button onClick={() => open({})}>Trigger Bug</button>;
        };

        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });
        const { notifyError } = await import("@agape/spa");

        render(
            <PortalProvider>
                <BuggyTrigger />
            </PortalProvider>
        );

        act(() => {
            screen.getByText("Trigger Bug").click();
        });

        await waitFor(() => {
            expect(notifyError).toHaveBeenCalled();
        });

        consoleSpy.mockRestore();
        vi.unstubAllEnvs();
    });
});
