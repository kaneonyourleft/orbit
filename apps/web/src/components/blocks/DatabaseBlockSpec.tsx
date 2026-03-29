'use client';
import React from 'react';
import { createReactBlockSpec } from '@blocknote/react';
import DatabaseBlock from './DatabaseBlock';

export const databaseBlockSpec = createReactBlockSpec(
  {
    type: 'database' as const,
    propSchema: {
      databaseId: { default: '' },
      pageId: { default: '' },
    },
    content: 'none' as const,
  },
  {
    render: ({ block }) => {
      return (
        <DatabaseBlock
          blockId={block.id}
          pageId={block.props.pageId}
          existingDbId={block.props.databaseId}
        />
      );
    },
  }
);
