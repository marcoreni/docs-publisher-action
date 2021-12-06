import { MetadataFile } from '../constants';
import { execOutput, readMetadataFile } from '../utils';

export async function lernaStrategy(): Promise<
  {
    name: string;
    version: string;
    location: string;
  }[]
> {
  const data = JSON.parse(await execOutput('lerna list --json')) as {
    name: string;
    version: string;
    location: string;
  }[];

  let metadataFile: MetadataFile;
  try {
    metadataFile = readMetadataFile();
  } catch (e) {
    return data;
  }
  if (typeof metadataFile === 'undefined') {
    return data;
  }

  // Remove already published packages docs
  const unpublishedDocs = data.filter(
    (d) => !metadataFile.versions.find((v) => v.packageName === d.name && v.id.includes(d.version)),
  );
  return unpublishedDocs;
}
