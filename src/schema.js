const schemas = {
  RUGO_AUTH_SCHEMA: { 
    name: 'users', 
    driver: 'mem',
    type: 'object',
    properties: {
      email: { type: 'string' },
      username: { type: 'string' },
      phone: { type: 'string' },
      password: { type: 'string' },
      perms: { type: 'array', items: { type: 'object' } },
    },
    identities: ['email','username', 'phone']
  },

  RUGO_SCHEMAS_0: {
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
  }
}

for (let key in schemas){
  console.log(`${key}=${JSON.stringify(schemas[key])}`);
}