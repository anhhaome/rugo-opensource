import { join, resolve } from 'path';
import { indexBy} from 'ramda';
import process from 'process';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { exec } from '@rugo-vn/service';

const isDev = process.env.NODE_ENV ===  'development';
const port = process.env.PORT || 3000;
const storage = process.env.STORAGE || './storage';
const secret = process.env.SECRET || 'secretstring';
const bundle = process.env.BUNDLE || 'default';

const app = JSON.parse(readFileSync(join('bundles', bundle, 'app.json')));

// admin
const statics = [];
const redirects = [];
const adminRoot = join('packages', 'admin', 'dist');
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
if (!existsSync(storage))
  mkdirSync(storage);

for (let schema of schemas){
  if (schema._driver === 'mem' || schema._driver === 'fs') {
    let modelPath = join(storage, schema._name);
    let originPath = join('bundles', bundle, 'models', schema._name);
    if (!existsSync(modelPath) && existsSync(originPath)) {
      await exec(`cp -rL "${originPath}" "${modelPath}"`);
    }
    continue;
  }
}

export default {
  _services: [
    'node_modules/@rugo-vn/driver/src/mem/index.js',
    'node_modules/@rugo-vn/driver/src/fs/index.js',
    'node_modules/@rugo-vn/model/src/index.js',
    'node_modules/@rugo-vn/auth/src/index.js',
    'node_modules/@rugo-vn/api/src/index.js',
    'node_modules/@rugo-vn/fx/src/index.js',
    'node_modules/@rugo-vn/view/src/index.js',
    'node_modules/@rugo-vn/server/src/index.js',
    'src/index.js',
  ],
  _globals: {
    ...indexBy(i => `schema.${i._name}`)(schemas),
  },
  schemas,
  driver: {
    mem: resolve(storage),
    fs: resolve(storage),
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
      
      { method: 'use', path: '/', action: 'view.render' },
    ],
    args: {
      views,
      authModel: app.authModel,
      auth: {},
    },
    statics,
    redirects,
  },
  auth: {
    secret: secret,
  }
}