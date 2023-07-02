import process from 'node:process';
import * as dotenv from 'dotenv';
import { join, resolve } from 'node:path';
import { clone, find, mergeDeepLeft, propEq } from 'ramda';
import {
  APP_CONFIG_FILE,
  AUTH_SERVICE,
  CONFIG_PORT,
  DB_SERVICE,
  DEFAULT_ASSETS,
  DEFAULT_AUTH_SECRET,
  DEFAULT_BUILD,
  DEFAULT_SERVER_PORT,
  FX_SERVICE,
  KEY_ASSET_NAME,
  ROLE_ASSET_NAME,
  SERVER_SERVICE,
  USER_ASSET_NAME,
  WATCHER_PORT,
} from './constants.js';

export async function loadConfig(appRoot) {
  // platform config - env
  dotenv.config();

  const {
    SERVER_PORT: envServerPort,
    DB_URI: envDbUri,
    AUTH_SECRET: envAuthSecret,
    ADMIN_EMAIL: envAdminEmail,
    ADMIN_PASSWORD: envAdminPassword,
  } = process.env;
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

  // admin
  const admin =
    envAdminEmail && envAdminPassword
      ? { email: envAdminEmail, password: envAdminPassword }
      : null;

  // space
  const { space } = appConfig;
  if (!space) throw new Error(`Space config is required at ${appConfigPath}`);
  space.storage = join(appRoot, build.dst);

  for (const asset of DEFAULT_ASSETS) {
    space.assets ||= [];
    space.assets.push(asset);
  }

  const userSchema = clone(find(propEq('name', USER_ASSET_NAME))(space.assets));
  const keySchema = clone(find(propEq('name', KEY_ASSET_NAME))(space.assets));
  const roleSchema = clone(find(propEq('name', ROLE_ASSET_NAME))(space.assets));

  const opts = {
    userSchema,
    keySchema,
    roleSchema,
  };

  return {
    isDev,
    build,
    port: CONFIG_PORT,
    admin,
    opts,
    services: [
      /* server definition */
      mergeDeepLeft(
        {
          settings: {
            port: envServerPort || DEFAULT_SERVER_PORT,
            inject: isDev ? WATCHER_PORT : false,
            space,
            api: {
              opts,
            },
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

      /* auth definition */
      mergeDeepLeft(
        {
          settings: {
            secret: envAuthSecret || DEFAULT_AUTH_SECRET,
          },
        },
        AUTH_SERVICE
      ),

      /* fx definition */
      FX_SERVICE,
    ],
  };
}
