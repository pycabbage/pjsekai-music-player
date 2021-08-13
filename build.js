const builder = require('electron-builder');
const fs = require('fs');

fs.copyFileSync("./app.js", "./public/electron.js")

builder.build({
    config: {
        'appId': 'com.pycabbage.pjsekaiplayer',
        "files": [
            "./build/**/*",
            "./node_modules/**/*",
            "./public/electron.js",
            "./**/*"
        ],
        'win': {
            "title": "pjsekai-music-player",
            'target': {
                'target': 'portable',
                // "icon": "public/favicon.ico",
                'arch': [
                    'x64',
                ]
            }
        }
    }
});