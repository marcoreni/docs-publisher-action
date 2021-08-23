import fs from 'fs';
import path from 'path';
import * as Handlebars from 'handlebars';
import { DOCS_FOLDER, INDEX_FILE, MetadataFile } from './constants';
import homepageTemplate from './homepage.hbs';

Handlebars.registerHelper('prettifyDate', function (timestamp: number) {
  return new Date(timestamp).toLocaleString();
});

export function compileAndPersistHomepage(
  repository: string,
  repositoryUrl: string,
  currentVersion: string,
  metadataFile: MetadataFile,
  workingDir = process.cwd(),
) {
  // 11 - Compile index.html
  const data = {
    projectName: repository,
    repositoryUrl,
    latestVersion: currentVersion,
    docsPathPrefix: DOCS_FOLDER,
    versions: metadataFile.versions,
  };

  const homepageCompiler = Handlebars.compile(homepageTemplate, { noEscape: true });
  const homepage = homepageCompiler(data);

  fs.writeFileSync(path.join(workingDir, INDEX_FILE), homepage, 'utf-8');
}
