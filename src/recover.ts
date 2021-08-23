/**
 * This is just a sample script that creates a metadata.json file
 * based on a list of folders.
 */
import fs from 'fs';
import path from 'path';
import { DOCS_FOLDER, MetadataFile, METADATA_FILE } from './constants';
import { compileAndPersistHomepage } from './utils';

async function run() {
  const folder = process.argv[2];
  const repositoryUrl = process.argv[3];

  const repository = repositoryUrl.substring(repositoryUrl.lastIndexOf('/') + 1);

  if (!folder) {
    console.error('You need to provide a folder');
    process.exit(1);
  }

  const docsFolder = path.join(folder, DOCS_FOLDER);
  if (!fs.existsSync(docsFolder)) {
    console.error('You need to provide a folder that contains a `docs` folder.');
    process.exit(1);
  }

  const folders = fs.readdirSync(docsFolder);
  const data = [];
  for (const folder of folders) {
    const { birthtime } = fs.statSync(path.join(docsFolder, folder, 'index.html'));
    data.push({ id: folder, releaseTimestamp: birthtime.getTime() });
  }
  data.sort((a, b) => b.releaseTimestamp - a.releaseTimestamp);
  const metadata: MetadataFile = {
    actionVersion: 1,
    versions: data,
  };

  const currentVersion = data[0].id;
  fs.writeFileSync(path.join(folder, METADATA_FILE), JSON.stringify(metadata), 'utf-8');

  compileAndPersistHomepage(repository, repositoryUrl, currentVersion, metadata, folder);
}

run();
