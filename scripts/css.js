#!/usr/bin/node env

import process from 'process';
import chokidar from 'chokidar';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import colors from 'colors';
import postcssNested from 'postcss-nested';
import cssnano from 'cssnano';
import tailwindColors  from "tailwindcss/colors.js";
import plugin from "tailwindcss/plugin.js";
import { dirname, resolve, join } from 'path';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { clone } from 'ramda';

// default

const inputPath = resolve('./src/input.css');
const inputContent = readFileSync(inputPath).toString();

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


// runtime
const dir = resolve(process.argv[2]);
const css = resolve(process.argv[3]);

const buildCss = async (dir, css) => {
  if (!css)
    return;

  console.log(colors.yellow.bold(`Build CSS: `) + colors.white(css));

  const config = clone(tailwindConfig);
  config.content.push(join(dir, '**/*.{vue,js,ts,jsx,tsx,html}'));

  let result = await postcss(
    [tailwindcss(config), autoprefixer, postcssNested, cssnano]
  ).process(inputContent, { from: inputPath, to: css });

  mkdirSync(dirname(css), { recursive: true });
  writeFileSync(css, result.css);
}

// watch changes
const watcher = chokidar.watch(dir);
watcher.on('change', async (e) => {
  console.log(colors.cyan.bold(`On change: `) + colors.white(e));

  if (e === css)
    return;

  await buildCss(dir, css);
});

buildCss(dir, css);