import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  
  const initializedPlugins = useRef<Set<string>>(new Set());

  const addMenuItem = useCallback((item: PluginMenuItem) => {
    setMenuItems(prev => {
      if (prev.find(p => p.label === item.label)) return prev;
      return [...prev, item];
    });
  }, []);

  const registerView = useCallback((view: PluginView) => {
    setExtraViews(prev => {
      if (prev.find(v => v.id === view.id)) return prev;
      return [...prev, view];
    });
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

  const pluginCtx = useMemo<PluginContext>(() => ({
    ...ctxParams,
    addMenuItem,
    registerView,
    registerFieldRenderer,
    showNotification
  }), [ctxParams, addMenuItem, registerView, registerFieldRenderer, showNotification]);

  useEffect(() => {
    // Only register and activate once per plugin list change
    pluginList.forEach(plugin => {
      if (!initializedPlugins.current.has(plugin.id)) {
        pluginRegistry.register(plugin);
        pluginRegistry.activate(plugin.id, pluginCtx);
        initializedPlugins.current.add(plugin.id);
      }
    });

    return () => {
      // In a real app we might want to deactivate, but here we keep it sticky
      // pluginList.forEach(plugin => {
      //   pluginRegistry.deactivate(plugin.id);
      // });
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
