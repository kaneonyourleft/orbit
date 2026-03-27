import { OrbitPlugin, PluginContext } from './types';

export class PluginRegistry {
  private plugins = new Map<string, OrbitPlugin>();
  private activePlugins = new Set<string>();

  register(plugin: OrbitPlugin) {
    this.plugins.set(plugin.id, plugin);
  }

  unregister(id: string) {
    this.deactivate(id);
    this.plugins.delete(id);
  }

  get(id: string) {
    return this.plugins.get(id);
  }

  getAll() {
    return Array.from(this.plugins.values());
  }

  activate(id: string, ctx: PluginContext) {
    const plugin = this.plugins.get(id);
    if (plugin && !this.activePlugins.has(id)) {
      plugin.activate(ctx);
      this.activePlugins.add(id);
    }
  }

  deactivate(id: string) {
    const plugin = this.plugins.get(id);
    if (plugin && this.activePlugins.has(id)) {
      plugin.deactivate();
      this.activePlugins.delete(id);
    }
  }

  isActive(id: string) {
    return this.activePlugins.has(id);
  }
}

export const pluginRegistry = new PluginRegistry();
