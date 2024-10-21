import * as core from '@actions/core';
import * as github from '@actions/github';
import { cp } from '@actions/io';
import { exec, ExecOptions } from '@actions/exec';

import * as fs from 'fs';
import * as path from 'path';

import { DOCS_FOLDER, MetadataFile, metadataFilePath, tempPath as gitTempPath } from './constants';
import { compileAndPersistHomepage } from './templating';
import { execOutput, readMetadataFile, writeMetadataFile } from './utils';
import { lernaStrategy } from './strategies/lerna';
import { packageStrategy } from './strategies/package';

const METADATA_VERSION_LATEST = 2;

const execGitInTempPath = (command: string, args?: string[], options?: ExecOptions) =>
  exec(`git ${command}`, args, { ...options, cwd: gitTempPath });

/**
 * NOTE: the following function is inspired by https://github.com/facebook/docusaurus/blob/main/packages/docusaurus/src/commands/deploy.ts
 */
async function run() {
  try {
    // Inputs
    const currentCommit = process.env.GITHUB_SHA;
    const currentBranch = await execOutput(`git branch --show-current`);
    const deploymentBranch = core.getInput('deployment-branch');
    const strategy = core.getInput('strategy');
    const versionSorting = core.getInput('versions-sorting');
    const enablePrereleases = core.getInput('enable-prereleases').toLowerCase() === 'true';

    const command = core.getInput('docs-command');
    const docsRelativePath = core.getInput('docs-path');

    core.debug(`Inputs:
      - command: ${command},
      - docs-path: ${docsRelativePath},
      - deployment-branch: ${deploymentBranch},
      - version-sorting: ${versionSorting},
      - enable-prereleases: ${enablePrereleases},
    `);

    const repository = github.context.repo.repo;
    const repositoryUrl = `https://github.com/${github.context.repo.owner}/${repository}`;

    const gitUsername = 'x-access-token';
    const gitPassword = core.getInput('token');
    const gitRepositoryUrl = `https://${gitUsername}:${gitPassword}@github.com/${github.context.repo.owner}/${repository}.git`;

    if (currentBranch === deploymentBranch) {
      throw new Error('Sorry, you cannot deploy documentation in the active workflow branch');
    }

    const workingDir = process.cwd();

    // 2- Create a temporary dir and clone the repo there
    await execGitInTempPath(`clone ${gitRepositoryUrl} .`);

    /**
     * Base folder on the "orphan branch" where docs will be put
     */
    const gitDocsBasePath = path.join(gitTempPath, DOCS_FOLDER);

    // 3- Switch to the deployment branch
    if (
      (await execGitInTempPath(`switch ${deploymentBranch}`, undefined, {
        ignoreReturnCode: true,
      })) !== 0
    ) {
      // If the switch fails, we will create a new orphan branch
      await execGitInTempPath(`switch --orphan ${deploymentBranch}`);

      // Then we initialize stuff
      fs.mkdirSync(gitDocsBasePath);

      const emptyMetadata: MetadataFile = {
        actionVersion: METADATA_VERSION_LATEST,
        versions: [],
      };
      writeMetadataFile(emptyMetadata);
    }

    // Check if this branch is managed by this action.
    if (!fs.existsSync(metadataFilePath)) {
      throw new Error(
        `The branch ${deploymentBranch} exists, but it doesn't seem to have been initialized by this action. This action only works with a dedicated branch`,
      );
    }

    const metadataFile = readMetadataFile();
    if (!metadataFile.actionVersion) {
      throw new Error(
        `The branch ${deploymentBranch} exists, but it doesn't seem to have been initialized by this action. This action only works with a dedicated branch`,
      );
    }

    // Metadata cleanup
    if (metadataFile.actionVersion < 2) {
      // Add path data to existing metadata
      metadataFile.actionVersion = 2;
      metadataFile.versions = metadataFile.versions.map((v) => ({
        ...v,
        path: path.join(DOCS_FOLDER, v.id),
      }));
    }

    // 4- Run the command to create the documentation
    try {
      await exec(command);
    } catch (error: any) {
      throw new Error(`Documentation creation failed with error: ${error.message}`);
    }

    const doWork = async (docsPath: string, version: string, packageName?: string) => {
      const gitDocsAbsolutePath = path.join(gitDocsBasePath, packageName ?? '', version);
      // 6- Create a new version based on the version variable.
      fs.mkdirSync(gitDocsAbsolutePath, {
        recursive: true,
      });

      // 7- Copy the files to the new version
      core.info(`Copying docs from ${docsPath} to ${gitDocsAbsolutePath}`);
      await cp(docsPath, gitDocsAbsolutePath, {
        recursive: true,
        copySourceDirectory: false,
      });

      // 8- Create the new version inside versions.json
      metadataFile.versions.unshift({
        id: version,
        releaseTimestamp: new Date().getTime(),
        path: gitDocsAbsolutePath.replace(gitTempPath, ''),
        packageName: packageName,
      });
    };

    if (strategy === 'tag') {
      const version = await execOutput('git fetch --tags && git describe --tags');
      /**
       * Folder on the repo where the built docs are located
       */
      const docsPath = path.join(workingDir, docsRelativePath);

      await doWork(docsPath, version);
    } else if (strategy === 'package') {
      const version = await packageStrategy(metadataFile);
      /**
       * Folder on the repo where the built docs are located
       */
      const docsPath = path.join(workingDir, docsRelativePath);

      await doWork(docsPath, version);
    } else if (strategy === 'lerna') {
      // Decide which packages must be published
      const packages = await lernaStrategy(metadataFile);

      for (const p of packages) {
        core.info(`Working on ${p.name} - ${p.location}`);

        /**
         * Folder where the built docs for this package are located
         */
        const docsPath = path.join(p.location, docsRelativePath);

        await doWork(docsPath, p.version, p.name);
      }
    }

    // 9- TBD: cleanup old versions?

    // 10- Write back the metadata file
    writeMetadataFile(metadataFile);

    compileAndPersistHomepage({
      repository,
      repositoryUrl,
      metadataFile,
      versionSorting,
      enablePrereleases,
      persistDir: gitTempPath,
    });

    // 12- Commit && push
    await execGitInTempPath(`config --local user.name "gh-actions"`);
    await execGitInTempPath(`config --local user.email "gh-actions@github.com"`);

    await execGitInTempPath(`add -A`);
    const commitMessage = `Deploy docs - based on ${currentCommit}`;
    await execGitInTempPath(`commit -m "${commitMessage}"`);

    await execGitInTempPath(`push --set-upstream origin ${deploymentBranch}`);
  } catch (err: any) {
    core.setFailed(err.message);
  }
}

run();
