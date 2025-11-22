import { type JSX, useEffect, useState } from "react";
import router from "./router";

/**
 * Routes component for React apps. Subscribes to router events
 * and updates local state with the current page element.
 */
export default function Routes() {
    const [state, setState] = useState<null | JSX.Element>(null);

    // Start listening for route changes
    useEffect(() => router.listenPage(setState), []);

    // Render the current page, or null until first route executes
    return state;
}
