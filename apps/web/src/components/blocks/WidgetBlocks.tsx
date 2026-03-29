"use client";
import { createReactBlockSpec } from "@blocknote/react";
import React from "react";

export const KpiCard = createReactBlockSpec(
  {
    type: "kpiCard" as const,
    propSchema: {
      label: { default: "Total Production" },
      value: { default: "1,247" },
      change: { default: "↑ 12.5% from last week" },
      changeColor: { default: "#10b981" },
    },
    content: "none",
  },
  {
    render: (props) => (
      <div className="orbit-kpi-card">
        <p style={{ fontSize: 12, color: "#71717a", margin: "0 0 8px 0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {props.block.props.label}
        </p>
        <h2 style={{ fontSize: 32, fontWeight: 900, color: "#18181b", margin: "0 0 4px 0", letterSpacing: "-0.01em" }}>
          {props.block.props.value}
        </h2>
        <p style={{ fontSize: 13, color: props.block.props.changeColor, margin: 0, fontWeight: 600 }}>
          {props.block.props.change}
        </p>
      </div>
    ),
  }
);

export const StatusBoard = createReactBlockSpec(
  {
    type: "statusBoard" as const,
    propSchema: {
      title: { default: "Production Status" },
      planned: { default: "5" },
      inProgress: { default: "3" },
      completed: { default: "12" },
      stuck: { default: "1" },
    },
    content: "none",
  },
  {
    render: (props) => (
      <div className="orbit-status-board">
        <h3 style={{ fontSize: 14, fontWeight: 800, color: "#18181b", margin: "0 0 16px 0", textTransform: "uppercase", letterSpacing: "0.02em" }}>
          {props.block.props.title}
        </h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className="orbit-status-badge" style={{ background: "#dbeafe", color: "#1d4ed8", borderColor: "#bfdbfe" }}>
            Planned: {props.block.props.planned}
          </span>
          <span className="orbit-status-badge" style={{ background: "#fef3c7", color: "#b45309", borderColor: "#fde68a" }}>
            In Progress: {props.block.props.inProgress}
          </span>
          <span className="orbit-status-badge" style={{ background: "#dcfce7", color: "#15803d", borderColor: "#bbf7d0" }}>
            Completed: {props.block.props.completed}
          </span>
          <span className="orbit-status-badge" style={{ background: "#fee2e2", color: "#dc2626", borderColor: "#fecaca" }}>
            Stuck: {props.block.props.stuck}
          </span>
        </div>
      </div>
    ),
  }
);

export const EscProduction = createReactBlockSpec(
  {
    type: "escProduction" as const,
    propSchema: {
      units: { default: "856" },
      target: { default: "1,000" },
      yieldRate: { default: "85.6" },
    },
    content: "none",
  },
  {
    render: (props) => {
      const yieldNum = parseFloat(props.block.props.yieldRate) || 0;
      return (
        <div className="orbit-esc-monitor" style={{ background: "linear-gradient(135deg, #001B3E, #0058BE)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 44, height: 44,
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20,
            }}>⚡</div>
            <span style={{ fontSize: 13, fontWeight: 800, opacity: 0.9, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Ceramic ESC Line
            </span>
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 900, margin: "0 0 8px 0", letterSpacing: "-0.02em" }}>
            {props.block.props.units} units
          </h2>
          <p style={{ fontSize: 12, opacity: 0.7, margin: 0, fontWeight: 600 }}>
            Daily target: {props.block.props.target} | Yield: {props.block.props.yieldRate}%
          </p>
          <div style={{
            marginTop: 20,
            background: "rgba(255,255,255,0.15)",
            borderRadius: 99,
            height: 10,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.1)",
          }}>
            <div style={{
              width: `${yieldNum}%`,
              height: "100%",
              background: "linear-gradient(90deg, #38bdf8, #22d3ee)",
              borderRadius: 99,
            }} />
          </div>
        </div>
      );
    },
  }
);

export const ProgressBar = createReactBlockSpec(
  {
    type: "progressBar" as const,
    propSchema: {
      label: { default: "진행률" },
      percent: { default: "75" },
      color: { default: "#3b82f6" },
    },
    content: "none",
  },
  {
    render: (props) => {
      const pct = parseFloat(props.block.props.percent) || 0;
      return (
        <div className="orbit-progress-container">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#18181b" }}>{props.block.props.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: props.block.props.color }}>{pct}%</span>
          </div>
          <div className="orbit-progress-bg">
            <div style={{ width: `${pct}%`, height: "100%", background: props.block.props.color, borderRadius: 99, transition: "width 0.3s ease" }} />
          </div>
        </div>
      );
    },
  }
);
