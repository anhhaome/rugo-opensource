import process from 'process';
import chokidar from 'chokidar';
import WebSocket, { WebSocketServer } from 'ws';
import { path } from "ramda";
import { ForbiddenError } from "@rugo-vn/auth/src/exceptions.js";
import { readFileSync } from 'fs';

export const name = 'open';

export const actions = {
  async info(args){
    const user = await this.call('auth.gate', {
      token: path(['headers', 'authorization'], args),
      model: args.authModel,
    });

    if (!user)
      throw new ForbiddenError('You must signed in to use this feature.');

    const { data: { perms }} = await this.call('model.get', {
      id: user._id,
      name: args.authModel,
    });

    const permModels = perms.map(p => p.model);
    const isSuperPerm = permModels.indexOf('*') !== -1;

    const { schemas } = this.settings;
    const selectedSchemas = [];

    for (let schema of schemas){
      if (!isSuperPerm && permModels.indexOf(schema._name) === -1)
        continue;

      selectedSchemas.push(schema);
    }

    return {
      data: { schemas: selectedSchemas }
    };
  },

  async live() {
    return {
      data: readFileSync('src/live.js').toString()
    };
  }
}

export const started = async function(){
  if (process.env.NODE_ENV === 'development') {
    const watcher = chokidar.watch(process.env.STORAGE || './storage');

    const wss = new WebSocketServer({ port: 8081 });

    watcher.on('change', () => {
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send('changed');
        }
      });
    });
  }
}