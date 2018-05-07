import * as ts from "typescript";
import * as vscode from "vscode";
import * as path from "path";

require("ts-node").register();

function get(map: any, fields: string[]) {
  if (!fields.length) {
    if (typeof map === "string") {
      return map;
    }

    return "";
  }

  const [field, ...rest] = fields;

  if (map[field]) {
    return get(map[field], rest);
  }

  return "";
}

class Cache {
  memories = [] as Array<{ code: string; positions: Position[] }>;
  addCache(code: string, positions: Position[]) {
    this.memories.push({
      code,
      positions
    });

    if (this.memories.length > 8) {
      this.memories.shift();
    }
  }
  getPositionsByCode(code: string) {
    const mem = this.memories.find(mem => mem.code === code);
    if (mem && mem.positions) {
      return mem.positions;
    }

    return false;
  }
}

const cache = new Cache();

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

export function findI18NPositions(code: string) {
  const cachedPoses = cache.getPositionsByCode(code);
  if (cachedPoses) {
    return cachedPoses;
  }

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
      case ts.SyntaxKind.CallExpression: {
        const { expression } = node as ts.CallExpression;
        const args = (node as ts.CallExpression).arguments;

        if (expression.kind === ts.SyntaxKind.PropertyAccessExpression) {
          const {
            expression: main,
            name: method
          } = expression as ts.PropertyAccessExpression;

          if (
            (main as ts.Identifier).text === "I18N" &&
            method &&
            method.text === "get"
          ) {
            if (args[0] && (args[0] as ts.StringLiteral).text) {
              const exps = (args[0] as ts.StringLiteral).text.split(".");
              const transformedCn = get(I18N, exps) as string;

              if (transformedCn) {
                const position = new Position();

                position.cn = transformedCn;
                position.start = main.pos;
                position.code = ["I18N", ...exps].join(".");
                positions.push(position);
              }
            }
          }
        }
        break;
      }
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

          if (transformedCn) {
            const position = new Position();

            position.cn = transformedCn;
            position.start = node.pos;
            position.code = ["I18N", ...exps].join(".");
            positions.push(position);
          }
        }
        break;
      }
    }

    ts.forEachChild(node, cNode => processNode(cNode as any));
  }

  cache.addCache(code, positions);
  return positions;
}
