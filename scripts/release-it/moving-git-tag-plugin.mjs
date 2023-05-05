import { Plugin } from 'release-it';

const prompts = {
  publish: {
    type: 'confirm',
    message: context => `Move tag ${context.tag}?`
  }
};

class MovingGitTagPlugin extends Plugin {
  constructor(...args) {
    super(...args);
    this.registerPrompts(prompts);
  }

  static isEnabled(options) {
    return options !== false;

  }
  init() {
  }

  async release() {
    await this.step({ task: () => this.publish(), label: 'Move the major version git tag', prompt: 'publish' });
  }
  async publish() {
    const { tagName, isPreRelease } = this.config.getContext();
    // Skip prereleases
    if (isPreRelease) return;

    const tag = tagName.split('.')[0];

    try {
      await this.exec(`git tag -d ${tag}`)
      await this.exec(`git push origin :refs/tags/${tag}`);
    } catch (err) {
      if (/error: tag .+ not found/.test(err)) {
        this.log.info('No old tag to delete.');
      } else {
        throw new Error(err);
      }
      // Tag may not exist
    }

    await this.exec(`git tag ${tag}`);
    return this.exec(`git push origin ${tag}`);
  }
  afterRelease() {
  }
}

export default MovingGitTagPlugin;