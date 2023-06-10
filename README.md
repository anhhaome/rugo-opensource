# Rugo Opensource

An opensource version of Rugo Platform.

## Usage

Start from bash:

```bash
rugo /your/project/path
```

Start from code:

```js
import { start, stop } from '@rugo-vn/open';

await start('/your/project/path');
await stop();
```

## Configuration

For **platform level** `.env`.

| Name           | Description               | Example                                      |
| -------------- | ------------------------- | -------------------------------------------- |
| NODE_ENV       | Runtime enviroment        | "development"<br>"production"                |
| SERVER_PORT    | Server's port when listen | 8080                                         |
| AUTH_SECRET    | A secret string for jwt   | "thisisasecret"                              |
| DB_URI         | A mongodb connection uri  | "mongodb://root:secret@localhost:27017/demo" |
| ADMIN_EMAIL    | Admin email               | "admin@rugo.vn"                              |
| ADMIN_PASSWORD | Admin password            | "password"                                   |

For **application level** `rugo.config.js`. In this file, you can use `import.meta.env`.

| Name         | Description                   | Example                    |
| ------------ | ----------------------------- | -------------------------- |
| build        | Build information for live    | {}                         |
| build.src    | Source directory              | "src"                      |
| build.dst    | Destination (build) directory | "dist"                     |
| build.public | Place to serve public assets  | "public"                   |
| build.static | Static directory to build     | "statics"                  |
| build.view   | View directory to build       | "views"                    |
| space        | Space information             | {}                         |
| space.id     | Space's id                    | "648164f1f4c615b0586b2dc4" |
| space.assets | Space's assets                | []                         |

## Docker

If you want a db to test, run:

```bash
docker compose up
```

Now, you can access db with: `mongodb://root:secret@database:27017/demo`

## Default schema

## License

MIT
