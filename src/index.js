import bcrypt from 'bcryptjs';
import process from 'process';
import chokidar from 'chokidar';
import colors from 'colors';
import WebSocket, { WebSocketServer } from 'ws';
import { join } from 'path';
import { path } from "ramda";
import { PASSWORD_SALT } from '@rugo-vn/auth/src/utils.js';

export const name = 'open';

export const actions = {
  async get() {
    return this.space;
  },
};

export const started = async function() {
  const isLive = !!process.env.LIVE;

  const storage = path(['settings', 'storage'], this);
  const space = (await import(join(storage, 'space.js'))).default;

  const watches = [
    storage,
  ];

  this.space = space;

  // load space
  for (const tableName in space.schemas || {}) {
    const schema = space.schemas[tableName];

    await this.call('db.setSchema', {
      spaceId: space.id,
      tableName,
      schema,
    });
  }

  for (const driveName in space.drives || {}) {
    const config = space.drives[driveName];

    await this.call('storage.setConfig', {
      spaceId: space.id,
      driveName,
      config,
    });
  }

  // create admin user by default
  const no = await this.call(`db.count`, { ...this.settings.auth });
  if (!no && this.settings.open.admin) {
    this.logger.info(`Create an account for admin`);
    await this.call(`db.create`, { ...this.settings.auth, data: {
      email: this.settings.open.admin.email,
      password: bcrypt.hashSync(this.settings.open.admin.password, PASSWORD_SALT),
      perms: [
        { tableName: '*', driveName: '*', action: '*', id: '*' }
      ],
    }});
  }

  // mount routes
  space.routes ||= [];

  for (const [driveName, config] of Object.entries(space.drives || {})) {
    if (!config.mount)
      continue;

    space.routes.push({
      method: 'get',
      path: join(config.mount, '(.*)?'),
      handler: 'serve',
      input: {
        from: join(storage, space.id, driveName),
        path: '_.params.0',
      },
      output: {
        headers: '_.headers',
        body: '_.body',
      },
    });
  }

  // live server
  if (isLive) {
    let isChanged = false;
    let lastChanged = 0;

    const handleChanges = () => {
      if (!isChanged)
        return;

      const current = new Date();
      if (current - lastChanged < 500)
        return;

      this.logger.info(colors.yellow.bold(`Reload clients`));
      isChanged = false;
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send('changed');
        }
      });
    }
    
    const wss = new WebSocketServer({ port: 8081 });

    for (let p of watches) {
      let watcher = chokidar.watch(p);

      watcher.on('change', async (e) => {
        this.logger.info(`On change: ` + colors.white(e));
        isChanged = true;
        lastChanged = new Date();
        setTimeout(handleChanges, 1000);
      });
    }
  }
}
