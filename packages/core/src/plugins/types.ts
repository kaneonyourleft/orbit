import { OrbitField } from '../types';

export interface OrbitPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  icon?: string;
  activate: (ctx: PluginContext) => void;
  deactivate: () => void;
}

export interface PluginContext {
  supabase: any;
  currentWorkspace: any;
  currentTable: any;
  fields: OrbitField[];
  rows: Record<string, any>[];
  addMenuItem: (item: PluginMenuItem) => void;
  registerView: (view: PluginView) => void;
  registerFieldRenderer: (type: string, component: PluginFieldRenderer) => void;
  showNotification: (msg: string) => void;
}

export interface PluginMenuItem {
  label: string;
  icon?: string;
  onClick: () => void;
}

export interface PluginView {
  id: string;
  label: string;
  icon?: string;
  component: React.ComponentType;
}

export type PluginFieldRenderer = React.ComponentType<{ 
  value: any; 
  field: OrbitField; 
  onChange: (v: any) => void; 
}>;
