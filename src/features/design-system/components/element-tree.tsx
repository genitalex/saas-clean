'use client';

import { Icons } from '@/components/icons';
import type { DesignTreeNode } from '../lib/design-registry';

function TreeNode({
  node,
  onSelect
}: {
  node: DesignTreeNode;
  onSelect: (node: DesignTreeNode) => void;
}) {
  return (
    <li>
      <button type='button' className='design-tree-node' onClick={() => onSelect(node)}>
        <Icons.chevronRight className='size-3' />
        <span>{node.label}</span>
        <code>{node.id}</code>
      </button>
      {node.children && (
        <ul>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function ElementTree({
  nodes,
  onSelect
}: {
  nodes: DesignTreeNode[];
  onSelect: (node: DesignTreeNode) => void;
}) {
  return (
    <ul className='design-tree'>
      {nodes.map((node) => (
        <TreeNode key={node.id} node={node} onSelect={onSelect} />
      ))}
    </ul>
  );
}
