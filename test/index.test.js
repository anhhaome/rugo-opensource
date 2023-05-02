import process from 'node:process';
import chai, { assert, expect } from 'chai';
import chaiHttp from 'chai-http';
import { SERVER_PORT } from '../src/constants.js';
import { start, stop } from '../src/index.js';

chai.use(chaiHttp);

describe('Open test', function () {
  const address = `http://localhost:${SERVER_PORT}`;

  process.env.NODE_ENV = 'development';

  it('should start', async () => {
    await start('./test/fixtures');
  });

  it('should request static', async () => {
    const res = await chai.request(address).get(`/robots.txt`);
    expect(res.text.split('\n')[0]).to.be.eq('User-agent: Googlebot');
  });

  it('should request view', async () => {
    const res = await chai.request(address).get(`/blog.html`);
    expect(res.text.split('\n')[0]).to.be.eq('Hello template.');
  });

  it('should request param view', async () => {
    const res = await chai.request(address).get(`/posts/demo.html`);
    expect(res.text.split('\n')[0]).to.be.eq('demo');
  });

  it('should stop', async () => {
    await stop();
  });
});
