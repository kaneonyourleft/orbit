import { OrbitPlugin, PluginContext } from '../types';

/**
 * Export CSV Plugin
 * Adds a new menu item to generate and download CSV file of current data.
 */
export const exportCsvPlugin: OrbitPlugin = {
  id: 'export-csv-plugin',
  name: 'Export CSV',
  version: '1.0.0',
  description: 'Exports the active table data to a CSV file for analytical usage.',
  activate: (ctx: PluginContext) => {
    ctx.addMenuItem({
      label: 'Export CSV',
      onClick: () => {
        const headers = ctx.fields.map(f => f.name).join(',');
        const content = ctx.rows.map(row => {
          return ctx.fields.map(f => `"${String(row[f.id] || '')}"`).join(',');
        }).join('\n');
        
        const blob = new Blob([`${headers}\n${content}`], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${ctx.currentTable?.name || 'export'}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        ctx.showNotification('✅ Export Successful: CSV file generated and downloaded.');
      }
    });
  },
  deactivate: () => {}
};
