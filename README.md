<!-- omit in toc -->
# Docs publisher action

- [Inputs](#inputs)
  - [`deployment-branch`](#deployment-branch)
  - [`docs-command`](#docs-command)
  - [`docs-path`](#docs-path)
  - [`version-strategy`](#version-strategy)
- [Example usage](#example-usage)
- [Development](#development)
  - [Release a new version](#release-a-new-version)
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

**Required** The command to be run inside the repository to create the docs

### `docs-path`

**Required** The path where documentation will be found once docs are created. Path is relative to the root of the project

### `version-strategy`

The strategy to use to fetch the version. Currently, only `tag` is supported.

**Defaults to**: `tag`

## Example usage

```yaml
steps:
- uses: actions/checkout@v2
- uses: actions/setup-node@v2
  with:
    node-version: '14'
- run: npm install
- uses: marcoreni/docs-publisher-action@v0.0.1
  with:
    deployment-branch: 'gh-pages'
    docs-command: 'npm install && npm run docs'
```

## Development

There is no way to test the action locally, so you should have a repository where you run your tests.  

### Release a new version

```sh
npm run release
```

## TODO

- Support other version strategies (?)
- Create a version cleaner/archiver (version older than XXX are deleted / archived)
- Support `copy-changelog` parameter by putting the changelog inside the generated site
- Enable GitHub releases (see <https://github.com/release-it/release-it/blob/master/docs/github-releases.md>)
