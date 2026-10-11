// Loader per i test con `node --experimental-strip-types`:
// risolve l'alias "@/" verso src/ e aggiunge l'estensione .ts.
// Uso: node --experimental-strip-types --import ./scripts/test-alias.mjs --test src/lib/sos/*.test.ts
import { register } from "node:module";

register(
  "data:text/javascript," +
    encodeURIComponent(`
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
const SRC = ${JSON.stringify(new URL("../src/", import.meta.url).href)};
function withExt(url) {
  const path = fileURLToPath(url);
  if (existsSync(path) && !path.endsWith("/")) return url;
  for (const ext of [".ts", ".tsx", "/index.ts"]) {
    if (existsSync(path + ext)) return pathToFileURL(path + ext).href;
  }
  return url;
}
export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    return { url: withExt(new URL(specifier.slice(2), SRC).href), shortCircuit: true };
  }
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
    const url = withExt(new URL(specifier, context.parentURL).href);
    return { url, shortCircuit: true };
  }
  return next(specifier, context);
}
`),
);
