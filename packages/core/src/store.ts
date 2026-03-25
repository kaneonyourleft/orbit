import { create } from 'zustand';
import { OrbitField, OrbitTable } from './types';

interface WorkspaceState {
  workspaces: { id: string; name: string }[];
  currentTable: OrbitTable | null;
  
  // Actions
  setWorkspaces: (workspaces: { id: string; name: string }[]) => void;
  setCurrentTable: (table: OrbitTable) => void;
  updateCell: (rowId: string, fieldId: string, value: any) => void;
  addRow: () => void;
}

/**
 * Global store for managing ORBIT workspace state.
 */
export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  currentTable: null,

  setWorkspaces: (workspaces) => set({ workspaces }),
  
  setCurrentTable: (table) => set({ currentTable: table }),

  updateCell: (rowId, fieldId, value) => set((state) => {
    if (!state.currentTable) return state;
    
    return {
      currentTable: {
        ...state.currentTable,
        rows: state.currentTable.rows.map((row) => 
          row.id === rowId ? { ...row, [fieldId]: value } : row
        )
      }
    };
  }),

  addRow: () => set((state) => {
    if (!state.currentTable) return state;
    
    const newRow = {
      id: `r-${Date.now()}`,
      ...Object.fromEntries(state.currentTable.fields.map(f => [f.id, '']))
    };

    return {
      currentTable: {
        ...state.currentTable,
        rows: [...state.currentTable.rows, newRow]
      }
    };
  })
}));
