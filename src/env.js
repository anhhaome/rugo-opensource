import { snakeCase } from "snake-case";

const userSchema = {
  name: 'users',
  driver: 'mem',
  type: 'object',
  properties: {
    email: { type: 'string' },
    phone: { type: 'string' },
    username: { type: 'string' },
    password: { type: 'string' },
    perms: { type: 'array', items: { type: 'object' }}
  },
  identities: ['email', 'phone', 'username'],
  timestamp: true,
  version: true
};

const env = {
  port: 3000,
  secret: 'thisisasecret',
  storage: './storage',

  services: [
    'node_modules/@rugo-vn/api/src/index.js',
    'node_modules/@rugo-vn/auth/src/index.js',
    'node_modules/@rugo-vn/driver/src/mem.js',
    // 'node_modules/@rugo-vn/driver/src/mongo.js',
    'node_modules/@rugo-vn/model/src/index.js',
    'node_modules/@rugo-vn/server/src/index.js',
  ],

  schemas: [
    userSchema,
    {
      name: 'posts',
      driver: 'mem',
      type: 'object',
      properties: {
        name: { type: 'string', maxLength: 60 },
        slug: { type: 'string', maxLength: 60, pattern: '^[a-z0-9-_.]+$' },
        desc: { type: 'string', maxLength: 160 },
        image: { type: 'string' },
        category: { type: 'string' },
        content: { type: 'string' },
        status: { type: 'string', enum: ['draft', 'public'], default: 'draft' },
        pin: { type: 'boolean', default: false },
      },
      required: ['name', 'slug']
    },
  ],

  authSchema: userSchema,

  routes: [
    { method: 'post', path: '/api/login', address: 'auth.login' },

    { method: 'get', path: '/api/:model', address: 'api.find' },
    { method: 'get', path: '/api/:model/:id', address: 'api.get' },
    { method: 'post', path: '/api/:model', address: 'api.create' },
    { method: 'patch', path: '/api/:model/:id', address: 'api.patch' },
    { method: 'delete', path: '/api/:model/:id', address: 'api.remove' }
  ]
}

const PREFIX = 'RUGO_';
let content = '';

const tryJSON = value => {
  if (value && typeof value === 'object'){
    value = JSON.stringify(value);
  }

  return value;
}

for (let key in env){
  let value = env[key];

  if (Array.isArray(value)){
    for (let i = 0; i < value.length; i++)
      content += `${PREFIX}${snakeCase(key).toUpperCase()}_${i}=${tryJSON(value[i])}\n`;

    continue;
  }

  content += `${PREFIX}${snakeCase(key).toUpperCase()}=${tryJSON(value)}\n`;
}

process.stdout.write(content);