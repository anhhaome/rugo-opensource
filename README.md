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

If you not provide `/your/project/path`, it will use current directory (`cwd`).

## Pre Requisite

- `docker`

## Getting Started

Rugo Open is working as a external library to run your entire project directory. In your project directory should have structure:

```
$
|- init
  |- your.bundle.zip
|- .gitignore
|- package.json
```

Create your own `package.json` file in your project directory and add more information:

```json
{
  "type": "module",
  "scripts": {
    "mongo": "rugo --prepare && cd .rugo && sudo docker compose up",
    "dev": "rugo",
    "restore": "rugo --restore"
  },
  "devDependencies": {
    "@rugo-vn/open": "@latest"
  }
}
```

Your `.gitignore`:

```txt
.rugo
node_modules
init
package-lock.json
```

Open two terminal consoles and run in each terminal:

```bash
npm run mongo
```

```bash
npm run restore /path/to/your/bundle.zip
npm run dev
```

## License

MIT.
