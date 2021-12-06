import fs from 'fs';
import path from 'path';
import * as Handlebars from 'handlebars';
import semver from 'semver';
import { DOCS_FOLDER, INDEX_FILE, MetadataFile } from './constants';
import homepageTemplate from './homepage.hbs';

Handlebars.registerHelper('prettifyDate', function (timestamp: number) {
  return new Date(timestamp).toLocaleString();
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
  versionStrategy,
}: {
  repository: string;
  repositoryUrl: string;
  metadataFile: MetadataFile;
  workingDir?: string;
  versionSorting?: string;
  enablePrereleases?: boolean;
  versionStrategy: string;
}) {
  let versions: Record<string, MetadataFile['versions']> = {};
  let prereleaseVersions: Record<string, MetadataFile['versions']> | undefined;
  if (versionStrategy === 'tag') {
    if (enablePrereleases) {
      // Let's try and split the release and prerelease versions, then find latest for each, then sort them.
      versions = {
        default: metadataFile.versions.filter((v) => !semver.prerelease(v.id)),
      };
      prereleaseVersions = {
        default: metadataFile.versions.filter((v) => semver.prerelease(v.id)),
      };
    } else {
      // All in one
      versions = { default: metadataFile.versions };
    }
  } else if (versionStrategy === 'monorepo-tag') {
    metadataFile.versions.forEach((v) => {
      if (v.packageName) {
        (versions[v.packageName] ??= []).push(v);
      } else {
        (versions.default ??= []).push(v);
      }
    });
  }

  // Sorting
  versions = Object.fromEntries(
    Object.entries(versions).map(([k, v]) => [k, sortVersions(v, versionSorting)]),
  );
  prereleaseVersions = prereleaseVersions
    ? Object.fromEntries(
        Object.entries(prereleaseVersions).map(([k, v]) => [k, sortVersions(v, versionSorting)]),
      )
    : undefined;

  // 11 - Compile index.html
  const data = {
    projectName: repository,
    repositoryUrl,
    versions,
    prereleaseVersions,
    docsPathPrefix: DOCS_FOLDER,
  };

  const homepageCompiler = Handlebars.compile(homepageTemplate, { noEscape: true });
  const homepage = homepageCompiler(data);

  fs.writeFileSync(path.join(workingDir, INDEX_FILE), homepage, 'utf-8');
}
