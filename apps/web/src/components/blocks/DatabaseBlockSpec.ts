import { createReactBlockSpec } from "@blocknote/react";
import DatabaseBlock from "./DatabaseBlock";

export const DATABASE_BLOCK_TYPE = 'database';

export const databaseBlockSpec = createReactBlockSpec(
  {
    type: DATABASE_BLOCK_TYPE,
    propSchema: {
      databaseId: { default: '' },
      pageId: { default: '' },
    },
    content: 'none',
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
