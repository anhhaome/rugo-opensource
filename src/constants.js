import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// cwd
const __dirname = dirname(fileURLToPath(import.meta.url));
let cwd = resolve(__dirname, '../node_modules');
if (!existsSync(cwd)) cwd = resolve('./node_modules');

// common
export const CONFIG_PORT = 2023; // for broker
export const WATCHER_PORT = 8081;
export const VIEW_ENGINE = 'fx.run';
export const APP_CONFIG_FILE = 'rugo.config.js';

// default
export const DEFAULT_SERVER_PORT = 8080;
export const DEFAULT_BUILD = {
  src: 'src',
  dst: 'dist',
  public: 'public',
  static: 'statics',
  view: 'views',
};

// service
export const SERVER_SERVICE = {
  name: 'server',
  exec: ['node', './@rugo-vn/server/src/index.js'],
  cwd,
  settings: {},
};

export const DB_SERVICE = {
  name: 'db',
  exec: ['node', './@rugo-vn/db/src/index.js'],
  cwd,
  settings: {},
};

export const FX_SERVICE = {
  name: 'fx',
  exec: ['node', './@rugo-vn/fx/src/index.js'],
  cwd,
  settings: {},
};
