<!-- omit in toc -->
# Docs publisher action

- [Inputs](#inputs)
  - [`deployment-branch`](#deployment-branch)
  - [`docs-command`](#docs-command)
  - [`docs-path`](#docs-path)
  - [`strategy`](#strategy)
  - [`versions-sorting`](#versions-sorting)
  - [`enable-prereleases`](#enable-prereleases)
- [Example usage](#example-usage)
- [Development](#development)
  - [Release a new version](#release-a-new-version)
- [Recover function](#recover-function)
- [TODO](#todo)

This action creates a documentation site with versioning on a specific branch.  
The target branch can then be used with Github Pages.

In order to use this action, you should have:

1. A command that creates the documentation in a specific, non changing path
2. (Optional) a CHANGELOG.md file

At the moment, this action can only be used with git tags, so your workflow should have:

```yaml
on:
  push:
    tags: 
    - 'v*'
```

## Inputs

### `deployment-branch`

The branch where you want to publish the documentation site. This is the branch
that will be used to host the GitHub Pages.  
NOTE: This branch will be used solely for this action. You cannot use an already existing branch, and
it's better to avoid messing with the branch.  
**Defaults to**: `gh-pages`

### `docs-command`

**Required** The command to be run inside the repository to create the docs. You may provide the following placeholders:  

- `{packageName}`: will work if you are using `lerna` strategy, it will be the package name without the version.
- `{packageNameWithoutScope}`: will work if you are using `lerna` strategy, it will be the package name without the version and the scope
  If the package has no scope, it will be the same as the package name.

### `docs-path`

**Required** The path where documentation will be found once docs are created. Path is relative to the root of the project

- `{packageName}`: will work if you are using `lerna` strategy, it will be the package name without the version.
- `{packageNameWithoutScope}`: will work if you are using `lerna` strategy, it will be the package name without the version and the scope
  If the package has no scope, it will be the same as the package name.

### `strategy`

The strategy to use to fetch the version. Currently, `tag` and `monorepo-tag` are supported.

**Defaults to**: `tag`

### `versions-sorting`

The strategy to use to sort the versions in the list. Possible values:

- `semver-desc`: sorts by semver descending.
- `semver-asc`: sorts by semver ascending.
- `timestamp-desc`: sorts by release timestamp (based on the run that generated a specific build) descending.
- `timestamp-asc`: sorts by release timestamp (based on the run that generated a specific build) ascending.

**Defaults to**: `semver-desc`

### `enable-prereleases`

Split the versions list into two separate lists of releases and prereleases, using `semver`.

**Defaults to**: `false`

## Example usage

```yaml
steps:
- uses: actions/checkout@v2
- uses: actions/setup-node@v2
  with:
    node-version: '14'
- run: npm install
- uses: marcoreni/docs-publisher-action@v0
  with:
    deployment-branch: 'gh-pages'
    docs-command: 'npm run docs'
    docs-path: 'docs'
    index-sorting: 'semver-desc'
```

## Development

There is no way to test the action locally, so you should have a repository where you run your tests.  

### Release a new version

1. Configure a `.env` file with the GITHUB_TOKEN variable. The PAT needs to have `repo` permissions on the Github Repo.
2. Run `npm run release`

## Recover function

The recover function will create the repo for already existing versioned docs.
Checkout an empty, orphan branch of your project repo (`git switch --orphan BRANCH_NAME`), then
create a `docs` folder and put your versioned folders in there.
Afterwards, run the command `ts-node src/recover.ts {PROJECT_REPO_DIR} {PROJECT_REPO_URL}` where

- `PROJECT_REPO_DIR` is the absolute path of the repository
- `PROJECT_REPO_URL` is the remote URL of the repository

The script will take care of generating the metadata.json file and the index.html file.

## TODO

- Support other version strategies (?)
- Create a version cleaner/archiver (version older than XXX are deleted / archived)
- Support `copy-changelog` parameter by putting the changelog inside the generated site
