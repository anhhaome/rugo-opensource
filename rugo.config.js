import { join, resolve } from 'path';
import { authSchema } from '@rugo-vn/auth/src/utils.js';
import { indexBy, mergeDeepLeft} from 'ramda';

const USER_SCHEMA = mergeDeepLeft({
  _name: 'users',
  _driver: 'mem',
  _uniques: ['email'],
  _acl: ['create'],
  _icon: 'people',
  type: 'object',
  properties: {
    email: { type: 'string' },
  },
  required: ['email'],
}, authSchema);

const VIEW_SCHEMA = {
  _name: 'views',
  _driver: 'fs',
  _icon: 'folder-open'
};

const UPLOAD_FIELD_SCHEMA = { type: 'file', ref: 'uploads', prefix: '/uploads/', mimes: [ 'image/jpeg', 'image/png' ] };

const SCHEMAS = [
  {
    _name: 'posts',
    _driver: 'mem',
    _uniques: ['name', 'slug'],
    _icon: 'document-text',
    type: 'object',
    properties: {
      name: { type: 'string', maxLength: 60 },
      slug: { type: 'string', maxLength: 60 },
      desc: { type: 'text' },
      category: { type: 'relation', ref: 'categories' },
      image: UPLOAD_FIELD_SCHEMA,
      content: { type: 'rich', image: UPLOAD_FIELD_SCHEMA },
    },
    required: ['name', 'slug'],
  },
  {
    _name: 'categories',
    _driver: 'mem',
    _uniques: ['name', 'slug'],
    _icon: 'file-tray',
    type: 'object',
    properties: {
      name: { type: 'string', maxLength: 60 },
      slug: { type: 'string', maxLength: 60 },
    }
  },
  {
    _name: 'uploads',
    _driver: 'fs',
    _icon: 'images',
  },
  USER_SCHEMA,
  VIEW_SCHEMA,
];

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
    ...indexBy(i => `schema.${i._name}`)(SCHEMAS),
  },
  schemas: SCHEMAS,
  driver: {
    mem: resolve(process.env.STORAGE),
    fs: resolve(process.env.STORAGE),
  },
  server: {
    port: process.env.PORT,
    routes: [
      ...(process.env.NODE_ENV === 'development' ? [
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
      
      { method: 'use', path: '/blog', action: 'view.render' },
    ],
    args: {
      authModel: USER_SCHEMA._name,
      viewModel: VIEW_SCHEMA._name,
      auth: {},
      // routes: ROUTES,
    },
    static: join(process.env.STORAGE, 'public'),
  },
  auth: {
    secret: process.env.SECRET,
  }
}