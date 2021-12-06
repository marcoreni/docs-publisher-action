import fs from 'fs';
import path from 'path';
import * as Handlebars from 'handlebars';
import semver from 'semver';
import { MetadataFile, METADATA_FILE } from './constants';
import { getExecOutput } from '@actions/exec';

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
export function sortVersions(
  versions: MetadataFile['versions'],
  strategy: IndexStrategy,
): MetadataFile['versions'];
export function sortVersions(versions: undefined, strategy: IndexStrategy): undefined;
export function sortVersions(
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

export async function execOutput(cmd: string) {
  const result = await getExecOutput(cmd);
  return result.stdout.trim();
}

export function readMetadataFile(): MetadataFile {
  return JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8')) as MetadataFile;
}

export function writeMetadataFile(contents: MetadataFile) {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(contents), 'utf-8');
}
