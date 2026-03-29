import { useState, useEffect, useCallback } from 'react';
import { createClient } from './supabase';
import type { Database, DBRow, DBColumn, DBView } from '../components/database/types';

const supabase = createClient();

export function useDatabase(databaseId: string | null) {
  const [db, setDb] = useState<Database | null>(null);
  const [rows, setRows] = useState<DBRow[]>([]);
  const [loading, setLoading] = useState(true);

  // 데이터베이스 + 행 로드
  useEffect(() => {
    if (!databaseId) return;
    setLoading(true);
    
    Promise.all([
      supabase.from('orbit_databases').select('*').eq('id', databaseId).single(),
      supabase.from('orbit_rows').select('*').eq('database_id', databaseId).order('sort_order', { ascending: true })
    ]).then(([dbRes, rowsRes]) => {
      if (dbRes.data) {
        setDb({
          ...dbRes.data,
          columns: typeof dbRes.data.columns === 'string' ? JSON.parse(dbRes.data.columns) : (dbRes.data.columns || []),
          views: typeof dbRes.data.views === 'string' ? JSON.parse(dbRes.data.views) : (dbRes.data.views || []),
        });
      }
      if (rowsRes.data) setRows(rowsRes.data);
      setLoading(false);
    });
  }, [databaseId]);

  // 새 데이터베이스 생성
  const createDatabase = useCallback(async (pageId: string, blockId: string) => {
    const { data } = await supabase.from('orbit_databases').insert({
      page_id: pageId,
      block_id: blockId,
      name: '새 데이터베이스',
      columns: [],
      views: [{ id: 'view_table', name: '테이블', type: 'table', filters: [], sorts: [] }]
    }).select().single();
    if (data) {
      setDb({
        ...data,
        columns: typeof data.columns === 'string' ? JSON.parse(data.columns) : (data.columns || []),
        views: typeof data.views === 'string' ? JSON.parse(data.views) : (data.views || []),
      });
    }
    return data;
  }, []);

  // 행 추가
  const addRow = useCallback(async (cells?: Record<string, any>) => {
    if (!databaseId) return;
    const maxOrder = rows.length > 0 ? Math.max(...rows.map(r => r.sort_order)) + 1 : 0;
    const { data } = await supabase.from('orbit_rows').insert({
      database_id: databaseId,
      cells: cells || {},
      sort_order: maxOrder,
    }).select().single();
    if (data) setRows(prev => [...prev, data]);
    return data;
  }, [databaseId, rows]);

  // 셀 업데이트
  const updateCell = useCallback(async (rowId: string, columnId: string, value: any) => {
    const row = rows.find(r => r.id === rowId);
    if (!row) return;
    const newCells = { ...row.cells, [columnId]: value };
    await supabase.from('orbit_rows').update({ cells: newCells, updated_at: new Date().toISOString() }).eq('id', rowId);
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, cells: newCells } : r));
  }, [rows]);

  // 행 삭제
  const deleteRow = useCallback(async (rowId: string) => {
    await supabase.from('orbit_rows').delete().eq('id', rowId);
    setRows(prev => prev.filter(r => r.id !== rowId));
  }, []);

  // 컬럼 추가
  const addColumn = useCallback(async (column: DBColumn) => {
    if (!db) return;
    const newColumns = [...db.columns, column];
    await supabase.from('orbit_databases').update({ columns: newColumns, updated_at: new Date().toISOString() }).eq('id', db.id);
    setDb(prev => prev ? { ...prev, columns: newColumns } : null);
  }, [db]);

  // 컬럼 수정
  const updateColumn = useCallback(async (columnId: string, updates: Partial<DBColumn>) => {
    if (!db) return;
    const newColumns = db.columns.map(c => c.id === columnId ? { ...c, ...updates } : c);
    await supabase.from('orbit_databases').update({ columns: newColumns, updated_at: new Date().toISOString() }).eq('id', db.id);
    setDb(prev => prev ? { ...prev, columns: newColumns } : null);
  }, [db]);

  // 컬럼 삭제
  const deleteColumn = useCallback(async (columnId: string) => {
    if (!db) return;
    const newColumns = db.columns.filter(c => c.id !== columnId);
    await supabase.from('orbit_databases').update({ columns: newColumns, updated_at: new Date().toISOString() }).eq('id', db.id);
    setDb(prev => prev ? { ...prev, columns: newColumns } : null);
    
    // 비동기로 모든 행에서 해당 컬럼 데이터 제거 (Supabase 에선 JSONB 부분 삭제 제약이 있을 수 있어 개별 업데이트 하거나 클라이언트 측에서만 우선 반영)
    setRows(prev => prev.map(r => {
      const newCells = { ...r.cells };
      delete newCells[columnId];
      return { ...r, cells: newCells };
    }));
  }, [db]);

  // 뷰 업데이트
  const updateView = useCallback(async (viewId: string, updates: Partial<DBView>) => {
    if (!db) return;
    const newViews = db.views.map(v => v.id === viewId ? { ...v, ...updates } : v);
    await supabase.from('orbit_databases').update({ views: newViews, updated_at: new Date().toISOString() }).eq('id', db.id);
    setDb(prev => prev ? { ...prev, views: newViews } : null);
  }, [db]);

  return {
    db, rows, loading,
    createDatabase, addRow, updateCell, deleteRow,
    addColumn, updateColumn, deleteColumn, updateView,
  };
}
