export default {
  space: {
    id: '64815ad1322f0e938395219e',
    assets: [
      { name: 'statics', kind: 'static', mount: '/' },
      { name: 'views', kind: 'view', mount: '/' },
      {
        name: 'posts',
        kind: 'db',
        properties: {
          name: { type: 'String' },
        },
      },
    ],
  },
};
