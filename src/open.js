import temp from 'temp';
import rimraf from 'rimraf';
import { basename, dirname, join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { exec, FileCursor } from '@rugo-vn/service';

export const name = 'open';

export const actions = {
  async restore({ file }) {
    const tmpDir = temp.path({ prefix: 'rugo-' });
    mkdirSync(tmpDir, { recursive: true });

    await exec(
      `cp "${file.toPath()}" "${tmpDir}" && cd "${tmpDir}" && unzip "${basename(
        file.toPath()
      )}"`
    );

    const nextSpace = JSON.parse(readFileSync(join(tmpDir, 'space.json')));
    for (const schema of nextSpace.schemas || []) {
      const tableName = schema.name;
      const bsonPath = join(tmpDir, 'tables', `${tableName}.bson`);
      if (!existsSync(bsonPath)) continue;
      await this.call(`db.restore`, {
        spaceId: 'storage',
        tableName,
        from: new FileCursor(bsonPath),
      });
    }

    for (const driveName in nextSpace.drives || {}) {
      const drivePath = join(tmpDir, 'drives', driveName);
      const out = join(this.settings.storage, 'storage', driveName);
      rimraf.sync(out);
      mkdirSync(dirname(out), { recursive: true });
      await exec(`cp -r "${drivePath}" "${out}"`);
    }

    writeFileSync(
      join(this.settings.storage, 'space.json'),
      JSON.stringify(nextSpace, 0, 2)
    );

    this.logger.info(`Restored from "${file}"`);
  },
};

export const started = async function () {};
