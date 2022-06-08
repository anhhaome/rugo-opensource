# rugo-opensource

An opensource version of Rugo Platform

## Usage

Copy `.env.sample` with name `.env`. And create a new directory named `storage`.

```bash
npm i
npm run manage -- start
```


## Extends

Generate shemas for env config.

```bash
npm run schema
```

Create a new user.

```bash
npm run createuser
```

Run view in specific directory with watch mode.

```bash
npm run view -- start your/directory/path
```

## Sample Storage

`sample-storage` is a sample directory for saving data in driver. You can copy all or apart of it as a main `storage`.

### Default user

```json
{
  "email": "admin@rugo.vn",
  "password": "123456"
}
```

## License

MIT
