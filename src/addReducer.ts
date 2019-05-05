import * as ts from 'typescript';
import * as vscode from 'vscode';

interface Replacement {
  begin: number;
  end: number;
  text: string;
}

export function addReducer(code: string, meta) {
  const { actionCreator, payloadType, name: stateName, initialValue } = meta;
  const ast = ts.createSourceFile('', code, ts.ScriptTarget.ES2015);
  const replacements = [] as Replacement[];

  processNode(ast);

  function processNode(node: ts.Node) {
    switch (node.kind) {
      case ts.SyntaxKind.CaseBlock: {
        const defaultClauses = (<ts.CaseBlock>node).clauses.filter(
          clause => clause.kind === ts.SyntaxKind.DefaultClause
        );
        const defaultClause = defaultClauses[0];

        replacements.push({
          begin: defaultClause.pos,
          end: defaultClause.pos,
          text: `
					case Types.${actionCreator}: {
						const ${stateName} = action.payload;

						return {
							...state,
							${stateName},
						};
					}`
        });
      }
      case ts.SyntaxKind.EnumDeclaration: {
        const { members, name } = <ts.EnumDeclaration>node;

        if (name && name.text === 'BasicTypes') {
          let text = `
					${actionCreator},`;

          if (!members.hasTrailingComma && members.length) {
            text = ',' + text;
          }

          replacements.push({
            begin: members.end,
            end: members.end,
            text
          });
        }
      }
      case ts.SyntaxKind.VariableDeclaration: {
        const { name, initializer } = <ts.VariableDeclaration>node;
        if (
          name &&
          (name as any).text === 'actions' &&
          initializer.kind === ts.SyntaxKind.ObjectLiteralExpression
        ) {
          const { properties } = <ts.ObjectLiteralExpression>initializer;

          let text = `
					${actionCreator}: createAction(Types.${actionCreator})<${payloadType}>(),
					`;

          if (!properties.hasTrailingComma && properties.length) {
            text = ',' + text;
          }

          replacements.push({
            begin: properties.end,
            end: properties.end,
            text
          });
        }
      }
      case ts.SyntaxKind.ClassDeclaration: {
        const { name, members } = <ts.ClassDeclaration>node;

        if (name && name.text === 'InitialState') {
          let text = `${stateName} = ${initialValue};`;

          replacements.push({
            begin: members.end,
            end: members.end,
            text
          });
        }
      }
    }

    ts.forEachChild(node, cNode => processNode(cNode as any));
  }

  let acc = 0;

  replacements.sort((a, b) =>
    b.end !== a.end ? b.end - a.end : b.begin - a.begin
  );

  return replacements.reduce((result, replacement) => {
    return (
      result.slice(0, replacement.begin) +
      replacement.text +
      result.slice(replacement.end)
    );
  }, code);
}

export function addFetchReducer(code: string, meta) {
  const { modName, interName, attrName } = meta;
  const ast = ts.createSourceFile('', code, ts.ScriptTarget.ES2015);
  const replacements = [] as Replacement[];

  processNode(ast);

  function processNode(node: ts.Node) {
    switch (node.kind) {
      case ts.SyntaxKind.EnumDeclaration: {
        const { members, name } = <ts.EnumDeclaration>node;

        if (name && name.text === 'FetchTypes') {
          let text = `
					${interName},`;

          if (!members.hasTrailingComma && members.length) {
            text = ',' + text;
          }

          replacements.push({
            begin: members.end,
            end: members.end,
            text
          });
        }
      }
      case ts.SyntaxKind.VariableDeclaration: {
        const { name, initializer } = <ts.VariableDeclaration>node;
        if (
          name &&
          (name as any).text === 'actions' &&
          initializer.kind === ts.SyntaxKind.ObjectLiteralExpression
        ) {
          const { properties } = <ts.ObjectLiteralExpression>initializer;

          let text = `
					${interName}: API.${modName}.${interName}.createFetchAction(Types.${interName}, '${attrName}'),
					`;

          if (!properties.hasTrailingComma && properties.length) {
            text = ',' + text;
          }

          replacements.push({
            begin: properties.end,
            end: properties.end,
            text
          });
        }
      }
      case ts.SyntaxKind.ClassDeclaration: {
        const { name, members } = <ts.ClassDeclaration>node;

        if (name && name.text === 'InitialState') {
          let text = `${attrName} = new AsyncTuple<API.${modName}.${interName}.init>;`;

          replacements.push({
            begin: members.end,
            end: members.end,
            text
          });
        }
      }
    }

    ts.forEachChild(node, cNode => processNode(cNode as any));
  }

  let acc = 0;

  replacements.sort((a, b) =>
    b.end !== a.end ? b.end - a.end : b.begin - a.begin
  );

  return replacements.reduce((result, replacement) => {
    return (
      result.slice(0, replacement.begin) +
      replacement.text +
      result.slice(replacement.end)
    );
  }, code);
}
