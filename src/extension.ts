"use strict";
import * as vscode from "vscode";
import { addReducer } from "./addReducer";

export function activate(context: vscode.ExtensionContext) {
  vscode.commands.registerTextEditorCommand("nelfe.addAction", addAction);
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
