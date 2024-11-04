import { useEffect, useMemo, useRef } from "react";
import Modal from "bootstrap/js/dist/modal";

export default function useModal(opt?: OptionsModal) {
  const ref = useRef<HTMLDivElement>(null);
  const modal = useRef<IModal | null>(null);
  const options = useRef(opt);

  useEffect(() => {
    const { current: el } = ref;

    if (!el) {
      return;
    }

    const instance = (modal.current = createModal(el, options.current));

    return instance.unmount;
  }, []);

  return useMemo(() => {
    return {
      ref,
      get current() {
        return modal.current;
      },
    };
  }, []);
}

function createModal(el: HTMLDivElement, opt: OptionsModal = {}): IModal {
  const { onClose, onCreateShow, ...bootstrap } = opt;

  const instance = new Modal(el, bootstrap);

  let inSlideTransition = false;

  function startSlide() {
    inSlideTransition = true;
  }

  function endSlide() {
    inSlideTransition = false;

    if (onClose) {
      onClose();
    }
  }

  function dispose() {
    el.removeEventListener("show.bs.modal", startSlide);
    el.removeEventListener("hidden.bs.modal", endSlide);

    instance.dispose();
  }

  function unmount() {
    if (!inSlideTransition) {
      dispose();
      return;
    }

    instance.hide();
  }

  el.addEventListener("show.bs.modal", startSlide);
  el.addEventListener("hidden.bs.modal", endSlide);

  Object.defineProperty(instance, "unmount", {
    writable: true,
    value: unmount,
  });

  if (onCreateShow) {
    instance.show();
  }

  return instance as IModal;
}

interface IModal extends Modal {
  readonly unmount: () => void;
}

interface OptionsModal extends Partial<Modal.Options> {
  onClose?: () => void;
  onCreateShow?: boolean;
}
