import _ from "lodash";

function deepDiff(obj1: object, obj2: object): object {
    return _.transform(obj2, (result, value, key) => {
        const originalValue = obj1[key];

        if (_.isObject(value) && _.isObject(originalValue)) {
            const diff = deepDiff(originalValue, value);
            if (!_.isEmpty(diff)) {
                (result as any)[key] = diff;
            } else if (key === "id" && _.isEqual(value, originalValue)) {
                // mantener `id` si es igual, aunque no haya diferencia
                result[key] = value;
            }
        } else if (!_.isEqual(value, originalValue)) {
            result[key] = value;
        } else if (key === "id" && _.isEqual(value, originalValue)) {
            result[key] = value;
        }
    }, {});
}


// const original = {
//     id: 42,
//     name: "Juan",
//     settings: {
//       id: 1001,
//       theme: "light",
//       notifications: true
//     }
//   };
  
//   const updated = {
//     id: 42,
//     name: "Juan",
//     settings: {
//       id: 1001,
//       theme: "dark",
//       notifications: true
//     }
//   };
  
//   const changes = deepDiff(original, updated);
//   console.log(changes);
//   /*
//   {
//     id: 42,
//     settings: {
//       id: 1001,
//       theme: "dark"
//     }
//   }
//   */
  

function deepDiff2(obj1: any, obj2: any): any {
  if (_.isArray(obj1) && _.isArray(obj2)) {
    const diffs: any[] = [];

    // Indexar por ID para acceso rápido
    const obj1ById = _.keyBy(obj1, "id");
    const obj2ById = _.keyBy(obj2, "id");

    // Detectar cambios y adiciones
    for (const item2 of obj2) {
      const item1 = obj1ById[item2.id];
      if (!item1) {
        // Nuevo
        diffs.push(item2);
      } else {
        const diff:any = deepDiff(item1, item2);
        if (!_.isEmpty(diff)) {
          if (!diff.id) diff.id = item2.id; // mantener id si cambió algo
          diffs.push(diff);
        }
      }
    }

    // Detectar eliminados
    for (const item1 of obj1) {
      if (!obj2ById[item1.id]) {
        diffs.push({ id: item1.id, _deleted: true });
      }
    }

    return diffs.length ? diffs : undefined;
  }

  if (_.isObject(obj2)) {
    return _.transform(obj2, (result:any, value, key) => {
      const val1 = obj1?.[key];
      if (_.isObject(value) && _.isObject(val1)) {
        const diff = deepDiff(val1, value);
        if (!_.isEmpty(diff)) {
          result[key] = diff;
        } else if (key === "id" && _.isEqual(value, val1)) {
          result[key] = value;
        }
      } else if (!_.isEqual(value, val1)) {
        result[key] = value;
      } else if (key === "id" && _.isEqual(value, val1)) {
        result[key] = value;
      }
    }, {});
  }

  return !_.isEqual(obj1, obj2) ? obj2 : undefined;
}
