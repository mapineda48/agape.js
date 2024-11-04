import { match } from "path-to-regexp";

export default class PageManager {
  constructor([pattern, fetch], index) {
    this.index = index;
    this.fetch = fetch;
    this.match = match(pattern, { sensitive: true });
  }

  async init(params, props) {
    if (!this.Component) {
      // Importa el componente y una función opcional para obtener props desde el servidor.
      const { default: Component, OnInit } = await this.fetch();
      this.Component = Component;
      this.OnInit = OnInit;
    }

    if (!this.OnInit) {
      return { index: this.index, props };
    }

    try {
      return {
        index: this.index,
        props: props ?? (await this.OnInit(params)),
      };
    } catch (error) {
      console.error(error);

      return {
        index: this.index,
      };
    }
  }
}
