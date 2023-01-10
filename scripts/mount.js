#!/usr/bin/node env

import process from 'process';
import temp from 'temp';
import rimraf from 'rimraf';
import { createBroker, exec, FileCursor } from '@rugo-vn/service';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';

import { SPACE_ID } from '../src/constants.js';
import config from '../rugo.config.js';
import { PASSWORD_SALT } from '@rugo-vn/auth/src/utils.js';

const spaceBundlePath = process.argv[2] ? resolve(process.argv[2]) : null;
const { storage } = config;

rimraf.sync(storage);
mkdirSync(storage);

if (existsSync(spaceBundlePath)) {
  const tmpDir = temp.path({ prefix: 'rugo-' });
  mkdirSync(tmpDir, { recursive: true });

  await exec(`cd "${tmpDir}" && unzip "${spaceBundlePath}"`);

  const nextSpace = JSON.parse(readFileSync(join(tmpDir, 'space.json')));
  
  if (!nextSpace.schemas?.users) {
    nextSpace.schemas ||= {};
    nextSpace.schemas.users = {
      uniques: ['email'],
      required: ['email'],
      properties: {
        email: 'string',
        password: 'string',
        apikey: 'string',
        perms: {
          items: 'json'
        },
      },
    };
  }

  nextSpace.id = SPACE_ID;

  // write default space
  writeFileSync(
    join(storage, 'space.js'), `export default ${JSON.stringify(nextSpace, 0, 2)};\n`
    .replace(/"(.+?)"\s*\:/gm, '$1:')
  );

  // start platform
  const settings = (await import(resolve('rugo.config.js'))).default;
  const broker = createBroker(settings);

  await broker.loadServices();
  await broker.start();

  // restore tables
  for (const tableName in nextSpace.schemas || {}) {
    const bsonPath = join(tmpDir, 'tables', `${tableName}.bson`);
    if (!existsSync(bsonPath))
      continue;
    await broker.call(`db.restore`, { spaceId: nextSpace.id, tableName, from: new FileCursor(bsonPath) });
  }

  // restore drives
  for (const driveName in nextSpace.drives || {}) {
    const drivePath = join(tmpDir, 'drives', driveName);
    const out = join(storage, nextSpace.id, driveName);
    rimraf.sync(out);
    mkdirSync(dirname(out), { recursive: true });
    await exec(`cp -r "${drivePath}" "${out}"`);
  }

  // close platform
  await broker.close();
}

