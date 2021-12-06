export const DOCS_FOLDER = 'docs';
export const METADATA_FILE = 'metadata.json';
export const INDEX_FILE = 'index.html';

export type MetadataFile = {
  actionVersion: number;
  versions: Array<{
    id: string;
    releaseTimestamp: number;
    packageName?: string;
  }>;
};
