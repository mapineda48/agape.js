import React, {
  useState,
  cloneElement,
  isValidElement,
  type ReactElement,
} from "react";
import Modal from "./Modal";
import type { PortalInjectedProps } from "../util/portal";

interface PortalModalProps extends PortalInjectedProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  className?: string;
  onClose?: () => void;
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

  const childrenWithProps = isValidElement(children)
    ? cloneElement(children as ReactElement<any>, { onClose: handleClose })
    : children;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      onAfterClose={handleAfterClose}
      style={{ ...style, zIndex }}
      {...props}
    >
      {childrenWithProps}
    </Modal>
  );
}
