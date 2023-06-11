import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// cwd
export const __dirname = dirname(fileURLToPath(import.meta.url));
let cwd = resolve(__dirname, '../node_modules');
if (!existsSync(cwd)) cwd = resolve('./node_modules');

// common
export const CONFIG_PORT = 2023; // for broker
export const WATCHER_PORT = 8001;
export const VIEW_ENGINE = 'fx.run';
export const APP_CONFIG_FILE = 'rugo.config.js';
export const API_PREFIX = '/api/v1';
export const DELAY = 1000;

// naming
export const USER_ASSET_NAME = 'users';
export const KEY_ASSET_NAME = 'keys';
export const ROLE_ASSET_NAME = 'roles';
export const ADMIN_ROLE_NAME = 'admin';
export const TEST_DB_NAME = 'test';

// default
export const DEFAULT_SERVER_PORT = 8080;
export const DEFAULT_AUTH_SECRET = 'thisisasecret';
export const DEFAULT_BUILD = {
  src: 'src',
  dst: 'dist',
  public: 'public',
  data: 'data',
  static: 'statics',
  view: 'views',
};
export const DEFAULT_ASSETS = [
  {
    name: 'keys',
    type: 'db',
    properties: {
      hash: { type: 'String' },
    },
  },
  {
    name: 'users',
    type: 'db',
    properties: {
      email: { type: 'String' },
      creds: { type: 'Array' },
    },
  },
  {
    name: 'roles',
    type: 'db',
    properties: {
      name: { type: 'String' },
      perms: { type: 'Array' },
    },
  },
];

// service
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

export const AUTH_SERVICE = {
  name: 'auth',
  exec: ['node', './@rugo-vn/auth/src/index.js'],
  cwd,
  settings: {
    db: DB_SERVICE.name,
  },
};

export const SERVER_SERVICE = {
  name: 'server',
  exec: ['node', './@rugo-vn/server/src/index.js'],
  cwd,
  settings: {
    engine: VIEW_ENGINE,
    api: {
      base: API_PREFIX,
      mappings: {
        'login.post': 'auth.login',
        '.get': 'db.find',
        '.post': 'db.create',
        '.patch': 'db.update',
        '.put': 'db.replace',
        '.delete': 'db.remove',
      },
      auth: AUTH_SERVICE.name,
    },
  },
};
