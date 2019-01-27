import * as fs from 'fs-extra';
import * as path from 'path';
import { constants } from 'os';
import * as vscode from 'vscode';

interface Record {
  name: string;
  value: number;
}

interface Info {
  [key: string]: number | Info;
}

interface RootInfo {
  total: number;
  children: FullInfo;
}

interface FullInfo {
  [key: string]: RootInfo | number;
}

let CONFIG_CACHE = null as Config;

interface Config {
  ignoredExtnames: string[];
  showRecordMinLimit: number;
}

async function getConfig(useCache = true): Promise<Config> {
  try {
    if (useCache && CONFIG_CACHE) {
      return CONFIG_CACHE;
    }

    const values = await vscode.workspace.findFiles(
      '**/nefe-config.json',
      '**/node_modules/**',
      1
    );

    if (!values.length) {
      const content = JSON.stringify(
        {
          ignoredExtnames: [
            '.img',
            '.png',
            '.gif',
            '.jpg',
            '.old',
            '.eot',
            '.ttf',
            '.svg',
            '.woff',
            '.del',
            '.bak',
            '.map'
          ]
        },
        null,
        2
      );
      fs.writeFileSync(
        path.join(vscode.workspace.rootPath, 'nefe-config.json'),
        content
      );

      return await getConfig(false);
    }

    const uri = values[0];

    const contentStr = await fs.readFile(uri.path, 'utf8');

    const content = JSON.parse(contentStr);
    CONFIG_CACHE = content;

    if (!CONFIG_CACHE.showRecordMinLimit) {
      CONFIG_CACHE.showRecordMinLimit = 0;
    }

    return content;
  } catch (e) {
    console.error(e);
  }
}

async function getCodeLineCnt(uri: string, baseUrl = process.cwd()) {
  const fullUri = path.join(baseUrl, uri);
  const info = await fs.lstat(fullUri);

  if (info.isDirectory()) {
    const dirs = await fs.readdir(fullUri);
    const info = {};

    const infos = await Promise.all(
      dirs.map(dir => {
        return getCodeLineCnt(dir, fullUri);
      })
    );

    dirs.forEach((key, keyIndex) => {
      if (infos[keyIndex] !== -1) {
        info[key] = infos[keyIndex];
      }
    });

    return info;
  }

  const extnames = (await getConfig()).ignoredExtnames;
  if (extnames.indexOf(path.extname(fullUri)) > 0) {
    return -1;
  }

  const code = await fs.readFile(fullUri, 'utf8');

  return code.split('\n').length;
}

function getTotalCnt(info: Info): number {
  let total = 0;

  Object.keys(info).forEach(key => {
    const subInfo = info[key];

    if (typeof subInfo === 'number') {
      total += subInfo;
    } else {
      total += getTotalCnt(subInfo);
    }
  });

  return total;
}

function transferInfo(info: Info): RootInfo {
  let fullInfo = {};
  const total = getTotalCnt(info);

  Object.keys(info).forEach(key => {
    const subInfo = info[key];
    if (typeof subInfo === 'object') {
      fullInfo[key] = transferInfo(subInfo);
    } else {
      fullInfo[key] = subInfo;
    }
  });

  return {
    total,
    children: fullInfo
  };
}

interface Leaf {
  ext: string;
  line: number;
}

function getStastics(info: RootInfo) {
  let result = [] as Leaf[];
  let keys = Object.keys(info.children);

  for (let i = 0; i < keys.length; ++i) {
    const key = keys[i];
    const value = info.children[key];
    const ext = path.extname(key);

    if (typeof value === 'number') {
      const leafIndex = result.findIndex(record => record.ext === ext);

      if (leafIndex > 0) {
        result[leafIndex].line += value;
      } else {
        result.push({ ext, line: value });
      }
    } else {
      const subResult = getStastics(value);

      subResult.forEach(subRecord => {
        const index = result.findIndex(record => record.ext === subRecord.ext);

        if (index !== -1) {
          result[index].line += subRecord.line;
        } else {
          result.push(subRecord);
        }
      });
    }
  }

  return result;
}

function normal(info: RootInfo, name = 'root') {
  const normalChildren = [];

  Object.keys(info.children).forEach(key => {
    const value = info.children[key];

    if (typeof value === 'number') {
      if (value > CONFIG_CACHE.showRecordMinLimit) {
        normalChildren.push({
          name: key,
          value
        });
      }
    } else {
      const sub = normal(value, key);
      if (sub.value > CONFIG_CACHE.showRecordMinLimit) {
        normalChildren.push(sub);
      }
    }
  });
  return {
    name,
    value: info.total,
    children: normalChildren
  };
}

export async function analysis(uri: any) {
  try {
    await getConfig(false);
    const info: any = await getCodeLineCnt('.', uri.path);
    const fullInfo = transferInfo(info);

    const statics = getStastics(fullInfo);

    const finalInfo = normal(fullInfo);

    (finalInfo as any).statics = statics
      .sort((pre, next) => next.line - pre.line)
      .slice(0, 10);

    vscode.workspace.openTextDocument().then(
      doc => {
        vscode.window.showTextDocument(doc).then(editor => {
          editor.edit(builder => {
            builder.insert(
              new vscode.Position(0, 0),
              JSON.stringify(finalInfo, null, 2)
            );
          });
        });
      },
      e => {
        console.error(e);
      }
    );
  } catch (e) {
    console.error(e);
  }
}
