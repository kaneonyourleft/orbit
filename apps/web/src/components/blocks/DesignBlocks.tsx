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
      <div style={{
        background: props.block.props.color,
        borderRadius: 12,
        padding: "20px 24px",
        color: "#fff",
        fontWeight: 600,
      }}>
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
      <div style={{
        background: props.block.props.gradient,
        borderRadius: 16,
        padding: "40px 32px",
        color: "#fff",
        fontSize: 24,
        fontWeight: 800,
        textAlign: "center",
      }}>
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
      <div style={{
        background: props.block.props.cardColor,
        borderRadius: 12,
        padding: "20px 24px",
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        border: "1px solid #e2e8f0",
      }}>
        <span style={{ fontSize: 32 }}>{props.block.props.icon}</span>
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
      <div style={{
        background: props.block.props.bgColor,
        borderLeft: `4px solid ${props.block.props.borderColor}`,
        borderRadius: 8,
        padding: "16px 20px",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
      }}>
        <span style={{ fontSize: 24 }}>{props.block.props.emoji}</span>
        <div style={{ flex: 1 }}>
          <div ref={props.contentRef} />
        </div>
      </div>
    ),
  }
);
