const { Plugin } = require('release-it');
const fs = require('fs');
const path = require('path');
const execa = require('execa');


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
  publish() {
    const { tagName } = this.config.getContext();
    const tag = tagName.split('.')[0];

    this.exec(`git tag -d ${tag}`);
    this.exec(`git push origin :refs/tags/${tag}`);
    this.exec(`git tag ${tag}`);
    this.exec(`git push origin ${tag}`);
  }
  afterRelease() {
  }
}

module.exports = MovingGitTagPlugin;