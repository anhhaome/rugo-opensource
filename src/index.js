import { goLive } from '@rugo-vn/live';
import process from 'node:process';
import * as dotenv from 'dotenv';
import { createBroker } from '@rugo-vn/service';
import { loadConfig } from './config.js';

let isDev, watcher, broker;

export async function start(root) {
  dotenv.config();
  isDev = process.env.NODE_ENV === 'development';
  root = root || process.cwd();

  const config = await loadConfig(root);

  // start live
  if (isDev) {
    const live = await goLive({
      root,
      dst: 'data',
    });

    watcher = await live.watch(() => {
      console.log('Something changes, re-build source code.');
    });
  }

  // create broker
  broker = await createBroker(config);
}

export async function stop() {
  await watcher.close();
  await broker.close();
}
