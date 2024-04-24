import { registerTsProject } from '@nx/js/src/internal';
import { clearRequireCache } from '@nx/devkit/src/utils/config-utils';

export function resolveUserDefinedWebpackConfig(
  path: string,
  tsConfig: string,
  /** Skip require cache and return latest content */
  reload = false
) {
  if (reload) {
    // Clear cache if the path is in the cache
    if (require.cache[path]) {
      // Clear all entries because config may import other modules
      clearRequireCache();
    }
  }

  // Don't transpile non-TS files. This prevents workspaces libs from being registered via tsconfig-paths.
  // There's an issue here with Nx workspace where loading plugins from source (via tsconfig-paths) can lead to errors.
  if (!/\.(ts|mts|cts)$/.test(path)) {
    return require(path);
  }

  const cleanupTranspiler = registerTsProject(tsConfig);
  const maybeCustomWebpackConfig = require(path);
  cleanupTranspiler();

  // If the user provides a configuration in TS file
  // then there are 3 cases for exporing an object. The first one is:
  // `module.exports = { ... }`. And the second one is:
  // `export default { ... }`. The ESM format is compiled into:
  // `{ default: { ... } }`
  // There is also a case of
  // `{ default: { default: { ... } }`
  const customWebpackConfig =
    'default' in maybeCustomWebpackConfig
      ? 'default' in maybeCustomWebpackConfig.default
        ? maybeCustomWebpackConfig.default.default
        : maybeCustomWebpackConfig.default
      : maybeCustomWebpackConfig;

  return customWebpackConfig;
}
