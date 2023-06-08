import process from 'node:process';
import { goLive } from '@rugo-vn/live';
import { createBroker } from '@rugo-vn/service';
import { loadConfig } from './config.js';

let live, broker;

export async function start(appRoot = process.cwd()) {
  const config = await loadConfig(appRoot);

  // start live
  if (config.isDev) {
    live = await goLive(config.build);

    await live.watch(() => {
      console.log('Something changes, re-build source code.');
    });
  }

  // create broker
  broker = await createBroker(config);

  return config;
}

export async function stop() {
  if (live) await live.close();
  if (broker) await broker.close();
}
