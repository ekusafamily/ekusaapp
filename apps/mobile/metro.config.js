const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [monorepoRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Ignore temporary lock files, IDE temp folders, and build outputs
const blockList = [
  /.*\.openclaude\/.*/,
  /.*\.artifacts\/.*/,
  /.*\.turbo\/.*/,
  /.*\.git\/.*/,
  /.*\.lock\.pending\..*/,
  /.*\/dist\/.*/,
];

config.resolver.blockList = blockList;

module.exports = config;
