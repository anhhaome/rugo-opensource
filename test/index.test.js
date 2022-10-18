/* eslint-disable */

import fs from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { createBroker, exec } from '@rugo-vn/service';
import rimraf from 'rimraf';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';

chai.use(chaiHttp);

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = 8080;
const ADMIN_USER = { email: 'admin@rugo.vn', password: '123456' };
const NORMAL_USER = { email: 'normal@rugo.vn', password: '54321' };
const DEMO_POST = { name: 'Sample', slug: 'sample', content: 'Hello World' };

describe('Pro test', function () {
  const root = join(__dirname, '.cache');
  let broker, settings;

  const createRequest = () => chai.request(`http://localhost:${PORT}`);

  before(async () => {
    if (fs.existsSync(root))
      rimraf.sync(root);

    await exec(`cp -rL "${join(__dirname, '../sample-storage')}" "${root}"`);

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
      }, schema: settings.server.args.authSchema
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

  let demoPost;
  it('should create a post', async () => {
    const res = await createRequest()
      .post('/api/posts')
      .send(DEMO_POST)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res).to.has.property('status', 200);
    expect(res.body.data).to.has.property('_id');
    
    demoPost = res.body.data;
  });

  // it('should view test', async () => {
  //   const res = await createRequest().get('/view');
  //   expect(res).to.has.property('status', 200);
  // });
});