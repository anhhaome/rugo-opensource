import { readdirSync, readFileSync } from 'node:fs';
import { join, parse, resolve } from 'node:path';
import { stdout } from 'node:process';
import { clone, find, flatten, propEq } from 'ramda';
import {
  ADMIN_ROLE_NAME,
  KEY_ASSET_NAME,
  ROLE_ASSET_NAME,
  SERVER_SERVICE,
  USER_ASSET_NAME,
} from './constants.js';

export async function loadData(broker, config) {
  // default data dir
  const dataPathRoots = [
    resolve('./data'),
    join(config.build.root, config.build.data),
  ];

  const dataPaths = flatten(
    dataPathRoots.map((dataPath) =>
      readdirSync(dataPath).map((i) => join(dataPath, i))
    )
  );

  const assets = find(propEq('name', SERVER_SERVICE.name))(config.services)
    .settings.space.assets;

  for (const dataPath of dataPaths) {
    const assetName = parse(dataPath).name;
    const asset = find(propEq('name', assetName))(assets);

    if (!asset) continue;

    stdout.write(`Load data for ${assetName}... `);
    const schema = clone(asset);
    delete schema.type;
    const res = await broker.call(
      'db.import',
      { data: JSON.parse(readFileSync(dataPath)) },
      { schema }
    );
    console.log(`${res.inserted}/${res.total}`);
  }

  // super user
  if (config.admin) {
    console.log(`Register super user ${config.admin.email}`);

    const { user } = await broker.call(
      'auth.register',
      { data: config.admin },
      config.opts
    );

    const role = (
      await broker.call(
        'db.find',
        {
          cond: { name: ADMIN_ROLE_NAME },
        },
        { schema: config.opts.roleSchema }
      )
    ).data[0];

    console.log(
      `Grant role (${role.name}) for super user ${config.admin.email}`
    );

    await broker.call(
      'db.update',
      {
        id: user.id,
        data: { set: { 'creds.0.role': role.id } },
      },
      { schema: config.opts.userSchema }
    );
  }
}
