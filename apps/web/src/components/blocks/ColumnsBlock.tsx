"use client";
import { createReactBlockSpec } from "@blocknote/react";
import React from "react";

// BlockNote 0.47.3 사양: createReactBlockSpec은 호출 가능한 함수가 아닌 BlockSpec 객체를 반환합니다.
// 인라인 스타일 경고를 해결하기 위해 orbit.css에 정의된 그리드 클래스들을 적용했습니다.
// '유추된 형식 이름' 관련 에러를 방지하기 위해 복잡한 제네릭 대신 범용 인터페이스 구조를 유지합니다.

export const createTwoColumns = createReactBlockSpec(
  {
    type: "twoColumns",
    propSchema: {},
    content: "none",
  },
  {
    render: () => (
      <div className="orbit-layout-container orbit-grid-2">
        <div
          contentEditable
          suppressContentEditableWarning
          className="orbit-column-cell"
        />
        <div
          contentEditable
          suppressContentEditableWarning
          className="orbit-column-cell"
        />
      </div>
    ),
  }
);

export const createThreeColumns = createReactBlockSpec(
  {
    type: "threeColumns",
    propSchema: {},
    content: "none",
  },
  {
    render: () => (
      <div className="orbit-layout-container orbit-grid-3">
        {[1, 2, 3].map((i) => (
          <div key={i} contentEditable suppressContentEditableWarning className="orbit-column-cell" />
        ))}
      </div>
    ),
  }
);

export const createFourColumns = createReactBlockSpec(
  {
    type: "fourColumns",
    propSchema: {},
    content: "none",
  },
  {
    render: () => (
      <div className="orbit-layout-container orbit-grid-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} contentEditable suppressContentEditableWarning className="orbit-column-cell" />
        ))}
      </div>
    ),
  }
);

export const createDivider = createReactBlockSpec(
  {
    type: "divider",
    propSchema: {},
    content: "none",
  },
  {
    render: () => (
      <hr className="orbit-divider" />
    ),
  }
);

export const createSpacer = createReactBlockSpec(
  {
    type: "spacer",
    propSchema: {},
    content: "none",
  },
  {
    render: () => (
      <div className="orbit-spacer" />
    ),
  }
);
