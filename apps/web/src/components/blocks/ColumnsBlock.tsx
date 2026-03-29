"use client";
import { createReactBlockSpec } from "@blocknote/react";
import React from "react";

export const TwoColumns = createReactBlockSpec(
  {
    type: "twoColumns" as const,
    propSchema: {},
    content: "none",
  },
  {
    render: () => (
      <div className="orbit-column-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="orbit-column-item">컬럼 1</div>
        <div className="orbit-column-item">컬럼 2</div>
      </div>
    ),
  }
);

export const ThreeColumns = createReactBlockSpec(
  {
    type: "threeColumns" as const,
    propSchema: {},
    content: "none",
  },
  {
    render: () => (
      <div className="orbit-column-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <div className="orbit-column-item">컬럼 1</div>
        <div className="orbit-column-item">컬럼 2</div>
        <div className="orbit-column-item">컬럼 3</div>
      </div>
    ),
  }
);

export const FourColumns = createReactBlockSpec(
  {
    type: "fourColumns" as const,
    propSchema: {},
    content: "none",
  },
  {
    render: () => (
      <div className="orbit-column-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
        <div className="orbit-column-item">컬럼 1</div>
        <div className="orbit-column-item">컬럼 2</div>
        <div className="orbit-column-item">컬럼 3</div>
        <div className="orbit-column-item">컬럼 4</div>
      </div>
    ),
  }
);

export const Divider = createReactBlockSpec(
  {
    type: "divider" as const,
    propSchema: {},
    content: "none",
  },
  {
    render: () => (
      <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "12px 0" }} />
    ),
  }
);

export const Spacer = createReactBlockSpec(
  {
    type: "spacer" as const,
    propSchema: {},
    content: "none",
  },
  {
    render: () => (
      <div style={{ height: 48 }} />
    ),
  }
);
