import fs from 'fs';
import { resolve } from 'path';

import chai from 'chai';
import chaiHttp from 'chai-http';
import terminalKit from 'terminal-kit';
import dotenv from 'dotenv';
import { createBroker } from '@rugo-vn/service';

chai.use(chaiHttp);

const term = terminalKit.terminal;
const PORT = 8080;
const createRequest = () => chai.request(`http://localhost:${PORT}`);

(async () => {
  term('Email: ');
  const email = await term.inputField().promise;

  term('\nPassword: ');
  const password = await term.inputField({ echoChar: true }).promise;

  term('\nRe-type password: ');
  const repassword = await term.inputField({ echoChar: true }).promise;

  if (password !== repassword) {
    console.error('\nPassword does not match');
    return process.exit();
  }

  term('\nConfirm? [Y|n]');
  const confirm = await term.yesOrNo({ yes: ['y', 'ENTER'], no: ['n'] }).promise;

  if (!confirm) {
    console.log('\nExit');
    return process.exit();
  }

  try {
    console.log('\nRun platform');

    dotenv.config();
    process.env.PORT = PORT;

    let settings = {};
    if (fs.existsSync('rugo.config.js')) { settings = (await import(resolve('rugo.config.js'))).default; }

    const broker = createBroker(settings);

    await broker.loadServices();
    await broker.start();

    const res = await createRequest()
      .post('/api/register')
      .send({
        email,
        password,
      });

    const adminUser = res.body.data;

    await broker.call('model.update', { 
      id: adminUser._id,
      set: {
        perms: [
          { model: '*', action: '*', id: '*' }
        ]
      },
      name: settings.server.args.authModel,
    });

    await broker.close();

    console.log(adminUser);
  } catch (err) {
    console.error(err);
    return process.exit();
  }

  console.log('\nDone!');
  process.exit();
})();
