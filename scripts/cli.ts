import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** `true` si el módulo se ejecutó directo con `node` (no importado desde un test). */
export function esPrincipal(urlModulo: string): boolean {
  return Boolean(process.argv[1]) && resolve(process.argv[1]) === fileURLToPath(urlModulo);
}
