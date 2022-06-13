/* eslint-disable */

import fs from 'fs';
import { cp } from 'node:fs/promises'
import createRunner from 'rugo-manage';
import dotenv from 'dotenv';
import rimraf from 'rimraf';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';

const DEMO_USER = {
  email: 'demo@rugo.vn',
  password: '123123'
};

const DEMO_POST = {
  name: 'Demo post',
  slug: 'demo-post',
  content: 'Demo demo',
  pin: true,
  status: 'public'
};

chai.use(chaiHttp);

const fileContent = filePath => {
  return fs.readFileSync(filePath).toString();
}

describe('Platform test', function () {
  this.timeout(20000);

  const root = './test/.cache';
  let platform;
  let token;

  const createRequest = () => chai.request(platform.context.server.address());
  const retrieveToken = async () => {
    if (!token){
      const res = await createRequest()
        .post('/api/login')
        .send(DEMO_USER);

      token = res.body.data;
    }

    return token;
  }

  before(async () => {
    // prepare storage
    if (fs.existsSync(root)) { rimraf.sync(root); }

    fs.mkdirSync(root, { recursive: true });

    await cp('./sample-storage/resources', './test/.cache/resources', { recursive: true });

    // env config
    dotenv.config({ path: '.env.sample' });
    process.env.DRIVER_ROOT = root;
    process.env.STATIC_ROOT = './test/.cache/resources/public';
    process.env.VIEW_ROOT = './test/.cache/resources/views';

    // start
    platform = await createRunner();
  });

  after(async () => {
    if (fs.existsSync(root)) { rimraf.sync(root); }

    await platform.close();
  });

  describe('Common test', () => {
    it('should run', async () => {
      const res = await createRequest().get('/');
      expect(res).to.has.property('status', 200);
      expect(res).to.has.property('text', fileContent('./sample-storage/resources/public/index.html'));
  
      const plugins = Object.keys(platform.context);
      expect(plugins).to.have.all.members(['drivers', 'model', 'auth', 'schemas', 'server'])
    });
  
    it('should create a new user', async () => {
      const { server } = platform.context;
      server.context.disableAuthGate = true;
  
      const res = await chai.request(server.address())
        .post('/api/users')
        .send(DEMO_USER);
  
      server.context.disableAuthGate = false;
  
      expect(res).to.has.property('status', 200);
      expect(res.body).to.has.property('status', 'success');
      expect(res.body).to.has.property('data');
      expect(res.body.data).to.has.property('email', DEMO_USER.email);
    });
  });

  describe('Api test', () => {
    it('should be sign in', async () => {
      const token = await retrieveToken();

      expect(token).to.be.not.eq(null);
    });

    it('should be not get info', async () => {
      const res = await createRequest().get('/api/info');

      expect(res).to.has.property('status', 403);
      expect(res.body).to.has.property('status', 'error');
      expect(res.body).to.has.property('data', 'Access denied');
    });

    it('should be get info', async () => {
      const token = await retrieveToken();
      const res = await createRequest()
        .get('/api/info')
        .set({ "Authorization": `Bearer ${token}` });

      expect(res).to.has.property('status', 200);
      expect(res.body).to.has.property('status', 'success');
      expect(res.body.data.map(schema => schema.__name)).to.have.all.members([ 'posts', 'users', 'categories', 'resources' ]);
    });

    it('should be create a post', async () => {
      const token = await retrieveToken();
      const res = await createRequest()
        .post('/api/posts')
        .set({ "Authorization": `Bearer ${token}` })
        .send(DEMO_POST);

      expect(res).to.has.property('status', 200);
      expect(res.body).to.has.property('status', 'success');
      for (let key in DEMO_POST){
        expect(res.body.data).to.has.property(key, DEMO_POST[key]);
      }
    });

    it('should be not create a post', async () => {
      const token = await retrieveToken();
      const res = await createRequest()
        .post('/api/posts')
        .set({ "Authorization": `Bearer ${token}` })
        .send({
          ...DEMO_POST,
          slug: 'Not SLug'
        });

      expect(res).to.has.property('status', 400);
      expect(res.body).to.has.property('status', 'error');
      expect(res.body).to.has.property('data', 'At the slug field: Wrong data. Not SLug is not match regex.');
    });
  });
});
