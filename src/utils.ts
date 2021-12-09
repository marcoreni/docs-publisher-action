import fs from 'fs';

import semver from 'semver';
import { MetadataFile, metadataFilePath } from './constants';
import { getExecOutput } from '@actions/exec';

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
  return JSON.parse(fs.readFileSync(metadataFilePath, 'utf8')) as MetadataFile;
}

export function writeMetadataFile(contents: MetadataFile) {
  fs.writeFileSync(metadataFilePath, JSON.stringify(contents), 'utf-8');
}
