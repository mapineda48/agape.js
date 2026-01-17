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
    permissions: [
      { key: "config.system.read", label: "Ver configuración" },
      { key: "config.system.manage", label: "Gestionar configuración" },
      { key: "numbering.series.read", label: "Ver series de numeración" },
      { key: "numbering.series.manage", label: "Gestionar series de numeración" },
      { key: "numbering.type.read", label: "Ver tipos de documento" },
      { key: "numbering.type.manage", label: "Gestionar tipos de documento" },
      { key: "numbering.sequence.next", label: "Generar siguiente número de documento" },
    ],
  },
  {
    key: "inventory",
    label: "Inventario",
    navigation: {
      key: "inventory.view",
      label: "Acceso al módulo de inventario",
      routes: ["/cms/inventory"],
      menu: [
        "/cms/inventory",
        "/cms/inventory/movements",
        "/cms/inventory/product",
        "/cms/inventory/products",
        "/cms/inventory/stock",
      ],
    },
    permissions: [
      // Items / Products
      { key: "inventory.item.read", label: "Ver productos" },
      { key: "inventory.item.manage", label: "Gestionar productos" },
      // Locations
      { key: "inventory.location.read", label: "Ver ubicaciones" },
      { key: "inventory.location.manage", label: "Gestionar ubicaciones" },
      // Movements
      { key: "inventory.movement.read", label: "Ver movimientos" },
      { key: "inventory.movement.manage", label: "Gestionar movimientos" },
      // Stock
      { key: "inventory.stock.read", label: "Ver stock" },
      // Unit of Measure
      { key: "inventory.unit_of_measure.read", label: "Ver unidades de medida" },
      {
        key: "inventory.unit_of_measure.manage",
        label: "Gestionar unidades de medida",
      },
      // Movement Types
      { key: "inventory.movement_type.read", label: "Ver tipos de movimiento" },
      { key: "inventory.movement_type.manage", label: "Gestionar tipos de movimiento" },
    ],
  },
  {
    key: "sales",
    label: "Ventas",
    navigation: {
      key: "sales.view",
      label: "Acceso al módulo de ventas",
      routes: ["/cms/sales"],
      menu: ["/cms/sales", "/cms/sales/orders"],
    },
    permissions: [
      { key: "sales.order.read", label: "Ver pedidos" },
      { key: "sales.order.manage", label: "Gestionar pedidos" },
      { key: "sales.flow.deliver", label: "Crear despachos" },
      { key: "sales.flow.invoice", label: "Facturar pedidos" },
    ],
  },
  {
    key: "purchasing",
    label: "Compras",
    navigation: {
      key: "purchasing.view",
      label: "Acceso al módulo de compras",
      routes: ["/cms/purchasing"],
      menu: ["/cms/purchasing", "/cms/purchasing/orders", "/cms/purchasing/receive"],
    },
    permissions: [
      // Suppliers
      { key: "purchasing.supplier.read", label: "Ver proveedores" },
      { key: "purchasing.supplier.manage", label: "Gestionar proveedores" },
      // Supplier Types
      { key: "purchasing.supplier_type.read", label: "Ver tipos de proveedor" },
      { key: "purchasing.supplier_type.manage", label: "Gestionar tipos de proveedor" },
      // Purchase Orders
      { key: "purchasing.purchase_order.read", label: "Ver órdenes de compra" },
      { key: "purchasing.purchase_order.manage", label: "Gestionar órdenes de compra" },
      // Goods Receipt
      { key: "purchasing.goods_receipt.read", label: "Ver recepciones" },
      { key: "purchasing.goods_receipt.manage", label: "Gestionar recepciones" },
    ],
  },
  {
    key: "crm",
    label: "CRM",
    navigation: {
      key: "crm.view",
      label: "Acceso al módulo de CRM/Clientes",
      routes: ["/cms/crm"],
      menu: ["/cms/crm", "/cms/crm/clients"],
    },
    permissions: [
      { key: "crm.client.read", label: "Ver clientes" },
      { key: "crm.client.manage", label: "Gestionar clientes" },
      { key: "crm.client_type.read", label: "Ver tipos de cliente" },
      { key: "crm.client_type.manage", label: "Gestionar tipos de cliente" },
    ],
  },
  {
    key: "hr",
    label: "Recursos Humanos",
    navigation: {
      key: "hr.view",
      label: "Acceso al módulo de recursos humanos",
      routes: ["/cms/hr"],
      menu: ["/cms/hr"],
    },
    permissions: [
      { key: "hr.employee.read", label: "Ver empleados" },
      { key: "hr.employee.manage", label: "Gestionar empleados" },
      { key: "hr.department.read", label: "Ver departamentos" },
      { key: "hr.department.manage", label: "Gestionar departamentos" },
      { key: "hr.job_position.read", label: "Ver cargos" },
      { key: "hr.job_position.manage", label: "Gestionar cargos" },
    ],
  },
  {
    key: "finance",
    label: "Finanzas",
    navigation: {
      key: "invoicing.view",
      label: "Acceso al módulo de facturación",
      routes: ["/cms/invoicing"],
      menu: ["/cms/invoicing", "/cms/invoicing/sales", "/cms/invoicing/purchase", "/cms/invoicing/payments"],
    },
    permissions: [
      // Sales Invoices
      { key: "finance.sales_invoice.read", label: "Ver facturas de venta" },
      { key: "finance.sales_invoice.manage", label: "Gestionar facturas de venta" },
      // Purchase Invoices
      { key: "finance.purchase_invoice.read", label: "Ver facturas de compra" },
      { key: "finance.purchase_invoice.manage", label: "Gestionar facturas de compra" },
      // Payments
      { key: "finance.payment.read", label: "Ver pagos" },
      { key: "finance.payment.manage", label: "Gestionar pagos" },
      // Payment Methods
      { key: "finance.payment_method.read", label: "Ver métodos de pago" },
      { key: "finance.payment_method.manage", label: "Gestionar métodos de pago" },
      // Currencies
      { key: "finance.currency.read", label: "Ver monedas" },
      { key: "finance.currency.manage", label: "Gestionar monedas" },
      // Taxes
      { key: "finance.tax.read", label: "Ver impuestos" },
      { key: "finance.tax.manage", label: "Gestionar impuestos" },
      // Tax Groups
      { key: "finance.tax_group.read", label: "Ver grupos de impuestos" },
      { key: "finance.tax_group.manage", label: "Gestionar grupos de impuestos" },
    ],
  },
  {
    key: "catalogs",
    label: "Catálogos",
    // Note: Catalogs shares navigation with inventory module
    permissions: [
      // Items
      { key: "catalogs.item.read", label: "Ver ítems del catálogo" },
      { key: "catalogs.item.manage", label: "Gestionar ítems" },
      // Categories
      { key: "catalogs.category.read", label: "Ver categorías" },
      { key: "catalogs.category.manage", label: "Gestionar categorías" },
      // Price Lists
      { key: "catalogs.price_list.read", label: "Ver listas de precios" },
      { key: "catalogs.price_list.manage", label: "Gestionar listas de precios" },
    ],
  },
  {
    key: "core",
    label: "Core",
    // Note: Core module has no navigation, it's backend utilities
    permissions: [
      // Users
      { key: "core.user.read", label: "Ver datos de usuarios" },
      { key: "core.user.manage", label: "Gestionar datos de usuarios" },
      // Addresses
      { key: "core.address.read", label: "Ver direcciones" },
      { key: "core.address.manage", label: "Gestionar direcciones" },
      // Contact Methods
      { key: "core.contact_method.read", label: "Ver métodos de contacto" },
      { key: "core.contact_method.manage", label: "Gestionar métodos de contacto" },
      // Document Types
      { key: "core.document_type.read", label: "Ver tipos de documento" },
      { key: "core.document_type.manage", label: "Gestionar tipos de documento" },
    ],
  },
];

export function buildNavigationPermissions(
  modules: RbacModule[] = rbacModules
): Record<string, string> {
  return modules.reduce<Record<string, string>>((acc, module) => {
    if (module.navigation) {
      acc[module.navigation.key] = module.navigation.label;
    }
    return acc;
  }, {});
}

export function buildRoutePermissions(
  modules: RbacModule[] = rbacModules
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
  modules: RbacModule[] = rbacModules
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
