"use strict";
import * as vscode from "vscode";
import { addReducer } from "./addReducer";
import { findI18NPositions, Position } from "./findI18NPositions";

function transformPosition(pos: Position, editorText: string) {
  const { start, code } = pos;

  const width = code.length;
  const lines = editorText.slice(0, start + 1).split("\n");
  const line = lines.length - 1;
  const ch = lines[line].length;

  const first = new vscode.Position(line, ch);
  const last = new vscode.Position(line, ch + width);
  return new vscode.Range(first, last);
}

class CodeLensProvider implements vscode.CodeLensProvider {
  public provideCodeLenses(document: vscode.TextDocument) {
    const code = document.getText();
    const positions = findI18NPositions(code);
    const codeLens = [] as vscode.CodeLens[];

    return positions.map(pos => {
      const range = transformPosition(pos, code);
      return new vscode.CodeLens(range, {
        title: pos.cn,
        command: "",
        tooltip: pos.cn
      });
    });
  }
}

export function activate(context: vscode.ExtensionContext) {
  vscode.commands.registerTextEditorCommand("nelfe.addAction", addAction);
  vscode.commands.registerTextEditorCommand("nelfe.findI18N", findI18N);

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      ["typescript", "typescriptreact"],
      new CodeLensProvider()
    )
  );
}

export function findI18N() {
  const document = vscode.window.activeTextEditor.document;
  const code = document.getText();
  const positions = findI18NPositions(code);

  vscode.window
    .showQuickPick(positions.map(pos => `${pos.cn}  ${pos.code}`))
    .then(item => {
      const foundPos = positions.find(pos => `${pos.cn}  ${pos.code}` === item);

      const range = transformPosition(foundPos, code);
      vscode.window.activeTextEditor.selection = new vscode.Selection(
        range.start,
        range.end
      );
      vscode.window.activeTextEditor.revealRange(
        range,
        vscode.TextEditorRevealType.InCenter
      );
    });

  // vscode.window
  //   .showInputBox({
  //     ignoreFocusOut: true,
  //     prompt: "输入中文进行搜索，支持I18N",
  //     placeHolder: "请输入中文"
  //   })
  //   .then(input => {

  //     const I18NTextPositions = findI18NPositions(code, input);

  //   });
}

export function addAction() {
  vscode.window
    .showInputBox({
      ignoreFocusOut: true,
      prompt:
        "增加简单的 actionCreator；输入: actionCreator名#payload类型#变量名#初始值",
      placeHolder: "actionCreator#payload类型#变量名#初始值"
    })
    .then(input => {
      const [actionCreator, payloadType, name, initialValue] = input.split("#");
      const document = vscode.window.activeTextEditor.document;
      const filename = document.fileName;

      const code = document.getText();
      const newCode = addReducer(code, {
        actionCreator,
        payloadType,
        name,
        initialValue
      });

      vscode.window.activeTextEditor
        .edit(builder => {
          builder.replace(
            new vscode.Range(
              new vscode.Position(0, 0),
              new vscode.Position(newCode.split("\n").length, 0)
            ),
            newCode
          );
        })
        .then(() => {
          vscode.window.activeTextEditor.document.save();
        });
    });
}

export function deactivate() {}
