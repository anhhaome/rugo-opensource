/* eslint-disable */

import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import rimraf from 'rimraf';
import dotenv from 'dotenv';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import bcrypt from 'bcryptjs';
import { createRunner } from '@rugo-vn/service';

chai.use(chaiHttp);

const __dirname = dirname(fileURLToPath(import.meta.url));

const DEMO_POST = {
  name: 'Demo post',
  slug: 'demo-post',
  content: 'Demo demo',
  pin: true,
  status: 'public'
};
const ADMIN_PHONE = '11111111';
const ADMIN_PASSWORD = '00000000';

describe('Opensource platform test', function(){
  this.timeout(10000);

  const root = join(__dirname, '.cache');
  let runner, adminToken;

  dotenv.config();
  process.env.RUGO_STORAGE = root;

  const address = `http://localhost:${process.env.RUGO_PORT}`

  before(async () => {
    if (fs.existsSync(root))
      rimraf.sync(root);

    fs.mkdirSync(root, { recursive: true });

    runner = createRunner();

    await runner.load();
    await runner.start();

    // create admin user
    const res = await chai.request(address)
      .post('/api/register')
      .send();

    await runner.call('model.create', 
      { doc: {
        phone: ADMIN_PHONE,
        password: bcrypt.hashSync(ADMIN_PASSWORD, 10),
        perms: [{ model: '*', action: '*', id: '*' }]
      }},
      { meta: { schema: JSON.parse(process.env.RUGO_AUTH_SCHEMA)} }
    );

    const res3 = await chai.request(address)
      .post('/api/login')
      .send({
        identity: ADMIN_PHONE,
        password: ADMIN_PASSWORD
      });

    adminToken = res3.body.data;
  });

  after(async () => {
    await runner.stop();

    if (fs.existsSync(root))
      rimraf.sync(root);
  });

  it('should get homepage', async () => {
    const res = await chai.request(address)
      .get('/');

    expect(res).to.has.property('status', 404);
    expect(res).to.has.property('text', 'Not Found');
  });

  describe('Api test', () => {
    it('should be create a post', async () => {
      const res = await await chai.request(address)
        .post('/api/posts')
        .set({ 'authorization': `Bearer ${adminToken}`})
        .send(DEMO_POST);

      expect(res).to.has.property('status', 200);
      expect(res.body).to.has.property('status', 'success');
      for (let key in DEMO_POST){
        expect(res.body.data).to.has.property(key, DEMO_POST[key]);
      }
    });

    it('should be not create a post', async () => {
      const res = await chai.request(address)
        .post('/api/posts')
        .set({ 'authorization': `Bearer ${adminToken}`})
        .send({
          ...DEMO_POST,
          slug: 'Not SLug'
        });

      expect(res).to.has.property('status', 400);
      expect(res.body).to.has.property('status', 'error');
    });
  });
});