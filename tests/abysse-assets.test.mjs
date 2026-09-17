import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';

test('every external GLB texture and buffer is bundled beside its model', async () => {
  const root = new URL('../assets/abysse/models/', import.meta.url);
  let dependencies = 0;
  for (const name of await readdir(root)) {
    if (!name.endsWith('.glb')) continue;
    const model = new URL(name, root);
    const bytes = await readFile(model);
    assert.equal(bytes.toString('ascii', 0, 4), 'glTF', name);
    const data = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)));
    for (const resource of [...(data.images || []), ...(data.buffers || [])]) {
      if (!resource.uri || resource.uri.startsWith('data:')) continue;
      const dependency = new URL(resource.uri, model);
      assert.equal(dependency.protocol, 'file:', `${name}: dependency must be local`);
      await access(dependency);
      dependencies++;
    }
  }
  assert(dependencies >= 3, 'Watercraft models must retain their palette references');
});
