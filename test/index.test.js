import process from 'node:process';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { start, stop } from '../src/index.js';
import { resolve } from 'node:path';

const DB_NAME = 'test';
const PROJECT_PATH = resolve('./examples/basic');
const ADMIN = {
  email: 'admin@rugo.vn',
  password: 'password',
};

chai.use(chaiHttp);

describe('Open test', function () {
  this.timeout(10000);
  let address;
  let superToken;

  it('should start', async () => {
    process.env.NODE_ENV = 'development';
    process.env.AUTH_SECRET = 'thisisasecret';
    process.env.ADMIN_EMAIL = ADMIN.email;
    process.env.ADMIN_PASSWORD = ADMIN.password;

    const config = await start(PROJECT_PATH);
    address = `http://localhost:${
      config.services.filter((i) => i.name === 'server')[0].settings.port
    }`;
  });

  it('should request static', async () => {
    const res = await chai.request(address).get(`/robots.txt`);
    expect(res.text.split('\n')[0]).to.be.eq('User-agent: Googlebot');
  });

  it('should request view', async () => {
    const res = await chai.request(address).get(`/blog.html`);
    expect(res.text.split('\n')[0]).to.be.eq('Hello template.');
  });

  it('should login super account', async () => {
    const res = await chai.request(address).post(`/api/v1/login`).send(ADMIN);
    expect(res.body).to.has.property('token');
    expect(res).to.has.property('status', 200);
    superToken = res.body.token;
  });

  it('should get posts', async () => {
    const res = await chai
      .request(address)
      .get(`/api/v1/posts`)
      .set('Authorization', `Bearer ${superToken}`);
    expect(res.body.meta).to.has.property('total', 1);
    expect(res).to.has.property('status', 200);
  });

  let id;
  it('should create post', async () => {
    const res = await chai
      .request(address)
      .post(`/api/v1/posts`)
      .set('Authorization', `Bearer ${superToken}`)
      .send({
        name: 'sample',
      });

    expect(res.body).to.has.property('name', 'sample');
    expect(res.body).to.has.property('version', 0);
    expect(res).to.has.property('status', 200);

    id = res.body.id;
  });

  it('should replace post', async () => {
    const res = await chai
      .request(address)
      .put(`/api/v1/posts/${id}`)
      .set('Authorization', `Bearer ${superToken}`)
      .send({
        name: 'sample 2',
      });

    expect(res.body).to.has.property('name', 'sample 2');
    expect(res.body).to.has.property('version', 0);
    expect(res).to.has.property('status', 200);
  });

  it('should update post', async () => {
    const res = await chai
      .request(address)
      .patch(`/api/v1/posts/${id}`)
      .set('Authorization', `Bearer ${superToken}`)
      .send({
        set: {
          name: 'sample 3',
        },
      });

    expect(res.body).to.has.property('name', 'sample 3');
    expect(res.body).to.has.property('version', 1);
    expect(res).to.has.property('status', 200);
  });

  it('should delete post', async () => {
    const res = await chai
      .request(address)
      .delete(`/api/v1/posts/${id}`)
      .set('Authorization', `Bearer ${superToken}`);

    expect(res.body).to.has.property('name', 'sample 3');
    expect(res.body).to.has.property('version', 1);
    expect(res).to.has.property('status', 200);

    const res2 = await chai
      .request(address)
      .get(`/api/v1/posts/${id}`)
      .set('Authorization', `Bearer ${superToken}`);
    expect(res2.body.meta).to.has.property('total', 0);
    expect(res2).to.has.property('status', 200);
  });

  it('should stop', async () => {
    await stop();
  });
});
