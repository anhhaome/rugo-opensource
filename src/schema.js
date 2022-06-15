const schemas = [
  {
    __name: 'users',
    __type: 'mem',
    __icon: 'person',

    email: { type: 'text', required: true, maxlength: 60 },
    password: { type: 'password', maxlength: 60 },
    apikey: { type: 'text', maxlength: 60 }
  },
  {
    __name: 'posts',
    __type: 'mem',
    __icon: 'document-text',

    name: { type: 'text', required: true, maxlength: 60 },
    slug: { type: 'text', required: true, maxlength: 60, regex: '^[a-z0-9-_.]+$' },
    desc: { type: 'text', maxlength: 160 },
    image: { type: 'upload', ref: 'resources', root: '/public' },
    category: { type: 'relation', ref: 'categories', str: 'name' },
    content: { type: 'text', editor: 'rich', upload: { ref: 'resources', root: '/public'} },
    status: { type: 'text', choice: ['draft', 'public'], default: 'draft' },
    pin: { type: 'boolean', default: false },
  },
  {
    __name: 'categories',
    __type: 'mem',
    __icon: 'copy',

    name: { type: 'text', required: true, maxlength: 60 },
    slug: { type: 'text', required: true, maxlength: 60, regex: '^[a-z0-9-_.]+$' }
  },
  {
    __name: 'resources',
    __type: 'fs',
    __icon: 'folder-open'
  }
];

console.log(JSON.stringify(schemas));
