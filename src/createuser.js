import chai from 'chai';
import chaiHttp from 'chai-http';
import terminalKit from 'terminal-kit';
import dotenv from 'dotenv';
import createRunner from 'rugo-manage';

const term = terminalKit.terminal;

chai.use(chaiHttp);

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

    const platform = await createRunner();
    const { server } = platform.context;
    server.context.disableAuthGate = true;

    console.log('Make request');
    const res = await chai.request(server.address())
      .post('/api/users')
      .send({
        email,
        password
      });

    console.log(res.body);
  } catch (err) {
    console.error(err);
    return process.exit();
  }

  console.log('\nDone!');
  process.exit();
})();
