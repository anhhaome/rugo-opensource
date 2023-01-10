# Rugo Opensource

An opensource version of Rugo Platform.

## Environment Variables

- `PORT`
- `MONGO`
- `SECRET`
- `STORAGE`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

## Usage

Install packages:

```bash
npm i
npm run rugo:test
npm run rugo:coverage
```

Mount space:

```bash
npm run rugo:mount <your_space_bundle_path>
```

Run platform:

```bash
npm run rugo:dev
npm run rugo:start
```

Test URI

```bash
curl -X POST http://localhost:3000/api/login -H "Content-Type: application/json" -d '{"email":"admin@rugo.vn","password":"password"}'
```

Generate TailwindCSS

```bash
npm run css <watch_dir> <css_output_path>
```

## License

MIT.
