import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BinarySearchTree = () => {
  const [name, setName] = useState('');
  const [numbers, setNumbers] = useState('');
  const [currentTree, setCurrentTree] = useState(null);
  const [previousTrees, setPreviousTrees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPrevious, setShowPrevious] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [nameError, setNameError] = useState('');

  const API_URL = process.env.REACT_APP_API_BASE_URL || '/api/trees';
  const PAGE_SIZE = 5;
  const SVG_WIDTH = 800;
  const SVG_HEIGHT = 500;

  useEffect(() => {
    if (showPrevious) {
      fetchPreviousTrees();
    }
  }, [showPrevious, currentPage]);

  const fetchPreviousTrees = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${API_URL}?page=${currentPage}&size=${PAGE_SIZE}`);
      setPreviousTrees(response.data.trees);
      const calculatedTotalPages = Math.ceil(response.data.totalCount / response.data.size);
      setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
      setLoading(false);
    } catch (err) {
      let message = 'Failed to fetch previous trees';
      if (axios.isAxiosError(err)) {
          message = err.response?.data?.message || err.message || 'Failed to fetch previous trees';
      } else if (err instanceof Error) {
          message = err.message;
      }
      setError(message);
      setLoading(false);
    }
  };

  const handleNameChange = (e) => {
    const inputName = e.target.value;
    setName(inputName);
    setNameError('');
    const unsafeCharRegex = /[<>(){}[\]\\\/^$|?*+]/;
    if (unsafeCharRegex.test(inputName)) {
      setNameError('Name contains potentially unsafe special characters');
    }
  };

  const handleInputChange = (e) => {
    setNumbers(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter a name for the tree');
      return;
    }

    if (nameError) {
      setError('Please fix the name field errors before submitting');
      return;
    }

    try {
      setLoading(true);

      const numberArray = numbers
        .split(',')
        .map(num => num.trim())
        .filter(num => num !== '')
        .map(num => parseInt(num, 10));

      if (numberArray.some(isNaN)) {
        throw new Error('Please enter valid numbers separated by commas');
      }
      if (numberArray.length === 0) {
        throw new Error('Please enter at least one number');
      }

      const payload = {
        name: name.trim(),
        values: numberArray
      };

      const response = await axios.post(API_URL, payload);

      setCurrentTree(response.data);
      setName('');
      setNumbers('');
      setShowPrevious(false);
      setLoading(false);
    } catch (err) {
      let message = 'An error occurred while processing your request';
      if (axios.isAxiosError(err)) {
          message = err.response?.data?.message || err.message || 'Error creating tree';
      } else if (err instanceof Error) {
          message = err.message;
      }
      setError(message);
      setLoading(false);
    }
  };

  const handleShowPrevious = () => {
    setShowPrevious(true);
    setCurrentTree(null);
    setError('');
    setCurrentPage(0);
  };

  const handleShowInput = () => {
    setShowPrevious(false);
    setError('');
  };

  const handleLoadTree = async (id) => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${API_URL}/${id}`);
      setCurrentTree(response.data);
      setShowPrevious(false);
      setLoading(false);
    } catch (err) {
        let message = 'Failed to load tree';
        if (axios.isAxiosError(err)) {
            message = err.response?.data?.message || err.message || 'Failed to load tree';
        } else if (err instanceof Error) {
            message = err.message;
        }
        setError(message);
        setLoading(false);
    }
  };

  const handleDeleteTree = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this tree?')) {
      return;
    }
    try {
      setLoading(true);
      setError('');
      await axios.delete(`${API_URL}/${id}`);
      fetchPreviousTrees();
      if (currentTree && currentTree.id === id) {
        setCurrentTree(null);
      }
    } catch (err) {
      let message = 'Failed to delete tree';
      if (axios.isAxiosError(err)) {
          message = err.response?.data?.message || err.message || 'Failed to delete tree';
      } else if (err instanceof Error) {
          message = err.message;
      }
      setError(message);
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const renderTreeNode = (node, x, y, level = 0, parentX = null, parentY = null, maxWidth = SVG_WIDTH) => {
    if (!node) return null;

    const nodeSize = 36;
    const verticalSpacing = 70;
    const horizontalScaleFactor = 0.6;
    const baseHorizontalOffset = maxWidth / Math.pow(2, level + 1);
    const horizontalOffset = baseHorizontalOffset * Math.pow(horizontalScaleFactor, level);

    const nodeKey = node.id ?? `${node.value}-${x}-${y}`;

    return (
      <g key={nodeKey}>
        {parentX !== null && parentY !== null && (
           <line
             x1={parentX}
             y1={parentY + nodeSize / 2}
             x2={x}
             y2={y - nodeSize / 2}
             className="tree-edge"
           />
         )}
        <circle cx={x} cy={y} r={nodeSize / 2} className="tree-node" />
        <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="node-text">
          {node.value !== undefined ? node.value : node.val}
        </text>

        {node.left && renderTreeNode(node.left, x - horizontalOffset, y + verticalSpacing, level + 1, x, y, maxWidth)}
        {node.right && renderTreeNode(node.right, x + horizontalOffset, y + verticalSpacing, level + 1, x, y, maxWidth)}
      </g>
    );
  };

  const renderTree = (tree) => {
    if (!tree || !tree.rootNode) return null;

    const treeDepth = tree.height !== undefined ? tree.height : (tree.rootNode ? 1 : 0);
    const requiredHeight = Math.max(SVG_HEIGHT, (treeDepth + 1) * 80 + 50);
    const requiredWidth = SVG_WIDTH;

    return (
      <div className="tree-visualization">
        <h3>Binary Search Tree Visualization</h3>
        <div className="tree-info">
          <p>
            <strong>Name:</strong> {tree.name}
          </p>
          <p>
            <strong>Input Numbers:</strong> {tree.originalInputs?.join(', ')}
          </p>
          <p>
            <strong>Created:</strong> {new Date(tree.createdAt).toLocaleString()}
          </p>
          {tree.isBalanced !== null && (
             <p className={tree.isBalanced ? 'balanced-note' : 'unbalanced-note'}>
                This tree is {tree.isBalanced ? 'balanced' : 'unbalanced'}
             </p>
           )}
           <p>Nodes: {tree.nodeCount ?? 'N/A'}, Height: {tree.height ?? 'N/A'}</p>
        </div>
        <svg width={requiredWidth} height={requiredHeight} viewBox={`0 0 ${requiredWidth} ${requiredHeight}`}>
          {renderTreeNode(tree.rootNode, requiredWidth / 2, 40)}
        </svg>
      </div>
    );
  };

  return (
    <div className="bst-container">
      <h2>Binary Search Tree Generator</h2>

      <div className="navigation-tabs">
        <button className={!showPrevious ? 'active' : ''} onClick={handleShowInput}>
          Create Tree
        </button>
        <button className={showPrevious ? 'active' : ''} onClick={handleShowPrevious}>
          Previous Trees
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {!showPrevious ? (
        <div className="input-section">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="treeName">Tree Name:</label>
              <input
                type="text"
                id="treeName"
                value={name}
                onChange={handleNameChange}
                placeholder="Enter a name for your tree"
                required
                aria-describedby={nameError ? 'name-error' : undefined}
              />
              {nameError && <div id="name-error" className="field-error">{nameError}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="numbers">Enter numbers separated by commas:</label>
              <input
                type="text"
                id="numbers"
                value={numbers}
                onChange={handleInputChange}
                placeholder="e.g., 50, 30, 70, 20, 40, 60, 80"
                required
              />
            </div>
            <button type="submit" disabled={loading || !!nameError}>
              {loading ? 'Processing...' : 'Generate Tree'}
            </button>
          </form>

          {loading && currentTree && <div className="loading-spinner">Loading Tree...</div>}
          {currentTree && !loading && renderTree(currentTree)}
        </div>
      ) : (
        <div className="previous-trees-section">
          <h3>Previous Trees</h3>

          {loading ? (
            <div className="loading-spinner">Loading...</div>
          ) : !previousTrees || previousTrees.length === 0 ? (
            <p className="no-data">No previous trees found</p>
          ) : (
            <>
              <div className="tree-list">
                {previousTrees.map((tree) => (
                  <div key={tree.id} className="tree-item" onClick={() => handleLoadTree(tree.id)} role="button" tabIndex={0} onKeyPress={(e) => e.key === 'Enter' && handleLoadTree(tree.id)}>
                    <div className="tree-item-details">
                      <p className="tree-name">{tree.name}</p>
                      <p className="tree-metadata">
                         Nodes: {tree.nodeCount ?? 'N/A'} | Height: {tree.height ?? 'N/A'}
                      </p>
                      <p className="tree-date">{new Date(tree.createdAt).toLocaleString()}</p>
                      {tree.isBalanced !== null && (
                         <span className={`balanced-badge ${tree.isBalanced ? 'balanced' : 'unbalanced'}`}>
                           {tree.isBalanced ? 'Balanced' : 'Unbalanced'}
                         </span>
                       )}
                    </div>
                    <button
                      className="delete-button"
                      onClick={(e) => handleDeleteTree(tree.id, e)}
                      aria-label={`Delete tree ${tree.name}`}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination-controls">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0 || loading}
                  >
                    Previous
                  </button>
                  <span>
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1 || loading}
                  >
                    Next
                  </button>
                </div>
               )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BinarySearchTree;
