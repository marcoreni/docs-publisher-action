import * as core from '@actions/core';
import * as github from '@actions/github';
import { cp } from '@actions/io';
import { exec, getExecOutput } from '@actions/exec';
import * as Handlebars from 'handlebars';
import { tmpdir } from 'os';
import * as fs from 'fs';
import * as path from 'path';

import homepageTemplate from './homepage.hbs';

Handlebars.registerHelper('prettifyDate', function (timestamp: number) {
  return new Date(timestamp).toISOString();
});

const DOCS_FOLDER = 'docs';
const METADATA_FILE = 'metadata.json';

type MetadataFile = {
  actionVersion: number;
  versions: Array<{
    id: string;
    releaseTimestamp: number;
  }>;
};

async function shellExecLog(cmd: string) {
  try {
    const resultCode = await exec(cmd);
    core.info(`CMD: ${cmd} (code: ${resultCode})`);
    return resultCode;
  } catch (e) {
    core.error(`CMD: ${cmd} - error: ${e.message}`);
    throw e;
  }
}
async function shellExecLogWithOutput(cmd: string) {
  try {
    const result = await getExecOutput(cmd);
    core.info(`CMD: ${cmd} (code: ${result.exitCode})`);
    return result;
  } catch (e) {
    core.error(`CMD: ${cmd} - error: ${e.message}`);
    throw e;
  }
}

async function execOutput(cmd: string) {
  const result = await shellExecLogWithOutput(cmd);
  return result.stdout.trim();
}

async function getVersion(versionStrategy: string): Promise<string> {
  if (versionStrategy === 'tag') {
    return execOutput('git describe --tags');
  }
  throw new Error(`Unsupported versionStrategy ${versionStrategy}`);
}

/**
 * NOTE: the following function is inspired by https://github.com/facebook/docusaurus/blob/main/packages/docusaurus/src/commands/deploy.ts
 */
async function run() {
  try {
    // Inputs
    const githubToken = core.getInput('token');
    const command = core.getInput('docs-command');
    const docsRelativePath = core.getInput('docs-path');
    const currentCommit = process.env.GITHUB_SHA;
    const currentBranch = await execOutput(`git branch --show-current`);
    const deploymentBranch = core.getInput('deployment-branch');
    const version = await getVersion(core.getInput('version-strategy'));

    const repository = github.context.repo.repo;
    const repositoryUrl = `https://github.com/${github.context.repo.owner}/${repository}.git`;

    if (currentBranch === deploymentBranch) {
      throw new Error('Sorry, you cannot deploy documentation in the active workflow branch');
    }

    // 1- Run the command to create the documentation
    try {
      await shellExecLog(command);
    } catch (error) {
      throw new Error(`Documentation creation failed with error: ${error.message}`);
    }

    const currentPath = process.cwd();
    const docsPath = path.join(currentPath, docsRelativePath);

    // 2- Create a temporary dir
    const tempPath = await fs.mkdtempSync(path.join(tmpdir(), `${repository}-${deploymentBranch}`));

    if ((await shellExecLog(`git clone ${repositoryUrl} ${tempPath}`)) !== 0) {
      throw new Error(`Running "git clone" command in "${tempPath}" failed.`);
    }

    // 3- Enter the temporary dir
    process.chdir(tempPath);

    // 4- Switch to the deployment branch
    if ((await shellExecLog(`git switch ${deploymentBranch}`)) !== 0) {
      // If the switch fails, we will create a new orphan branch
      if ((await shellExecLog(`git switch --orphan ${deploymentBranch}`)) !== 0) {
        throw new Error(`Unable to switch to the "${deploymentBranch}" branch.`);
      } else {
        // Initialize stuff
        fs.mkdirSync(DOCS_FOLDER);

        const emptyMetadata: MetadataFile = {
          actionVersion: 1,
          versions: [],
        };

        fs.writeFileSync(METADATA_FILE, JSON.stringify(emptyMetadata));
      }
    }

    // Check if this branch is managed by this action.
    if (!fs.existsSync(METADATA_FILE)) {
      throw new Error(
        `The branch ${deploymentBranch} exists, but it doesn't seem to have been initialized by this action. This action only works with a dedicated branch`,
      );
    }

    const metadataFile = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8')) as MetadataFile;
    if (!metadataFile.actionVersion) {
      throw new Error(
        `The branch ${deploymentBranch} exists, but it doesn't seem to have been initialized by this action. This action only works with a dedicated branch`,
      );
    }

    // 6- Create a new version based on the version variable.
    const versionedDocsPath = path.join(DOCS_FOLDER, version);
    fs.mkdirSync(path.join(DOCS_FOLDER, version));

    // 7- Copy the files to the new version
    await cp(docsPath, versionedDocsPath, { recursive: true });

    // 8- Create the new version inside versions.json
    metadataFile.versions.unshift({
      id: version,
      releaseTimestamp: new Date().getTime(),
    });

    // 9- TBD: cleanup old versions?

    // 10- Write back the metadata file
    fs.writeFileSync(METADATA_FILE, JSON.stringify(metadataFile), 'utf-8');

    // 11 - Compile index.html
    const data = {
      projectName: repository,
      repositoryUrl,
      latestVersion: version,
      versions: metadataFile.versions,
    };

    const homepageCompiler = Handlebars.compile(homepageTemplate, { noEscape: true });
    const homepage = homepageCompiler(data);

    fs.writeFileSync('index.html', homepage, 'utf-8');

    // 12- Commit && push

    await shellExecLog('git add -A');
    const commitMessage = `Deploy docs - based on ${currentCommit}`;
    await shellExecLog(`git commit -m ${commitMessage}`);

    await shellExecLog(`git push --set-upstream origin ${deploymentBranch}`);
  } catch (err) {
    core.setFailed(err.message);
  }
}

run();
