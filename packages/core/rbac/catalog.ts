export type RbacPermission = {
  key: string;
  label: string;
};

export type RbacNavigation = {
  key: string;
  label: string;
  routes: string[];
  menu: string[];
};

export type RbacModule = {
  key: string;
  label: string;
  navigation?: RbacNavigation;
  permissions: RbacPermission[];
};

export const rbacModules: RbacModule[] = [
  {
    key: "configuration",
    label: "Configuración",
    navigation: {
      key: "configuration.admin",
      label: "Acceso a configuración del sistema",
      routes: ["/cms/configuration"],
      menu: ["/cms/configuration"],
    },
    permissions: [{ key: "config.system.read", label: "Ver configuración" }],
  },
];

export function buildNavigationPermissions(
  modules: RbacModule[] = rbacModules,
): Record<string, string> {
  return modules.reduce<Record<string, string>>((acc, module) => {
    if (module.navigation) {
      acc[module.navigation.key] = module.navigation.label;
    }
    return acc;
  }, {});
}

export function buildRoutePermissions(
  modules: RbacModule[] = rbacModules,
): Record<string, string> {
  return modules.reduce<Record<string, string>>((acc, module) => {
    if (!module.navigation) {
      return acc;
    }

    for (const route of module.navigation.routes) {
      acc[route] = module.navigation.key;
    }

    return acc;
  }, {});
}

export function buildMenuPermissions(
  modules: RbacModule[] = rbacModules,
): Record<string, string> {
  return modules.reduce<Record<string, string>>((acc, module) => {
    if (!module.navigation) {
      return acc;
    }

    for (const menu of module.navigation.menu) {
      acc[menu] = module.navigation.key;
    }

    return acc;
  }, {});
}
