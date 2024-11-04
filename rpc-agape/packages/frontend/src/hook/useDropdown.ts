import { useEffect, useMemo, useRef } from "react";
import Dropdown from "bootstrap/js/dist/dropdown";

export default function useDropdown(opt?: OptionsModal) {
  const ref = useRef<HTMLDivElement>(null);
  const modal = useRef<IModal | null>(null);
  const options = useRef(opt);

  useEffect(() => {
    const { current: el } = ref;

    if (!el) {
      return;
    }

    const instance = (modal.current = createDropdown(el, options.current));

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

function createDropdown(el: HTMLDivElement, opt: OptionsModal = {}): IModal {
  const { onClose, onCreateShow, ...bootstrap } = opt;

  const instance = new Dropdown(el, bootstrap);

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
    el.removeEventListener("shown.bs.dropdown", startSlide);
    el.removeEventListener("hidden.bs.dropdown", endSlide);

    instance.dispose();
  }

  function unmount() {
    if (!inSlideTransition) {
      dispose();
      return;
    }

    instance.hide();
  }

  el.addEventListener("shown.bs.dropdown", startSlide);
  el.addEventListener("hidden.bs.dropdown", endSlide);

  Object.defineProperty(instance, "unmount", {
    writable: true,
    value: unmount,
  });

  if (onCreateShow) {
    instance.show();
  }

  return instance as IModal;
}

interface IModal extends Dropdown {
  readonly unmount: () => void;
}

interface OptionsModal extends Partial<Dropdown.Options> {
  onClose?: () => void;
  onCreateShow?: boolean;
}
