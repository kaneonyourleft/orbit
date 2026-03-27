import { OrbitPlugin, PluginContext } from '../types';

/**
 * Row Count Plugin
 * Adds a new menu item to show row statistics and completion percentage.
 */
export const rowCountPlugin: OrbitPlugin = {
  id: 'row-count-plugin',
  name: 'Row Statistics',
  version: '1.1.0',
  description: 'Calculates and displays real-time table statistics including completion progress.',
  activate: (ctx: PluginContext) => {
    ctx.addMenuItem({
      label: 'Row Statistics',
      onClick: () => {
        const totalRows = ctx.rows.length;
        const doneField = ctx.fields.find(f => f.name.toLowerCase() === 'status' || f.name.toLowerCase() === 'done');
        const doneRows = ctx.rows.filter(r => {
          const val = String(r[doneField?.id || '']).toLowerCase();
          return val === 'done' || r[doneField?.id || ''] === true;
        }).length;
        const percentage = totalRows > 0 ? ((doneRows / totalRows) * 100).toFixed(1) : 0;
        
        ctx.showNotification(`📊 Table Stats: ${totalRows} total rows, ${doneRows} completed (${percentage}% progress).`);
      }
    });
  },
  deactivate: () => {}
};
