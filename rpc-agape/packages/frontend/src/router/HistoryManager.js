import { Action } from "history";

const notFoundIndex = -1;

export default class HistoryManager {
  constructor(history, pages) {
    this.history = history;
    this.pages = pages;
  }

  onUpdate(setState) {
    return this.history.listen((update) =>
      setState(this.getComponentPage(update))
    );
  }

  push(pathname, props) {
    this.findPage(pathname, props)
      .then((state) => this.history.push(pathname, state))
      .catch((error) => console.error(error));
  }

  replace(pathname, props) {
    this.findPage(pathname, props)
      .then((state) => this.history.replace(pathname, state))
      .catch((error) => console.error(error));
  }

  async sync(props) {
    const { pathname } = this.history.location;

    const state = await this.findPage(pathname, props);

    this.history.replace(pathname, state);

    const init = this.getComponentPage({
      location: { state },
      action: Action.Replace,
    });

    return init;
  }

  // Función para encontrar la configuración de una página basada en la ruta.
  async findPage(pathname, props) {
    for (let i = 0; i < this.pages.length; i++) {
      const page = this.pages[i];
      const res = page.match(pathname);

      if (!res) {
        continue;
      }

      return await page.init(res.params, props);
    }

    return Promise.resolve({ index: notFoundIndex });
  }

  // Función para obtener la página actual basándose en la ubicación y la acción del historial.
  getComponentPage({ location: { state }, action }) {
    // Si no hay estado o la acción es Pop, reemplazar la ruta actual en el historial.
    if (!state || action === Action.Pop) {
      this.replace(this.history.location.pathname);
    }

    if (!state) {
      return { Page: NotFoundPage };
    }

    const { index, props } = state;

    if (index === notFoundIndex) {
      return { Page: NotFoundPage };
    }

    const { Component: Page } = this.pages[index];

    // Si no hay props, devolver el componente de la página como está.
    if (!props) {
      return { Page };
    }

    // Devolver el componente de la página como una función que renderiza el componente con las props.
    return { Page: () => <Page {...props} /> };
  }
}

function NotFoundPage() {
  return <div>Not Found</div>;
}
