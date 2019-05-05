'use strict';
import * as vscode from 'vscode';
import { addReducer, addFetchReducer } from './addReducer';
import { analysis } from './analysisCode';
import { findI18NPositions, Position } from './findI18NPositions';

export function activate(context: vscode.ExtensionContext) {
  vscode.commands.registerTextEditorCommand('nefe.addAction', addAction);
  vscode.commands.registerCommand('nefe.analysis', analysis);
  vscode.commands.registerTextEditorCommand(
    'nefe.addFetchAction',
    addFetchAction
  );
}

export function addAction() {
  vscode.window
    .showInputBox({
      ignoreFocusOut: true,
      prompt: 'action名 # payload 类型 # 属性名 # 初始值',
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

export async function addFetchAction() {
  const document = vscode.window.activeTextEditor.document;

  const code = document.getText();
  let strs = [];
  try {
    strs = await vscode.commands.executeCommand<Array<string>>(
      'pont.findInterface',
      true
    );
  } catch (e) {
    debugger;
    return;
  }
  const [api, modName, interName] = strs;

  const attrName = await vscode.window.showInputBox({
    ignoreFocusOut: true,
    prompt: '请输入关联属性名',
    placeHolder: '请输入 InitialState 中关联属性名'
  });
  const newCode = addFetchReducer(code, {
    modName,
    interName,
    attrName
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
}

export function deactivate() {}
