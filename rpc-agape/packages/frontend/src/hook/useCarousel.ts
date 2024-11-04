import { useEffect, useMemo, useRef } from "react";
import Carousel from "bootstrap/js/dist/carousel";

export default function useCarousel(options?: Partial<Carousel.Options>) {
  const ref = useRef<HTMLDivElement>(null);
  const carousel = useRef<ICarousel | null>(null);
  const opt = useRef(options);

  useEffect(() => {
    const { current: el } = ref;

    if (!el) {
      return;
    }

    const instance = (carousel.current = createCarousel(el, opt.current));

    return instance.unmount;
  }, []);

  return useMemo(() => {
    return {
      ref,
      getCarousel() {
        return carousel.current;
      },
    };
  }, []);
}

function createCarousel(el: HTMLDivElement, options?: Partial<Carousel.Options>): ICarousel {
  const instance = new Carousel(el, options);

  let inSlideTransition = false;
  let isUnMount = false;

  function startSlide() {
    inSlideTransition = true;
  }

  function endSlide() {
    inSlideTransition = false;

    if (isUnMount) {
      dispose();
    }
  }

  function dispose() {
    el.removeEventListener("slide.bs.carousel", startSlide);
    el.removeEventListener("slid.bs.carousel", endSlide);
    instance.dispose();
  }

  function unmount() {
    if (!inSlideTransition) {
      dispose();
      return;
    }

    isUnMount = true;
    instance.pause();
  }

  el.addEventListener("slide.bs.carousel", startSlide);
  el.addEventListener("slid.bs.carousel", endSlide);

  Object.defineProperty(instance, "getCurrentIndex", {
    writable: true,
    value: () =>
      Array.from(el.querySelectorAll(".carousel-item")).findIndex((el) =>
        el.classList.contains("active")
      ),
  });

  Object.defineProperty(instance, "unmount", {
    writable: true,
    value: unmount,
  });

  return instance as ICarousel;
}

interface ICarousel extends Carousel {
  readonly getCurrentIndex: () => number;
  readonly unmount: () => void;
}
