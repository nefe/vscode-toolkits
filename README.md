# vscode-nelfe README

## privide snippets for [iron-redux](https://github.com/nefe/iron-redux)

snippets prefix: `sredux`. for iron-redux Redux File

snippets prefix: `sreact`. for iron-redux React View File

## auto add all code of add a action in iron-redux

cmd+ctrl+a: dynamic add an plain action in Redux File

cmd+ctrl+k: dynamic add an fetch action with Pont in Redux File

input your actionCreator name, action payload Type, state field name and initial value, and join with `#`, toolkits will auto generate all the types, actions, reducers and state code for you!

## calculate your code details

#### step 1: configure nefe-config.json in your project as below

the config means ignored calculate files.

```
{
  "ignoredExtnames": [
    ".img",
    ".md",
    ".png",
    ".gif",
    ".jpg",
    ".old",
    ".eot",
    ".ttf",
    ".svg",
    ".woff",
    ".del",
    ".bak",
    ".json",
    ".map"
  ]
}
```

#### step 2: Right mouse click any file tree item, and click `calculate your code` item
