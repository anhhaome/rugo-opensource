import { join } from 'node:path';

export const CONFIG_PORT = 2023;
export const SERVER_PORT = 8000;

export const DATA_PATH = 'data';
export const SPACE_FILE_NAME = join(DATA_PATH, 'space.json');

export const SERVER_SERVICE = {
  name: 'server',
  exec: ['node', './node_modules/@rugo-vn/server/src/index.js'],
  cwd: './',
  settings: {},
};
