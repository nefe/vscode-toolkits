"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { addReducer } from "./addReducer";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "vscode-nelfe" is now active!');
  vscode.commands.registerTextEditorCommand("swag.addAction", addAction);

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand("extension.sayHello", () => {
    // The code you place here will be executed every time your command is executed

    // Display a message box to the user
    vscode.window.showInformationMessage("Hello World!");
  });

  context.subscriptions.push(disposable);
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

// this method is called when your extension is deactivated
export function deactivate() {}
