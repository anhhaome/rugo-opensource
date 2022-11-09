/* eslint-disable */

import fs from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { createBroker } from '@rugo-vn/service';
import rimraf from 'rimraf';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import colors from 'colors';

chai.use(chaiHttp);

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = 8080;
const ADMIN_USER = { email: 'admin@rugo.vn', password: '123456' };
const NORMAL_USER = { email: 'normal@rugo.vn', password: '54321' };
const DEMO_POST = {
  name: 'Sample',
  slug: 'sample',
  image: '/uploads/sample.png',
  content: 'Hello World'
};
const DEMO_CATEGORY = { name: 'Greeting', slug: 'hi', };

const showPerf = () => {
  console.log(colors.green('Memory Usage: ') + Math.floor(process.memoryUsage().heapUsed / 1024 / 1024 * 10) / 10 + 'MB');
}

describe('Platform test', function () {
  const root = join(__dirname, '.cache');
  let broker, settings;

  const createRequest = () => chai.request(`http://localhost:${PORT}`);

  before(async () => {
    showPerf();

    if (fs.existsSync(root))
      rimraf.sync(root);

    fs.mkdirSync(root);

    process.env.STORAGE = root;
    process.env.PORT = PORT;
    process.env.SECRET = 'thisisasecretstring';
    
    // create platform
    settings = {};
    if (fs.existsSync('rugo.config.js')) { settings = (await import(resolve('rugo.config.js'))).default; }

    broker = createBroker(settings);

    await broker.loadServices();
    await broker.start();

  });

  after(async () => {
    showPerf();

    await broker.close();

    if (fs.existsSync(root))
      rimraf.sync(root);
  });

  it('should run', async () => {
    const res = await createRequest().get('/');

    expect(res).to.has.property('status', 200);
    expect(res).to.has.property('text');
    expect(res.headers).to.has.property('content-type', 'text/html; charset=utf-8');
  });

  let adminUser, adminToken;
  let normalUser, normalToken;
  it('should register and login users', async () => {
    const res = await createRequest()
      .post('/api/register')
      .send(ADMIN_USER);
    expect(res.body.data).to.has.property('email', ADMIN_USER.email);

    const res4 = await createRequest()
      .post('/api/register')
      .send(NORMAL_USER);
    expect(res4.body.data).to.has.property('email', NORMAL_USER.email);

    const res2 = await createRequest()
      .post('/api/login')
      .send(ADMIN_USER);
    expect(res2.body.data).to.be.not.eq(null);

    const res5 = await createRequest()
      .post('/api/login')
      .send(NORMAL_USER);
    expect(res5.body.data).to.be.not.eq(null);

    adminUser = res.body.data;
    adminToken = res2.body.data;
    normalUser = res4.body.data;
    normalToken = res5.body.data;

    // make admin perm
    const res3 = await broker.call('model.update', { 
      id: adminUser._id,
      set: {
        perms: [
          { model: '*', action: '*', id: '*' }
        ]
      },
      name: settings.server.args.authModel,
    });
    expect(res3.data).to.has.property('_id', adminUser._id);
    expect(res3.data.perms).to.has.property('length', 1);
  });

  it('should not permit', async () => {
    const res = await createRequest()
      .post('/api/posts')
      .send(DEMO_POST);

    expect(res).to.has.property('status', 403);
    expect(res.body.errors[0]).to.has.property('title', 'ForbiddenError');

    const res2 = await createRequest()
      .post('/api/posts')
      .send(DEMO_POST)
      .set('Authorization', `Bearer ${normalToken}`);

    expect(res).to.has.property('status', 403);
    expect(res.body.errors[0]).to.has.property('title', 'ForbiddenError');
  });

  let demoPost, demoCate;

  it('should upload a file', async () => {
    const res = await createRequest()
    .post('/api/uploads')
    .field('name', 'sample.png')
    .attach('data', './package.json')
    .set('Authorization', `Bearer ${adminToken}`);

    expect(res.body.data).to.has.property('name', 'sample.png');
  });

  it('should create a category', async () => {
    const res = await createRequest()
      .post('/api/categories')
      .send(DEMO_CATEGORY)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res).to.has.property('status', 200);
    expect(res.body.data).to.has.property('_id');
    
    demoCate = res.body.data;
  });

  it('should create a post', async () => {
    const res = await createRequest()
      .post('/api/posts')
      .send({
        ...DEMO_POST,
        category: demoCate._id,
      })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res).to.has.property('status', 200);
    expect(res.body.data).to.has.property('_id');
    expect(res.body.data).to.has.property('category', demoCate._id);
    
    demoPost = res.body.data;
  });

  it('should search post', async () => {
    const res = await createRequest()
      .get(`/api/posts?search=${DEMO_POST.name}`)
      .set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.has.property('status', 200);
      expect(res.body.data).to.has.property('length', 1);
  });

  it('should view test', async () => {
    const res = await createRequest().get('/blog');
    expect(res).to.has.property('status', 200);
  });
});