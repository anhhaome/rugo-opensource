import process from 'node:process';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { goLive } from '@rugo-vn/live';
import { createBroker } from '@rugo-vn/service';
import { loadConfig } from './config.js';
import { loadData } from './data.js';
import { DB_SERVICE, TEST_DB_NAME } from './constants.js';
import { find, propEq } from 'ramda';
import { test } from './test.js';

let live, broker, mongod;

export async function start(appRoot = process.cwd()) {
  const config = await loadConfig(appRoot);

  // test config
  await test(config);

  // start live
  if (config.isDev) {
    live = await goLive(config.build);

    await live.watch(() => {
      console.log('Something changes, re-build source code.');
    });
  }

  // db
  const dbService = find(propEq('name', DB_SERVICE.name))(config.services);

  if (config.isDev && !dbService.settings.uri) {
    console.log('DB_URI is not defined, using MongoMemoryServer instead');
    mongod = await MongoMemoryServer.create({
      instance: {
        dbName: TEST_DB_NAME,
      },
    });

    dbService.settings.uri = `${mongod.getUri()}${TEST_DB_NAME}`;
  }

  // create broker
  broker = await createBroker(config);

  // load data
  await loadData(broker, config);

  return config;
}

export async function stop() {
  if (live) await live.close();
  if (broker) await broker.close();
  if (mongod) await mongod.stop();
}
