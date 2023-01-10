import { resolve } from 'path';
import { SPACE_ID } from './src/constants.js';

const port = process.env.PORT || 3000;
const mongo = process.env.MONGO || 'mongodb://root:secret@localhost:27017/demo';
const storage = resolve(process.env.STORAGE || '.storage');
const secret = process.env.SECRET || 'secretstring';
const admin = process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD ? 
  { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD } : null;

const createGateHandler = action => {
  return {
    name: 'auth.gate',
    input: {
      token: '_.headers.authorization',
      perms: '_.space.perms',
      ...(action ? {
        'auth.tableName': '_.params.tableName',
        'auth.driveName': '_.params.driveName',
        'auth.action': action,
        'auth.id': '_.params.id'
      } : {}),
    },
    output: { user: '_' }
  }
}

export default {
  _services: [
    'node_modules/@rugo-vn/auth/src/index.js',
    'node_modules/@rugo-vn/db/src/index.js',
    'node_modules/@rugo-vn/storage/src/index.js',
    'node_modules/@rugo-vn/fx/src/index.js',
    'node_modules/@rugo-vn/server/src/index.js',
    './src/index.js',
  ],
  auth: {
    secret,
    spaceId: SPACE_ID,
    tableName: 'users',
  },
  db: mongo,
  storage,
  open: {
    admin,
  },
  server: {
    port,
    space: 'open.get',
    routes: [
      /* all spaces */
      { method: 'post', path: '/api/register', handler: 'auth.register', input: { data: '_.form' }, output: { body: '_' } },
      { method: 'post', path: '/api/login', handler: 'auth.login', input: { data: '_.form' }, output: { 'body.token': '_' } },

      /* specific space */
      {
        method: 'get',
        path: '/api/info',
        handlers: [
          createGateHandler(),
          { name: 'pro.info', input: { user: '_.user', space: '_.space', token: '_.headers.authorization' }, output: { body: '_' } },
        ],
      },

      /* db handlers */
      {
        method: 'post',
        path: '/api/tables/:tableName',
        handlers: [
          createGateHandler('create'),
          { name: 'db.create', input: { spaceId: '_.space.id', tableName: '_.params.tableName', data: '_.form' }, output: { body: '_' } },
        ],
      },

      {
        method: 'get',
        path: '/api/tables/:tableName',
        handlers: [
          createGateHandler('find'),
          {
            name: 'db.find',
            input: {
              spaceId: '_.space.id',
              tableName: '_.params.tableName',
              filters: '_.query.filters',
              limit: '_.query.limit',
              sort: '_.query.sort',
              skip: '_.query.skip',
              page: '_.query.page'
            },
            output: { body: '_' }
          },
        ],
      },

      {
        method: 'get',
        path: '/api/tables/:tableName/:rowId',
        handlers: [
          createGateHandler('get'),
          {
            name: 'db.get',
            input: {
              spaceId: '_.space.id',
              tableName: '_.params.tableName',
              id: '_.params.rowId',
            },
            output: { body: '_' }
          },
        ],
      },

      {
        method: 'patch',
        path: '/api/tables/:tableName/:rowId',
        handlers: [
          createGateHandler('update'),
          {
            name: 'db.update',
            input: {
              spaceId: '_.space.id',
              tableName: '_.params.tableName',
              id: '_.params.rowId',
              set: '_.form.set',
              unset: '_.form.unset',
              inc: '_.form.inc',
            },
            output: { body: '_' }
          },
        ],
      },

      {
        method: 'delete',
        path: '/api/tables/:tableName/:rowId',
        handlers: [
          createGateHandler('remove'),
          {
            name: 'db.remove',
            input: {
              spaceId: '_.space.id',
              tableName: '_.params.tableName',
              id: '_.params.rowId',
            },
            output: { body: '_' }
          },
        ],
      },

      /* drive handlers */
      {
        method: 'get',
        path: '/api/drives/:driveName',
        handlers: [
          createGateHandler('list'),
          {
            name: 'storage.list',
            input: {
              spaceId: '_.space.id',
              driveName: '_.params.driveName',
              path: '_.query.path',
            },
            output: { body: '_' },
          },
        ]
      },

      {
        method: 'post',
        path: '/api/drives/:driveName',
        handlers: [
          createGateHandler('create'),
          {
            name: 'storage.create',
            input: {
              spaceId: '_.space.id',
              driveName: '_.params.driveName',
              path: '_.form.path',
              isDir: '_.form.isDir',
              data: '_.form.file',
            },
            output: { body: '_' },
          },
        ],
      },
    ],
  },
};
