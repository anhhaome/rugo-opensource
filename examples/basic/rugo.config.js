export default {
  space: {
    id: '64815ad1322f0e938395219e',
    assets: [
      { name: 'statics', type: 'static', mount: '/' },
      { name: 'views', type: 'view', mount: '/' },
      {
        name: 'posts',
        type: 'db',
        properties: {
          name: { type: 'String' },
        },
      },
    ],
  },
};
