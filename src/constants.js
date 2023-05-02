import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const CONFIG_PORT = 2023;
export const SERVER_PORT = 8000;
export const WATCHER_PORT = 8001;

export const DATA_PATH = 'data';
export const SPACE_FILE_NAME = join(DATA_PATH, 'space.json');

export const VIEW_ENGINE = 'fx.run';

export const SERVER_SERVICE = {
  name: 'server',
  exec: ['node', './node_modules/@rugo-vn/server/src/index.js'],
  cwd: resolve(__dirname, '../'),
  settings: {},
};

export const FX_SERVICE = {
  name: 'fx',
  exec: ['node', './node_modules/@rugo-vn/fx/src/index.js'],
  cwd: resolve(__dirname, '../'),
  settings: {},
};
