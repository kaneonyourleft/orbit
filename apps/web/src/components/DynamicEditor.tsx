"use client";
import dynamic from "next/dynamic";
export const DynamicEditor = dynamic(() => import("./Editor"), { ssr: false });
