import { goLive } from '@rugo-vn/live';
import process from 'node:process';
import * as dotenv from 'dotenv';
import { createBroker } from '@rugo-vn/service';
import { loadConfig } from './config.js';

let isDev, live, broker;

export async function start(root) {
  dotenv.config();
  isDev = process.env.NODE_ENV === 'development';
  root = root || process.cwd();

  const config = await loadConfig(isDev, root);

  // start live
  if (isDev) {
    live = await goLive({
      root,
      dst: 'data',
    });

    await live.watch(() => {
      console.log('Something changes, re-build source code.');
    });
  }

  // create broker
  broker = await createBroker(config);
}

export async function stop() {
  if (live) await live.close();

  await broker.close();
}
