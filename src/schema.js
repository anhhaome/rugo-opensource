const schemas = [
  {
    __name: 'users',
    __type: 'mem',
    email: { type: 'text', required: true, maxlength: 100 },
    password: { type: 'password', maxlength: 100 },
    apikey: { type: 'text', maxlength: 100 }
  },
  {
    __name: 'posts',
    __type: 'mem',
    name: { type: 'text', required: true, maxlength: 100 },
    slug: { type: 'text', required: true, maxlength: 100, regex: '^[a-z0-9-_.]+$' },
    content: { type: 'text', editor: 'wysiwyg' }
  }
];

console.log(JSON.stringify(schemas));
