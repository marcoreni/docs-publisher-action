import { readFile } from 'fs/promises';
import { MetadataFile } from '../constants';
import { execOutput, readMetadataFile } from '../utils';

export async function packageStrategy(metadataFile: MetadataFile): Promise<string> {
  const packageJson = JSON.parse(await readFile('./package.json', 'utf-8')) as {
    name: string;
    version: string;
    location: string;
  };
}
