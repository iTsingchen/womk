const { resolve } = require('node:path');
const { readdirSync } = require('node:fs');

const findTsConfigs = (projectDir) => {
  const tsConfigs = readdirSync(projectDir, { withFileTypes: true })
    .filter((dirent) => dirent.isFile())
    .filter((dirent) => dirent.name.startsWith('tsconfig'))
    .filter((dirent) => dirent.name.endsWith('.json'))
    .map((dirent) => resolve(projectDir, dirent.name));

  return tsConfigs;
};

module.exports = { findTsConfigs };
