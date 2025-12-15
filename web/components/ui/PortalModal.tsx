import React, {
  useState,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import Modal from "./Modal";
import type { PortalInjectedProps } from "../util/portal";

interface PortalModalProps extends PortalInjectedProps {
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
  /** Called after modal animation completes when closing */
  onClose?: () => void;
  /** Maximum height for the modal body (enables scroll). Default: 70vh */
  maxBodyHeight?: string;
}

export default function PortalModal({
  remove,
  zIndex,
  style,
  children,
  onClose,
  ...props
}: PortalModalProps) {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleAfterClose = () => {
    remove();
    if (onClose) onClose();
  };

  // Inject onClose to children if they accept it
  const childrenWithProps = isValidElement(children)
    ? cloneElement(children as ReactElement<any>, { onClose: handleClose })
    : children;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      onAfterClose={handleAfterClose}
      zIndex={zIndex}
      style={{ ...style, zIndex }}
      {...props}
    >
      {childrenWithProps}
    </Modal>
  );
}

// Re-export Modal compound components for convenience
export { default as Modal } from "./Modal";
