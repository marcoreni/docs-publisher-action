import path from 'path';
import fs from 'fs';
import * as Handlebars from 'handlebars';
import semver from 'semver';
import { INDEX_FILE, MetadataFile } from '../constants';
import { sortVersions } from '../utils';
import homepageTemplate from './homepage.hbs';

Handlebars.registerHelper('prettifyDate', function (timestamp: number) {
  return new Date(timestamp).toLocaleString('it-IT');
});

Handlebars.registerHelper('ifeq', function (this: any, a, b, options) {
  if (a === b) {
    return options.fn(this);
  }
  return options.inverse(this);
});

Handlebars.registerHelper('relativepath', function (value: string) {
  if (value.startsWith('/')) {
    return `.${value}`;
  }

  return `./${value}`;
});

export function compileAndPersistHomepage({
  repository,
  repositoryUrl,
  metadataFile,
  persistDir = process.cwd(),
  versionSorting = 'timestamp-desc',
  enablePrereleases = false,
}: {
  repository: string;
  repositoryUrl: string;
  metadataFile: MetadataFile;
  persistDir?: string;
  versionSorting?: string;
  enablePrereleases?: boolean;
}) {
  const packages: Record<
    string,
    {
      versions: MetadataFile['versions'];
      prereleaseVersions?: MetadataFile['versions'];
      latestVersion?: MetadataFile['versions'][0];
      latestPrereleaseVersion?: MetadataFile['versions'][0];
    }
  > = {};

  metadataFile.versions.forEach((v) => {
    const key = v.packageName || 'default';
    packages[key] ??= {
      versions: [],
    };

    if (enablePrereleases && semver.prerelease(v.id)) {
      (packages[key].prereleaseVersions ??= []).push(v);
    } else {
      (packages[key].versions ??= []).push(v);
    }
  });

  Object.entries(packages).forEach(([_, pkg]) => {
    pkg.versions = sortVersions(pkg.versions, versionSorting);
    pkg.latestVersion = sortVersions(pkg.versions, 'timestamp-desc')[0];

    if (pkg.prereleaseVersions) {
      pkg.prereleaseVersions = sortVersions(pkg.prereleaseVersions, versionSorting);
      pkg.latestPrereleaseVersion = sortVersions(pkg.prereleaseVersions, 'timestamp-desc')[0];
    }
  });

  // 11 - Compile index.html
  const data = {
    projectName: repository,
    repositoryUrl,
    packages,
  };

  const homepageCompiler = Handlebars.compile(homepageTemplate, { noEscape: true });
  const homepage = homepageCompiler(data);

  fs.writeFileSync(path.join(persistDir, INDEX_FILE), homepage, 'utf-8');
}
