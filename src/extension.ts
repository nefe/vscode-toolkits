'use strict';
import * as vscode from 'vscode';
import { addReducer } from './addReducer';
import { analysis } from './analysisCode';
import { findI18NPositions, Position } from './findI18NPositions';

export function activate(context: vscode.ExtensionContext) {
  vscode.commands.registerTextEditorCommand('nefe.addAction', addAction);
  vscode.commands.registerCommand('nefe.analysis', analysis);
}

export function addAction() {
  vscode.window
    .showInputBox({
      ignoreFocusOut: true,
      prompt:
        'generate action code, prompt: actionCreator name#payload type#field name#init value',
      placeHolder: 'actionCreator#payload_type#field_name#init'
    })
    .then(input => {
      const [actionCreator, payloadType, name, initialValue] = input.split('#');
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
              new vscode.Position(newCode.split('\n').length, 0)
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
