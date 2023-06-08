import process from 'node:process';
import chai, { assert, expect } from 'chai';
import chaiHttp from 'chai-http';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { start, stop } from '../src/index.js';
import { resolve } from 'node:path';

const DB_NAME = 'test';
const PROJECT_PATH = resolve('./examples/basic');

chai.use(chaiHttp);

describe('Open test', function () {
  let mongod, address;

  it('should start', async () => {
    mongod = await MongoMemoryServer.create({
      instance: {
        dbName: DB_NAME,
      },
    });

    process.env.NODE_ENV = 'development';
    process.env.DB_URI = `${mongod.getUri()}${DB_NAME}`;

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

  it('should stop', async () => {
    await stop();
    await mongod.stop();
  });
});
