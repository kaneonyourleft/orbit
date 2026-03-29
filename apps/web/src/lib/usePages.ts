"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

export interface PageData {
  id: string;
  title: string;
  icon: string;
  content: any[];
  background: string | null;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
}

export function usePages() {
  const [pages, setPages] = useState<PageData[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .order("created_at", { ascending: true });
    
    if (error) {
      console.error("Error fetching pages:", error);
    } else if (data) {
      setPages(data);
      if (data.length > 0 && !currentPageId) {
        setCurrentPageId(data[0].id);
      }
    }
    setLoading(false);
  }, [currentPageId]);

  useEffect(() => {
    fetchPages();
  }, []);

  const createPage = async () => {
    const newPage = {
      title: "Untitled",
      icon: "📄",
      content: [],
    };
    const { data, error } = await supabase
      .from("pages")
      .insert([newPage])
      .select()
      .single();

    if (error) {
      console.error("Error creating page:", error);
    } else if (data) {
      setPages((prev) => [...prev, data]);
      setCurrentPageId(data.id);
    }
  };

  const updatePage = async (id: string, updates: Partial<PageData>) => {
    const { error } = await supabase
      .from("pages")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Error updating page:", error);
    } else {
      setPages((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
    }
  };

  const deletePage = async (id: string) => {
    const { error } = await supabase.from("pages").delete().eq("id", id);
    if (error) {
      console.error("Error deleting page:", error);
    } else {
      setPages((prev) => prev.filter((p) => p.id !== id));
      if (currentPageId === id) {
        setCurrentPageId(pages.find((p) => p.id !== id)?.id || null);
      }
    }
  };

  return {
    pages,
    currentPageId,
    setCurrentPageId,
    loading,
    createPage,
    updatePage,
    deletePage,
    refresh: fetchPages,
  };
}
