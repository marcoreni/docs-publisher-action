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
  const versionSorting = process.argv[4];
  const enablePrereleases = Boolean(process.argv[5]);

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
  const metadataFilePath = path.join(folder, METADATA_FILE);
  let metadata: MetadataFile;

  // Create versions.file
  if (!fs.existsSync(metadataFilePath)) {
    const data = [];
    for (const folder of folders) {
      const p = path.join(docsFolder, folder, 'index.html');
      const { birthtime } = fs.statSync(path.join(p, 'index.html'));
      data.push({
        id: folder,
        releaseTimestamp: birthtime.getTime(),
        path: p,
      });
    }
    data.sort((a, b) => b.releaseTimestamp - a.releaseTimestamp);
    metadata = {
      actionVersion: 2,
      versions: data,
    };

    fs.writeFileSync(metadataFilePath, JSON.stringify(metadata), 'utf-8');
  } else {
    metadata = JSON.parse(fs.readFileSync(metadataFilePath, 'utf8')) as MetadataFile;
  }

  // Recompile hp
  compileAndPersistHomepage({
    repository,
    repositoryUrl,
    metadataFile: metadata,
    workingDir: folder,
    versionSorting,
    enablePrereleases,
    strategy: 'tag',
  });
}

run();
