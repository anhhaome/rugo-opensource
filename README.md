# Rugo Opensource

An opensource version of Rugo Platform.

## Overview

When start application with `npm run start` or `npm run dev`, it will load `rugo.config.js` and read some variables from environment.

If some model from `bundle` are missing, it will load a original one from bundle.

## Enviroments

Basic env:

- `PORT` port to mount server. Default: `3000`.
- `STORAGE` directory to store data. Default: `storage`.
- `SECRET` secret string to encrypt. Default: `secretstring`.
- `BUNDLE` selected bundle to run application. Default: `default`.

## Development

**ports**

- `3000` backend when dev
- `8080` admin front end when dev
- `8081` socket backend when dev

## Scripts

- `npm run create-super-user`

## License

MIT.