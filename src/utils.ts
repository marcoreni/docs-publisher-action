import fs from 'fs';
import path from 'path';
import * as Handlebars from 'handlebars';
import semver, { sort } from 'semver';
import { DOCS_FOLDER, INDEX_FILE, MetadataFile } from './constants';
import homepageTemplate from './homepage.hbs';

Handlebars.registerHelper('prettifyDate', function (timestamp: number) {
  return new Date(timestamp).toLocaleString();
});

Handlebars.registerHelper('ifeq', function (this: any, a, b, options) {
  if (a === b) {
    return options.fn(this);
  }
  return options.inverse(this);
});

type IndexStrategy = 'timestamp-asc' | 'timestamp-desc' | 'semver-asc' | 'semver-desc' | string;
function sortVersions(
  versions: MetadataFile['versions'],
  strategy: IndexStrategy,
): MetadataFile['versions'];
function sortVersions(versions: undefined, strategy: IndexStrategy): undefined;
function sortVersions(
  versions: MetadataFile['versions'] | undefined,
  strategy: IndexStrategy,
): MetadataFile['versions'] | undefined {
  if (!versions || versions.length === 0) return versions;
  switch (strategy) {
    case 'timestamp-asc':
      return versions.sort((a, b) => a.releaseTimestamp - b.releaseTimestamp);
    case 'timestamp-desc':
      return versions.sort((a, b) => b.releaseTimestamp - a.releaseTimestamp);
    case 'semver-asc':
      return versions.sort((a, b) => semver.compareBuild(a.id, b.id));
    case 'semver-desc':
    default:
      return versions.sort((a, b) => semver.compareBuild(b.id, a.id));
  }
}

export function compileAndPersistHomepage({
  repository,
  repositoryUrl,
  metadataFile,
  workingDir = process.cwd(),
  versionSorting = 'timestamp-desc',
  enablePrereleases = false,
}: {
  repository: string;
  repositoryUrl: string;
  metadataFile: MetadataFile;
  workingDir?: string;
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
    pkg.latestVersion = sortVersions(pkg.versions, 'semver-desc')[0];

    if (pkg.prereleaseVersions) {
      pkg.prereleaseVersions = sortVersions(pkg.prereleaseVersions, versionSorting);
      pkg.latestPrereleaseVersion = sortVersions(pkg.prereleaseVersions, 'semver-desc')[0];
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

  fs.writeFileSync(path.join(workingDir, INDEX_FILE), homepage, 'utf-8');
}
