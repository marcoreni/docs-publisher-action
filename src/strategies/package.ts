import { readFile } from 'fs/promises';
import { MetadataFile } from '../constants';

export async function packageStrategy(metadataFile: MetadataFile): Promise<string> {
  const packageJson = JSON.parse(await readFile('./package.json', 'utf-8')) as {
    name: string;
    version: string;
    location: string;
  };

  return packageJson.version;
}
