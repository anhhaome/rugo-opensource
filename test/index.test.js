import fs from 'fs';
import createRunner from 'rugo-manage';
import dotenv from 'dotenv';
import rimraf from 'rimraf';

describe('Platform test', function () {
  this.timeout(20000);

  const root = './test/.cache';
  let platform;

  before(async () => {
    // prepare storage
    if (fs.existsSync(root)) { rimraf.sync(root); }

    fs.mkdirSync(root, { recursive: true });

    // env config
    dotenv.config({ path: '.env.sample' });
    process.env.DRIVER_ROOT = root;

    // start
    platform = await createRunner();
  });

  after(async () => {
    if (fs.existsSync(root)) { rimraf.sync(root); }

    await platform.close();
  });

  it('should run', async () => {

  });
});
