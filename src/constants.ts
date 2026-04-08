import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

export const DOCS_FOLDER = 'docs';
export const INDEX_FILE = 'index.html';

export const tempPath = mkdtempSync(path.join(tmpdir(), 'docs-publisher'));
export const metadataFilePath = `${path.join(tempPath, 'metadata.json')}`;

export type MetadataFile = {
  actionVersion: number;
  versions: Array<{
    id: string;
    releaseTimestamp: number;
    packageName?: string;
    path: string;
  }>;
};
