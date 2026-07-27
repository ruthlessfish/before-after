import type { Plugin, PluginOption } from 'vite';
import config from '../../vite.config';

/**
 * Narrow Vite's PluginOption union in exactly one place. `plugins` is
 * `(Plugin | false | null | undefined | PluginOption[] | Promise<...>)[]`,
 * none of which the tests care about beyond the named plugin.
 */
export function findPlugin(name: string): Plugin | undefined {
  const plugins = (config.plugins ?? []) as PluginOption[];
  return plugins
    .flat()
    .find((p): p is Plugin => p != null && typeof p === 'object' && 'name' in p && p.name === name);
}
