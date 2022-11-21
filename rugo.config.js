import { join, resolve } from 'path';
import { indexBy} from 'ramda';
import process from 'process';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { exec } from '@rugo-vn/service';
import rimraf from 'rimraf';
import { restore } from '@rugo-vn/driver/src/mongo/actions.js';

const isInit = !!process.env.INIT;
const isDev = process.env.NODE_ENV ===  'development';
const port = process.env.PORT || 3000;
const storage = process.env.STORAGE || './storage';
const mongo = process.env.MONGO || null;
const secret = process.env.SECRET || 'secretstring';
const bundle = process.env.BUNDLE || 'default';

const app = JSON.parse(readFileSync(join('bundles', bundle, 'app.json')));

// admin
const statics = [];
const redirects = [];
const adminRoot = join('packages', 'admin', 'dist', 'admin');
if (existsSync(adminRoot)) {
  redirects.push({ path: '/admin', to: '/admin/' });
  statics.push({ use: '/admin/', root: adminRoot });
}

// schema preparation
const refs = {};
const views = [];

let schemas = []

for (let schema of app.schemas) {
  if (schema.$id){ 
    refs[schema.$id] = schema;
    delete refs[schema.$id].$id;
    continue;
  }

  schemas.push(schema);

  if (schema._static) {
    statics.push({ use: schema._static, root: join(storage, schema._name) });
  }

  if (schema._view)  {
    views.push({ use: schema._view, model: schema._name });
  }
}

const replaceRef = o => {
  if (Array.isArray(o))
    return o.map(i => replaceRef(i));

  if (!o)
    return o;

  if (typeof o === 'object') {
    if (o.$ref)
      return refs[o.$ref];
    
    const nextO = {};
    for (let key in o) {
      nextO[key] = replaceRef(o[key]);
    }
    return nextO;
  }

  return o;
}

schemas = schemas.map(replaceRef);

// storage
if (isInit) {
  rimraf.sync(storage);
  mkdirSync(storage);
  mkdirSync('.tmp', { recursive: true });

  for (let schema of schemas){
    if (schema._driver === 'mem' || schema._driver === 'fs') {
      let modelPath = join(storage, schema._name);
      let originPath = join('bundles', bundle, schema._name);

      if (!existsSync(modelPath) && existsSync(originPath)) {
        await exec(`cp -rL "${originPath}" "${modelPath}"`);
      }
      continue;
    }

    if (schema._driver === 'mongo') {
      let originPath = join('bundles', bundle, schema._name);
      await restore.bind({
        mongoUri: mongo,
      })({ register: { name: schema._name }, file: originPath})
    }
  }

  rimraf.sync('.tmp');
}

if (schemas.filter(schema => schema._name === app.authModel || schema._name === 'users').length === 0) {
  schemas.push({
    "_name": "users",
    "_driver": "mem",
    "_uniques": [ "email" ],
    "_acl": [ "create" ],
    "_icon": "people",
    "type": "object",
    "properties": {
      "email": { "type": "string" },
      "password": { "type": "string" },
      "apikey": { "type": "string" },
      "perms": {
        "type": "array",
        "items": { "type": "object" }
      }
    },
    "required": [ "email" ]
  });
}

// css
if (app.css) {
  for (let c of app.css) {
    c.input = join('bundles', bundle, c.input);
    c.output = join(storage, c.output.replace(/^models/, ''));

    for (let i = 0; i < c.content.length; i++){
      c.content[i] = join(storage, c.content[i].replace(/^models/, ''));
    }
  }
}

export default {
  _services: [
    'src/index.js',
    ...(storage ? [
      'node_modules/@rugo-vn/driver/src/mem/index.js',
      'node_modules/@rugo-vn/driver/src/fs/index.js',
    ]: []),
    ...(mongo ? ['node_modules/@rugo-vn/driver/src/mongo/index.js'] : []),
    'node_modules/@rugo-vn/model/src/index.js',
    'node_modules/@rugo-vn/auth/src/index.js',
    'node_modules/@rugo-vn/api/src/index.js',
    'node_modules/@rugo-vn/fx/src/index.js',
    'node_modules/@rugo-vn/view/src/index.js',
    'node_modules/@rugo-vn/server/src/index.js',
  ],
  _globals: {
    ...indexBy(i => `schema.${i._name}`)(schemas),
  },
  schemas,
  driver: {
    ...(storage ? {
      mem: resolve(storage),
      fs: resolve(storage),
    } : {}),
    ...(mongo ? { mongo } : {}),
  },
  server: {
    port,
    routes: [
      ...(isDev ? [
        { method: 'get', path: '/live.js', action: 'open.live' },
      ] : []),

      { method: 'get', path: '/api/info', action: 'open.info' },

      { method: 'post', path: '/api/register', action: 'api.register' },
      { method: 'post', path: '/api/login', action: 'api.login' },

      { method: 'post', path: '/api/:model', action: 'api.create' },
      { method: 'get', path: '/api/:model', action: 'api.find' },
      { method: 'get', path: '/api/:model/:id', action: 'api.get' },
      { method: 'patch', path: '/api/:model/:id', action: 'api.update' },
      { method: 'delete', path: '/api/:model/:id', action: 'api.remove' },

      { method: 'all', path: '/apix/:action/:model', action: 'api.x' },
      { method: 'all', path: '/apix/:action/:model/:id', action: 'api.x' },
      
      { method: 'use', path: '/', action: 'view.render' },
    ],
    args: {
      views,
      authModel: app.authModel || 'users',
      auth: {},
    },
    statics,
    redirects,
  },
  auth: {
    secret: secret,
  },
  open: {
    css: app.css,
  }
}