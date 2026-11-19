import type { Plugin } from "vite";
import ts from "typescript";
import { readFileSync } from "node:fs";
const table: Record<string, string> = JSON.parse(
  readFileSync(new URL("./en.json", import.meta.url), "utf8"),
);
export function uiLanguage(): Plugin {
  return {
    name: "focus-buddy-local-language",
    enforce: "pre",
    transform(source, id) {
      if (
        !id.includes("/src/") ||
        !/[.]tsx?$/.test(id) ||
        id.includes("/ai3/") ||
        id.includes("/foundation/language.") ||
        id.includes("/discussion/catalog.")
      )
        return null;
      const file = ts.createSourceFile(
        id,
        source,
        ts.ScriptTarget.Latest,
        true,
        id.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
      );
      const changes: { start: number; end: number; text: string }[] = [];
      function visit(n: ts.Node) {
        const jsx = ts.isJsxText(n);
        if (jsx || ts.isStringLiteral(n)) {
          const original = n.text,
            lookup = original.trim().replace(/\s+/g, " ");
          const tr = table[lookup];
          if (typeof tr === "string") {
            const p = n.parent;
            if (
              ts.isLiteralTypeNode(p) ||
              ts.isImportDeclaration(p) ||
              ts.isExportDeclaration(p) ||
              (ts.isPropertyAssignment(p) && p.name === n) ||
              ts.isCaseClause(p)
            )
              return;
            const value = jsx ? original.replace(/\S[\s\S]*\S|\S/, tr) : tr;
            const expr = `(__fbEnglish?${JSON.stringify(value)}:${JSON.stringify(original)})`;
            changes.push({
              start: jsx ? n.pos : n.getStart(file),
              end: n.end,
              text: jsx || ts.isJsxAttribute(p) ? "{" + expr + "}" : expr,
            });
          }
        }
        ts.forEachChild(n, visit);
      }
      visit(file);
      if (!changes.length) return null;
      let code = source;
      for (const c of changes.reverse())
        code = code.slice(0, c.start) + c.text + code.slice(c.end);
      return {
        code:
          'import {english as __fbEnglish} from "/src/foundation/language";\n' +
          code,
        map: null,
      };
    },
  };
}
