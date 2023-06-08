import process from 'node:process';
import * as dotenv from 'dotenv';
import { join, resolve } from 'node:path';
import { mergeDeepLeft } from 'ramda';
import {
  APP_CONFIG_FILE,
  CONFIG_PORT,
  DB_SERVICE,
  DEFAULT_BUILD,
  DEFAULT_SERVER_PORT,
  FX_SERVICE,
  SERVER_SERVICE,
  VIEW_ENGINE,
  WATCHER_PORT,
} from './constants.js';

export async function loadConfig(appRoot) {
  // platform config - env
  dotenv.config();

  const { SERVER_PORT: envServerPort, DB_URI: envDbUri } = process.env;
  const isDev = process.env.NODE_ENV === 'development';

  // application config - rugo.config.js
  const appConfigPath = resolve(appRoot, APP_CONFIG_FILE);
  let appConfig = {};

  try {
    appConfig = (await import(appConfigPath)).default;
  } catch (err) {
    throw new Error(`Invalid config file ${appConfigPath}`);
  }

  const build = mergeDeepLeft(appConfig.build || {}, DEFAULT_BUILD);
  build.root = appRoot;

  // space
  const { space } = appConfig;
  if (!space) throw new Error(`Space config is required at ${appConfigPath}`);
  space.storage = join(appRoot, build.dst);

  return {
    isDev,
    build,
    port: CONFIG_PORT,
    services: [
      /* server definition */
      mergeDeepLeft(
        {
          settings: {
            port: envServerPort || DEFAULT_SERVER_PORT,
            engine: VIEW_ENGINE,
            inject: isDev ? WATCHER_PORT : false,
            space,
          },
        },
        SERVER_SERVICE
      ),

      /* db definition */
      mergeDeepLeft(
        {
          settings: {
            uri: envDbUri,
          },
        },
        DB_SERVICE
      ),

      /* fx definition */
      FX_SERVICE,
    ],
  };
}
