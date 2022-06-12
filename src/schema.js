const schemas = [
  {
    __name: 'users',
    __type: 'mem',
    __icon: 'person',

    email: { type: 'text', required: true, maxlength: 100 },
    password: { type: 'password', maxlength: 100 },
    apikey: { type: 'text', maxlength: 100 }
  },
  {
    __name: 'posts',
    __type: 'mem',
    __icon: 'document-text',

    name: { type: 'text', required: true, maxlength: 100 },
    slug: { type: 'text', required: true, maxlength: 100, regex: '^[a-z0-9-_.]+$' },
    image: { type: 'upload', ref: 'resources', root: '/public' },
    category: { type: 'relation', ref: 'categories', str: 'name' },
    pin: { type: 'boolean' },
    content: { type: 'text', editor: 'rich', upload: { ref: 'resources', root: '/public'} }
  },
  {
    __name: 'categories',
    __type: 'mem',
    __icon: 'copy',

    name: { type: 'text', required: true, maxlength: 100 },
    slug: { type: 'text', required: true, maxlength: 100, regex: '^[a-z0-9-_.]+$' }
  },
  {
    __name: 'resources',
    __type: 'fs',
    __icon: 'folder-open'
  }
];

console.log(JSON.stringify(schemas));
