import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

export const DOCS_FOLDER = 'docs';
export const INDEX_FILE = 'index.html';

export const tempPath = mkdtempSync(tmpdir());
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
