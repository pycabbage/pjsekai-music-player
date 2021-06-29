const builder = require('electron-builder');

builder.build({
    config: {
        'appId': 'com.pycabbage.pjsekaiplayer',
        'win': {
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