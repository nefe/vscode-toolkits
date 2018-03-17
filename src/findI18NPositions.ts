import * as ts from "typescript";
import * as vscode from "vscode";
import * as path from "path";

require("ts-node").register();

function get(map: any, fields: string[]) {
  if (!fields.length) {
    if (typeof map === "string") {
      return map;
    }

    throw new Error(map + "withod fields");
  }

  const [field, ...rest] = fields;

  if (map[field]) {
    return get(map[field], rest);
  }

  return "";
}

function getI18NText(node: ts.PropertyAccessExpression, exps: string[] = []) {
  const name: ts.Identifier = node.name;
  const parent = node.parent as ts.PropertyAccessExpression;

  if (
    parent &&
    parent.kind === ts.SyntaxKind.PropertyAccessExpression &&
    parent.name
  ) {
    return getI18NText(parent, [...exps, name.escapedText as string]);
  } else {
    return [...exps, name.text];
  }
}

export class Position {
  start: number;
  cn: string;
  code: string;
}

export function findI18NPositions(code: string, cn: string) {
  const workspace = vscode.workspace.rootPath;
  const I18N = require(path.resolve(workspace, "langs/zh_CN/index.ts")).default;
  const ast = ts.createSourceFile(
    "",
    code,
    ts.ScriptTarget.ES2015,
    true,
    ts.ScriptKind.TSX
  );
  const positions = [] as Position[];

  processNode(ast);

  function processNode(node: ts.Node) {
    switch (node.kind) {
      case ts.SyntaxKind.PropertyAccessExpression: {
        const {
          expression,
          name,
          parent
        } = node as ts.PropertyAccessExpression;

        if ((expression as ts.Identifier).escapedText === "I18N") {
          // 分析表达式
          const exps = getI18NText(node as ts.PropertyAccessExpression, []);

          const transformedCn = get(I18N, exps) as string;

          if (transformedCn.includes(cn)) {
            const position = new Position();

            position.cn = transformedCn;
            position.start = node.pos;
            position.code = ["I18N", ...exps].join(".");
            positions.push(position);
          }
        }
      }
    }

    ts.forEachChild(node, cNode => processNode(cNode as any));
  }

  return positions;
}
