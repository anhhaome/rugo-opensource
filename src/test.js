import axios from 'axios';
import { stdout } from 'node:process';
import { find, propEq } from 'ramda';
import { DELAY, SERVER_SERVICE } from './constants.js';

export async function test(config) {
  const serverService = find(propEq('name', SERVER_SERVICE.name))(
    config.services
  );

  while (true) {
    stdout.write(
      `Check availability for port ${serverService.settings.port}... `
    );
    try {
      await axios.get(`http://localhost:${serverService.settings.port}`);
      console.log('no');
    } catch (err) {
      if (err.code === 'ECONNREFUSED') {
        console.log('yes');
        break;
      }
      console.log('no');
    }

    await new Promise((resolve) => setTimeout(resolve, DELAY));
  }
}
