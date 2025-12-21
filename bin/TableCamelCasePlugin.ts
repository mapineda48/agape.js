import {
  type KyselyPlugin,
  OperationNodeTransformer,
  type RootOperationNode,
  TableNode,
  IdentifierNode,
  SchemableIdentifierNode,
} from 'kysely';

// camelCase/PascalCase -> snake_case
function toSnakeCase(input: string): string {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z0-9]+)/g, '$1_$2')
    .toLowerCase();
}

/**
 * Convierte nombres de tablas (NO columnas) de camelCase -> snake_case.
 *
 * Ej:
 * - invStockMovement -> inv_stock_movement
 * - SalesOrderLine   -> sales_order_line
 *
 * Respeta:
 * - schema.table  (solo transforma table)
 * - alias         (no lo toca)
 */
class TableNameTransformer extends OperationNodeTransformer {
  override transformTable(node: TableNode): TableNode {
    // TableNode.table puede ser IdentifierNode o SchemableIdentifierNode según el caso
    const t: any = node.table;

    // Caso 1: "table"
    if (t?.kind === 'IdentifierNode') {
      const name = (t as IdentifierNode).name;
      return {
        ...node,
        table: {
          ...t,
          name: toSnakeCase(name),
        } as IdentifierNode,
      };
    }

    // Caso 2: "schema"."table"
    if (t?.kind === 'SchemableIdentifierNode') {
      const si = t as SchemableIdentifierNode;
      return {
        ...node,
        table: {
          ...si,
          // schema queda igual, table se transforma
          identifier: {
            ...(si as any).identifier,
            name: toSnakeCase((si as any).identifier.name),
          },
        } as any,
      };
    }

    // Otros casos (subquery, raw sql, etc.)
    return super.transformTable(node);
  }

  override transformNode(node: RootOperationNode): RootOperationNode {
    return super.transformNode(node);
  }
}

export class TableCamelCasePlugin implements KyselyPlugin {
  private readonly transformer = new TableNameTransformer();

  transformQuery(args: { node: RootOperationNode }) {
    return {
      ...args,
      node: this.transformer.transformNode(args.node),
    };
  }

  // No tocamos el result set
  async transformResult(args: any) {
    return args.result;
  }
}
