import { join } from 'path';
import { authSchema } from '@rugo-vn/auth/src/utils.js';
import { mergeDeepLeft} from 'ramda';

const USER_SCHEMA = mergeDeepLeft({
  _name: 'users',
  _driver: 'mem',
  _uniques: ['email'],
  _acl: ['create'],
  type: 'object',
  properties: {
    email: { type: 'string' },
  },
  required: ['email'],
}, authSchema);

const VIEW_SCHEMA = {
  _name: 'views',
  _driver: 'fs',
}

const SCHEMAS = [
  {
    _name: 'posts',
    _driver: 'mem',
    _unique: ['slug'],
    type: 'object',
    properties: {
      name: { type: 'string', maxLength: 60 },
      slug: { type: 'string', maxLength: 60 },
      content: { type: 'string' },
    },
    required: ['name', 'slug'],
  },
  USER_SCHEMA,
  VIEW_SCHEMA,
];

const ROUTES = [
  { method: 'get', path: '/', view: 'index.ejs' },
];

export default {
  _services: [
    'node_modules/@rugo-vn/server/src/index.js',
    'node_modules/@rugo-vn/driver/src/mem/index.js',
    'node_modules/@rugo-vn/driver/src/fs/index.js',
    'node_modules/@rugo-vn/model/src/index.js',
    'node_modules/@rugo-vn/api/src/index.js',
    'node_modules/@rugo-vn/auth/src/index.js',
    'node_modules/@rugo-vn/fx/src/index.js',
    'node_modules/@rugo-vn/view/src/index.js',
  ],
  driver: {
    mem: process.env.STORAGE,
    fs: process.env.STORAGE,
  },
  server: {
    port: process.env.PORT,
    routes: [
      { method: 'post', path: '/api/register', action: 'api.register' },
      { method: 'post', path: '/api/login', action: 'api.login' },

      { method: 'post', path: '/api/:model', action: 'api.create' },
      { method: 'all', path: '/', action: 'view.render' },
    ],
    args: {
      schemas: SCHEMAS,
      authSchema: USER_SCHEMA,
      viewSchema: VIEW_SCHEMA,
      auth: {},
      routes: ROUTES,
    },
    static: join(process.env.STORAGE, 'public'),
  },
  auth: {
    secret: process.env.SECRET,
  }
}