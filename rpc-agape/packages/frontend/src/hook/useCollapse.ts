import { useEffect, useMemo, useRef } from "react";
import Collapse from "bootstrap/js/dist/collapse";

export default function useCollapse<T extends Element>(opt?: OptionsCollapse) {
  const ref = useRef<T>(null);
  const collapse = useRef<ICollapse | null>(null);
  const options = useRef(opt);

  useEffect(() => {
    const { current: el } = ref;

    if (!el) {
      return;
    }

    const instance = (collapse.current = createCollapse(el, options.current));

    return instance.unmount;
  }, []);

  return useMemo(() => {
    return {
      ref,
      get current() {
        return collapse.current;
      },
    };
  }, []);
}

function createCollapse(el: Element, opt: OptionsCollapse = {}): ICollapse {
  const { onClose, onCreateShow, ...bootstrap } = opt;

  const instance = new Collapse(el, bootstrap);

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
    el.removeEventListener("show.bs.collapse", startSlide);
    el.removeEventListener("hidden.bs.collapse", endSlide);

    instance.dispose();
  }

  function unmount() {
    if (!inSlideTransition) {
      dispose();
      return;
    }

    instance.hide();
  }

  el.addEventListener("show.bs.collapse", startSlide);
  el.addEventListener("hidden.bs.collapse", endSlide);

  Object.defineProperty(instance, "unmount", {
    writable: true,
    value: unmount,
  });

  if (onCreateShow) {
    instance.show();
  }

  return instance as ICollapse;
}

interface ICollapse extends Collapse {
  readonly unmount: () => void;
}

interface OptionsCollapse extends Partial<Collapse.Options> {
  onClose?: () => void;
  onCreateShow?: boolean;
}
