"use client";
import { createReactBlockSpec } from "@blocknote/react";
import React from "react";

export const ColorPanel = createReactBlockSpec(
  {
    type: "colorPanel" as const,
    propSchema: {
      color: { default: "#3b82f6" },
    },
    content: "inline",
  },
  {
    render: (props) => (
      <div className="orbit-color-panel" style={{ background: props.block.props.color }}>
        <div ref={props.contentRef} />
      </div>
    ),
  }
);

export const Banner = createReactBlockSpec(
  {
    type: "banner" as const,
    propSchema: {
      gradient: { default: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
    },
    content: "inline",
  },
  {
    render: (props) => (
      <div className="orbit-banner" style={{ background: props.block.props.gradient }}>
        <div ref={props.contentRef} />
      </div>
    ),
  }
);

export const IconCard = createReactBlockSpec(
  {
    type: "iconCard" as const,
    propSchema: {
      icon: { default: "🚀" },
      cardColor: { default: "#f0f9ff" },
    },
    content: "inline",
  },
  {
    render: (props) => (
      <div className="orbit-icon-card" style={{ background: props.block.props.cardColor }}>
        <span className="orbit-icon-wrapper">{props.block.props.icon}</span>
        <div style={{ flex: 1 }}>
          <div ref={props.contentRef} />
        </div>
      </div>
    ),
  }
);

export const CalloutBlock = createReactBlockSpec(
  {
    type: "callout" as const,
    propSchema: {
      emoji: { default: "💡" },
      bgColor: { default: "#fffbeb" },
      borderColor: { default: "#f59e0b" },
    },
    content: "inline",
  },
  {
    render: (props) => (
      <div className="orbit-callout" style={{ background: props.block.props.bgColor, borderLeftColor: props.block.props.borderColor }}>
        <span className="orbit-callout-icon">{props.block.props.emoji}</span>
        <div style={{ flex: 1 }}>
          <div ref={props.contentRef} />
        </div>
      </div>
    ),
  }
);
