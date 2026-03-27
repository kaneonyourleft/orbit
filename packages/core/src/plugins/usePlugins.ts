import { useState, useEffect, useCallback, useMemo } from 'react';
import { OrbitPlugin, PluginContext, PluginMenuItem, PluginView, PluginFieldRenderer } from './types';
import { pluginRegistry } from './registry';

/**
 * Hook to manage plugin registration and context-aware activations.
 */
export function usePlugins(pluginList: OrbitPlugin[], ctxParams: Omit<PluginContext, 'addMenuItem' | 'registerView' | 'registerFieldRenderer' | 'showNotification'>) {
  const [menuItems, setMenuItems] = useState<PluginMenuItem[]>([]);
  const [extraViews, setExtraViews] = useState<PluginView[]>([]);
  const [fieldRenderers, setFieldRenderers] = useState<Record<string, PluginFieldRenderer>>({});
  const [notifications, setNotifications] = useState<string[]>([]);

  const addMenuItem = useCallback((item: PluginMenuItem) => {
    setMenuItems(prev => [...prev, item]);
  }, []);

  const registerView = useCallback((view: PluginView) => {
    setExtraViews(prev => [...prev, view]);
  }, []);

  const registerFieldRenderer = useCallback((type: string, component: PluginFieldRenderer) => {
    setFieldRenderers(prev => ({ ...prev, [type]: component }));
  }, []);

  const showNotification = useCallback((msg: string) => {
    setNotifications(prev => [...prev, msg]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(m => m !== msg));
    }, 5000);
  }, []);

  // Context should be updated when rows/fields change
  const pluginCtx = useMemo<PluginContext>(() => ({
    ...ctxParams,
    addMenuItem,
    registerView,
    registerFieldRenderer,
    showNotification
  }), [ctxParams, addMenuItem, registerView, registerFieldRenderer, showNotification]);

  useEffect(() => {
    // Initial registration and activation
    pluginList.forEach(plugin => {
      pluginRegistry.register(plugin);
      pluginRegistry.activate(plugin.id, pluginCtx);
    });

    return () => {
      pluginList.forEach(plugin => {
        pluginRegistry.deactivate(plugin.id);
      });
    };
  }, [pluginList, pluginCtx]);

  return {
    menuItems,
    extraViews,
    fieldRenderers,
    notifications,
    pluginRegistry
  };
}
