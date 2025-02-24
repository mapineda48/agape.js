import cluster from "cluster";

// Function to dynamically import the 'debug' module and configure it.
async function import$() {
  // Dynamically import the 'debug' module
  const { debug } = await import("debug");

  // Return a function to create a debug instance with a namespace
  return (namespace: string) => {
    // Create a debug instance with a namespace prefixed by the process ID if in a worker process
    const log = debug(
      `${!cluster.isPrimary ? process.pid : ""} App:${namespace}`
    );
    // Explicitly enable logging for this instance
    log.enabled = true;
    return log;
  };
}

// Custom debug object to manage logging
const debug = {
  primary(...messages: unknown[]) {},
  info(...messages: unknown[]) {},
  warn(...messages: unknown[]) {},

  // Function to initialize debug logging in development environment
  async env(isDev = false) {
    if (!isDev) {
      // Exit if not in a development environment
      return;
    }

    // Basic logging function that just uses console.log
    if (cluster.isPrimary) {
      this.primary = (...messages) => {
        console.log(...messages);
      };
    }

    try {
      // Import and configure the debug module
      const debug = await import$();

      // Setup custom info and error logging functions
      this.info = debug("Info");
      this.warn = debug("Warn");
    } catch (error) {
      // Log an error if debug initialization fails
      console.log("skip debug");
    }
  },
};

// Export the custom debug object
export default debug;
