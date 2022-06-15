const colors = require("tailwindcss/colors");
const plugin = require("tailwindcss/plugin");

module.exports = {
  input: './input.css',
  output: './public/assets/css/output.min.css',

  content: [
    './public/**/*.{html,ejs}',
    './views/**/*.{html,ejs}'
  ],

  theme: {
    extend: {
      backgroundImage: {
        particle: "url('/assets/images/particle.png')"
      }
    },
    colors: {
      primary: colors.rose,
      secondary: colors.stone,
      danger: colors.rose,
      info: colors.indigo,
      warn: colors.amber,
      success: colors.emerald,
      ...colors,
    },
    fontFamily: {
      sans: ["Quicksand", "sans-serif"]
    }
  },

  plugins: [
    require('@tailwindcss/typography'),
    plugin(function ({ addBase, addVariant, theme }) {
      addVariant("mactive", "&[active]");
      addVariant("second", "&:nth-child(2)");
      addVariant("group-mactive", ":merge(.group)[active] &");
    }),
  ],
};
