import React from 'react';

const TreeDisplay = ({ tree }) => {
  if (!tree) return null;

  const simplifyTree = (node) => {
    if (!node) return null;
    
    const simplified = {
      value: node.value
    };
    
    if (node.left) {
      simplified.left = simplifyTree(node.left);
    } else {
      simplified.left = null;
    }
    
    if (node.right) {
      simplified.right = simplifyTree(node.right);
    } else {
      simplified.right = null;
    }
    
    return simplified;
  };

  const simplifiedTreeData = {
    nodeCount: tree.nodeCount,
    height: tree.height,
    isBalanced: tree.isBalanced,
    rootNode: simplifyTree(tree.rootNode)
  };

  return (
    <div className="tree-json-output">
      <h3>Current Tree Data (JSON)</h3>
      
      <div className="tree-summary p-4 bg-gray-50 rounded-md mb-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="font-semibold">ID:</div>
          <div>{tree.id}</div>
          
          <div className="font-semibold">Name:</div>
          <div>{tree.name}</div>
          
          <div className="font-semibold">Original Inputs:</div>
          <div>{tree.originalInputs.join(', ')}</div>
          
          <div className="font-semibold">Nodes:</div>
          <div>{tree.nodeCount}</div>
          
          <div className="font-semibold">Height:</div>
          <div>{tree.height}</div>
          
          <div className="font-semibold">Balanced:</div>
          <div>{tree.isBalanced ? 'true' : 'false'}</div>
        </div>
      </div>
      
      <pre className="bg-gray-100 p-4 rounded-md overflow-auto">
        <code>
          {JSON.stringify(simplifiedTreeData, null, 2)}
        </code>
      </pre>
    </div>
  );
};

export default function BinarySearchTreeDisplay({ currentTree }) {
  return currentTree && <TreeDisplay tree={currentTree} />;
}
