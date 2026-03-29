"use client";
import { createReactBlockSpec } from "@blocknote/react";
import React from "react";

export const TwoColumns = createReactBlockSpec(
  {
    type: "twoColumns",
    propSchema: {
      left: { default: "" },
      right: { default: "" },
    },
    content: "none",
  },
  {
    render: () => (
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
        padding: 12,
        border: "1px dashed #e2e8f0",
        borderRadius: 8,
        minHeight: 80,
      }}>
        <div
          contentEditable
          suppressContentEditableWarning
          style={{
            padding: 12,
            background: "#f8fafc",
            borderRadius: 6,
            minHeight: 60,
            outline: "none",
          }}
          data-placeholder="왼쪽 컬럼"
        />
        <div
          contentEditable
          suppressContentEditableWarning
          style={{
            padding: 12,
            background: "#f8fafc",
            borderRadius: 6,
            minHeight: 60,
            outline: "none",
          }}
          data-placeholder="오른쪽 컬럼"
        />
      </div>
    ),
  }
);

export const ThreeColumns = createReactBlockSpec(
  {
    type: "threeColumns",
    propSchema: {},
    content: "none",
  },
  {
    render: () => (
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 16,
        padding: 12,
        border: "1px dashed #e2e8f0",
        borderRadius: 8,
        minHeight: 80,
      }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            contentEditable
            suppressContentEditableWarning
            style={{
              padding: 12,
              background: "#f8fafc",
              borderRadius: 6,
              minHeight: 60,
              outline: "none",
            }}
          />
        ))}
      </div>
    ),
  }
);

export const FourColumns = createReactBlockSpec(
  {
    type: "fourColumns",
    propSchema: {},
    content: "none",
  },
  {
    render: () => (
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr",
        gap: 16,
        padding: 12,
        border: "1px dashed #e2e8f0",
        borderRadius: 8,
        minHeight: 80,
      }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            contentEditable
            suppressContentEditableWarning
            style={{
              padding: 12,
              background: "#f8fafc",
              borderRadius: 6,
              minHeight: 60,
              outline: "none",
            }}
          />
        ))}
      </div>
    ),
  }
);

export const Divider = createReactBlockSpec(
  {
    type: "divider",
    propSchema: {
      style: { default: "solid" },
    },
    content: "none",
  },
  {
    render: ({ block }) => (
      <hr style={{
        border: "none",
        borderTop: `2px ${block.props.style} #e2e8f0`,
        margin: "16px 0",
      }} />
    ),
  }
);

export const Spacer = createReactBlockSpec(
  {
    type: "spacer",
    propSchema: {
      height: { default: "40" },
    },
    content: "none",
  },
  {
    render: ({ block }) => (
      <div style={{
        height: parseInt(block.props.height),
        background: "transparent",
        borderLeft: "2px dashed #e2e8f0",
        marginLeft: "50%",
      }} />
    ),
  }
);
