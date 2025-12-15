import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import type { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Simple title text - use `header` prop for custom header content */
  title?: ReactNode;
  /** Custom header content - overrides title if both provided */
  header?: ReactNode;
  /** Hide the default close button in header */
  hideCloseButton?: boolean;
  children: ReactNode;
  /** Footer content rendered at the bottom of the modal */
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  className?: string;
  /** Custom class for the body/content area */
  bodyClassName?: string;
  onAfterClose?: () => void;
  style?: React.CSSProperties;
  /** Maximum height for the modal body (enables scroll). Default: 70vh */
  maxBodyHeight?: string;
  /** Explicit zIndex for the modal panel (passed by PortalModal) */
  zIndex?: number;
}

const sizes = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-full mx-4",
};

// Modern spring animation for a polished feel
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.2,
      ease: "easeOut" as const,
    },
  },
};

export default function Modal({
  isOpen,
  onClose,
  title,
  header,
  hideCloseButton = false,
  children,
  footer,
  size = "md",
  className,
  bodyClassName,
  maxBodyHeight = "70vh",
  zIndex,
  ...props
}: ModalProps) {
  // Use portal to render modal at the end of the document body
  if (typeof document === "undefined") return null;

  const hasHeader = header || title;

  // Get the effective zIndex for the modal panel
  // This ensures nested modals stack correctly
  const effectiveZIndex = zIndex ?? props.style?.zIndex;

  return createPortal(
    <AnimatePresence onExitComplete={props.onAfterClose}>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Modal Panel - zIndex applied here for nested stacking */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={clsx(
              "relative flex w-full flex-col overflow-hidden",
              "rounded-2xl bg-white shadow-2xl",
              "dark:bg-gray-900 dark:ring-1 dark:ring-white/10",
              sizes[size],
              className
            )}
            style={{ zIndex: effectiveZIndex }}
          >
            {/* Header */}
            {hasHeader && (
              <div
                className={clsx(
                  "flex shrink-0 items-center justify-between",
                  "border-b border-gray-200 dark:border-gray-700/50",
                  "bg-gradient-to-r from-gray-50 to-gray-100/50",
                  "dark:from-gray-800/50 dark:to-gray-800/30",
                  "px-6 py-4"
                )}
              >
                {/* Custom header or default title */}
                {header ? (
                  <div className="flex-1">{header}</div>
                ) : (
                  <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                    {title}
                  </h3>
                )}

                {/* Close button */}
                {!hideCloseButton && (
                  <button
                    type="button"
                    className={clsx(
                      "ml-4 shrink-0 rounded-lg p-2",
                      "text-gray-400 transition-all duration-200",
                      "hover:bg-gray-200 hover:text-gray-600",
                      "dark:hover:bg-gray-700 dark:hover:text-gray-300",
                      "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                      "dark:focus:ring-offset-gray-900"
                    )}
                    onClick={onClose}
                    aria-label="Cerrar modal"
                  >
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
              </div>
            )}

            {/* Close button when no header */}
            {!hasHeader && !hideCloseButton && (
              <button
                type="button"
                className={clsx(
                  "absolute right-4 top-4 z-10 rounded-lg p-2",
                  "text-gray-400 transition-all duration-200",
                  "hover:bg-gray-100 hover:text-gray-600",
                  "dark:hover:bg-gray-800 dark:hover:text-gray-300",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-500"
                )}
                onClick={onClose}
                aria-label="Cerrar modal"
              >
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            )}

            {/* Body with scroll */}
            <div
              className={clsx(
                "flex-1 overflow-y-auto overscroll-contain",
                "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300",
                "dark:scrollbar-thumb-gray-600",
                bodyClassName
              )}
              style={{ maxHeight: maxBodyHeight }}
            >
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div
                className={clsx(
                  "shrink-0 border-t border-gray-200 dark:border-gray-700/50",
                  "bg-gray-50/80 dark:bg-gray-800/50",
                  "px-6 py-4"
                )}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/** 
 * Compound components for structured modal content 
 */
Modal.Body = function ModalBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={clsx("px-6 py-5", className)}>{children}</div>;
};

Modal.Footer = function ModalFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("flex items-center justify-end gap-3", className)}>
      {children}
    </div>
  );
};
