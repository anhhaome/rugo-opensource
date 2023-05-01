#!/usr/bin/env node

import process from 'process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createBroker, exec, FileCursor } from '@rugo-vn/service';
import { existsSync, readFileSync } from 'fs';
import { mergeDeepLeft } from 'ramda';

const __dirname = dirname(fileURLToPath(import.meta.url));
const platformRoot = join(__dirname, '../');
const isDebugMode = process.env.NODE_ENV === 'debug';

const flag = process.argv[2];
const args = process.argv.slice(3);

async function startAll() {
  // config
  const workRoot = process.cwd();
  const runRoot = join(workRoot, '.rugo');
  const storageRoot = join(runRoot, 'storage');
  const spaceConfigFile = join(runRoot, 'space.json');

  if (!existsSync(runRoot)) {
    await exec(`cp -r "${join(platformRoot, 'templates')}" "${runRoot}"`);
  }

  if (flag === '--prepare') {
    return shutdown('SIGINT')();
  }

  // space
  if (!flag && !existsSync(spaceConfigFile)) {
    console.log(
      `[RUGO OPEN] Cannot found your space.json config. Please create your own to run the platform!`
    );
    return;
  }

  const space = flag ? {} : JSON.parse(readFileSync(spaceConfigFile));
  for (const route of space.routes || []) {
    if (route.handlers) {
      for (const handler of route.handlers) {
        if (handler.name === 'fx.run') {
          for (const inputName in handler.input)
            if (handler.input[inputName].trim().toLowerCase() === '_.space.id')
              handler.input[inputName] = 'storage';
        }
      }
    }

    if (route.handler === 'fx.run') {
      for (const inputName in route.input)
        if (route.input[inputName].trim().toLowerCase() === '_.space.id')
          route.input[inputName] = 'storage';
    }
  }

  for (const driveName in space.drives || {}) {
    const driveConfig = space.drives[driveName];
    if (!driveConfig.mount) continue;

    space.routes.push({
      path: `${driveConfig.mount}(.*)?`,
      handlers: [
        {
          name: 'serve',
          input: { from: join(storageRoot, driveName), path: '_.params.0' },
          output: { headers: '_.headers', body: '_.body' },
        },
      ],
    });
  }

  // platform
  const serviceRoot = isDebugMode ? platformRoot : workRoot;
  const settings = mergeDeepLeft(
    {
      _services: [
        join(serviceRoot, 'node_modules/@rugo-vn/db/src/index.js'),
        join(serviceRoot, 'node_modules/@rugo-vn/storage/src/index.js'),
        join(serviceRoot, 'node_modules/@rugo-vn/fx/src/index.js'),
        join(serviceRoot, 'node_modules/@rugo-vn/server/src/index.js'),
        join(platformRoot, 'src/open.js'),
      ],
      storage: runRoot,
      server: {
        space,
      },
    },
    (await import(join(platformRoot, 'rugo.config.js'))).default
  );

  const broker = createBroker(settings);

  await broker.loadServices();
  await broker.start();

  // load
  for (const schema of space.schemas || []) {
    await broker.call('db.setSchema', {
      spaceId: 'storage',
      schema,
    });
  }

  for (const driveName in space.drives || {}) {
    const config = space.drives[driveName];

    await broker.call('storage.setConfig', {
      spaceId: 'storage',
      driveName,
      config,
    });
  }

  // restore
  if (flag === '--restore') {
    await broker.call(`open.restore`, {
      file: FileCursor(join(workRoot, args[0])),
    });

    return shutdown('SIGINT')();
  }
}

function shutdown(signal) {
  return (err) => {
    console.log(`\n[RUGO OPEN] You are sending ${signal} signal...`);
    if (err) console.error(err.stack || err);
    console.log(`[RUGO OPEN] Exiting.`);
    process.exit(err ? 1 : 0);
  };
}

process
  .on('SIGTERM', shutdown('SIGTERM'))
  .on('SIGINT', shutdown('SIGINT'))
  .on('uncaughtException', shutdown('uncaughtException'));

startAll();
