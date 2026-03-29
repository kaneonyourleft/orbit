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
        <p className="orbit-kpi-label">{props.block.props.label}</p>
        <h2 className="orbit-kpi-value">{props.block.props.value}</h2>
        <p className="orbit-kpi-change" style={{ color: props.block.props.changeColor }}>
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
        <h3 className="orbit-status-title">{props.block.props.title}</h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div className="orbit-esc-icon-wrapper">⚡</div>
            <span className="orbit-esc-label">Ceramic ESC Line</span>
          </div>
          <h2 className="orbit-esc-value">{props.block.props.units} units</h2>
          <p className="orbit-esc-meta">
            Daily target: {props.block.props.target} | Yield: {props.block.props.yieldRate}%
          </p>
          <div className="orbit-esc-progress-bg">
            <div className="orbit-esc-progress-fill" style={{ width: `${yieldNum}%` }} />
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
        <div className="orbit-progress-item">
          <div className="orbit-progress-label-row">
            <span>{props.block.props.label}</span>
            <span style={{ color: props.block.props.color }}>{pct}%</span>
          </div>
          <div className="orbit-progress-bg">
            <div 
              style={{ width: `${pct}%`, height: "100%", background: props.block.props.color, borderRadius: 99, transition: "width 0.3s ease" }} 
            />
          </div>
        </div>
      );
    },
  }
);
