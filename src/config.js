import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { mergeDeepLeft } from 'ramda';
import {
  SERVER_PORT,
  CONFIG_PORT,
  SPACE_FILE_NAME,
  SERVER_SERVICE,
  DATA_PATH,
} from './constants.js';

export async function loadConfig(root) {
  const { CONFIG_PORT: ENV_CONFIG_PORT, PORT: ENV_SERVER_PORT } = process.env;

  const spacePath = resolve(root, SPACE_FILE_NAME);
  const space = JSON.parse(
    existsSync(spacePath) ? readFileSync(spacePath) : '{}'
  );

  space.storage = join(resolve(root), DATA_PATH);

  return {
    port: ENV_CONFIG_PORT || CONFIG_PORT,
    services: [
      mergeDeepLeft(
        {
          settings: {
            port: ENV_SERVER_PORT || SERVER_PORT,
            space,
          },
        },
        SERVER_SERVICE
      ),
    ],
  };
}
