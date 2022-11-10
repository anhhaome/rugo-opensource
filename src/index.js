import process from 'process';
import chokidar from 'chokidar';
import WebSocket, { WebSocketServer } from 'ws';
import { clone, mergeDeepLeft, path } from "ramda";
import { ForbiddenError } from "@rugo-vn/auth/src/exceptions.js";
import { readFileSync, writeFileSync } from 'fs';

import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import colors from 'colors';
import postcssNested from 'postcss-nested';
import cssnano from 'cssnano';
import tailwindColors  from "tailwindcss/colors.js";
import plugin from "tailwindcss/plugin.js";

// delete unsupported colors
delete tailwindColors.lightBlue;
delete tailwindColors.warmGray;
delete tailwindColors.coolGray;
delete tailwindColors.blueGray;
delete tailwindColors.trueGray;

const tailwindConfig = {
  darkMode: "class",
  content: [],
  theme: {
    colors: {
      primary: tailwindColors.cyan,
      secondary: tailwindColors.stone,
      danger: tailwindColors.rose,
      info: tailwindColors.indigo,
      warn: tailwindColors.amber,
      success: tailwindColors.emerald,
      ...tailwindColors,
    },
    fontFamily: {
    },
    extend: {},
    fontSize: {
      xs: ".75rem",
      sm: ".825rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem",
      "6xl": "4rem",
      "7xl": "5rem",
    },
  },
  plugins: [
    plugin(function ({ addVariant }) {
      addVariant("mactive", "&[active]");
      addVariant("group-mactive", ":merge(.group)[active] &");
    })
  ]
};

export const name = 'open';

export const actions = {
  async info(args){
    const user = await this.call('auth.gate', {
      token: path(['headers', 'authorization'], args),
      model: args.authModel,
    });

    if (!user)
      throw new ForbiddenError('You must signed in to use this feature.');

    const { data: { perms }} = await this.call('model.get', {
      id: user._id,
      name: args.authModel,
    });

    const permModels = perms.map(p => p.model);
    const isSuperPerm = permModels.indexOf('*') !== -1;

    const { schemas } = this.settings;
    const selectedSchemas = [];

    for (let schema of schemas){
      if (!isSuperPerm && permModels.indexOf(schema._name) === -1)
        continue;

      selectedSchemas.push(schema);
    }

    return {
      data: { schemas: selectedSchemas }
    };
  },

  async live() {
    return {
      data: readFileSync('src/live.js').toString()
    };
  }
}

export const started = async function(){
  if (process.env.NODE_ENV === 'development') {
    const watches = [
      process.env.STORAGE || './storage',
    ];
    const ignores = [];

    // postcss
    const css = path(['settings', 'open', 'css'], this);
    if (css) {
      for (let c of css) {
        watches.push(c.input);
        ignores.push(c.output);
      }
    }

    const buildCss = async (p) => {
      if (!css || ignores.indexOf(p) !== -1)
        return;
      
      for (let c of css) {
        let config = clone(tailwindConfig);
        let newC = clone(c);

        delete newC.input;
        delete newC.output;

        config = mergeDeepLeft(newC, config);

        let inputContent = readFileSync(c.input);
        let result = await postcss(
          [tailwindcss(config), autoprefixer, postcssNested, cssnano]
        ).process(inputContent, { from: c.input, to: c.output });

        writeFileSync(c.output, result.css);
      }
    }

    // watch local change
    const wss = new WebSocketServer({ port: 8081 });

    for (let p of watches) {
      let watcher = chokidar.watch(p);

      watcher.on('change', async (e) => {
        this.logger.info(`On change: ` + colors.white(e));

        await buildCss(e);

        wss.clients.forEach(function each(client) {
          if (client.readyState === WebSocket.OPEN) {
            client.send('changed');
          }
        });
      });
    }

    buildCss();
  }
}