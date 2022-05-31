const schemas = [
  {
    __name: 'users',
    __type: 'mem',
    __icon: 'person',
    __str: 'email',

    email: { type: 'text', required: true, maxlength: 100 },
    password: { type: 'password', maxlength: 100 },
    apikey: { type: 'text', maxlength: 100 }
  },
  {
    __name: 'posts',
    __type: 'mem',
    __icon: 'document-text',
    __str: 'name',

    name: { type: 'text', required: true, maxlength: 100 },
    slug: { type: 'text', required: true, maxlength: 100, regex: '^[a-z0-9-_.]+$' },
    content: { type: 'text', editor: 'wysiwyg' }
  },
  {
    __name: 'resources',
    __type: 'fs',
    __icon: 'folder-open',
    __str: 'name'
  }
];

console.log(JSON.stringify(schemas));
