import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BinarySearchTree = () => {
  const [numbers, setNumbers] = useState('');
  const [currentTree, setCurrentTree] = useState(null);
  const [previousTrees, setPreviousTrees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPrevious, setShowPrevious] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const API_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    if (showPrevious) {
      fetchPreviousTrees();
    }
  }, [showPrevious, currentPage]);

  const fetchPreviousTrees = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}?page=${currentPage}&size=5`);
      setPreviousTrees(response.data.trees);
      setTotalPages(response.data.totalPages);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch previous trees');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setNumbers(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const numberArray = numbers
        .split(',')
        .map(num => num.trim())
        .filter(num => num !== '')
        .map(num => parseInt(num, 10));

      if (numberArray.some(isNaN)) {
        throw new Error('Please enter valid numbers separated by commas');
      }

      const response = await axios.post(API_URL, {
        numbers: numberArray,
      });

      setCurrentTree(response.data);
      setLoading(false);
      setShowPrevious(false);
    } catch (err) {
      setError(err.message || 'An error occurred while processing your request');
      setLoading(false);
    }
  };

  const handleShowPrevious = () => {
    setShowPrevious(true);
    setCurrentTree(null);
  };

  const handleShowInput = () => {
    setShowPrevious(false);
  };

  const handleLoadTree = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/${id}`);
      setCurrentTree(response.data);
      setShowPrevious(false);
      setLoading(false);
    } catch (err) {
      setError('Failed to load tree');
      setLoading(false);
    }
  };

  const handleDeleteTree = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API_URL}/${id}`);
      setPreviousTrees(previousTrees.filter(tree => tree.id !== id));
      if (currentTree && currentTree.id === id) {
        setCurrentTree(null);
      }
    } catch (err) {
      setError('Failed to delete tree');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const renderTreeNode = (node, x, y, level = 0, maxWidth = 800) => {
    if (!node) return null;

    const nodeSize = 40;
    const verticalSpacing = 80;
    const horizontalOffset = maxWidth / Math.pow(2, level + 1);

    return (
      <g key={`${node.value}-${x}-${y}`}>
        <circle cx={x} cy={y} r={nodeSize / 2} className="tree-node" />
        <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="node-text">
          {node.value}
        </text>

        {node.left && (
          <>
            <line
              x1={x}
              y1={y + nodeSize / 2}
              x2={x - horizontalOffset}
              y2={y + verticalSpacing - nodeSize / 2}
              className="tree-edge"
            />
            {renderTreeNode(node.left, x - horizontalOffset, y + verticalSpacing, level + 1, maxWidth)}
          </>
        )}

        {node.right && (
          <>
            <line
              x1={x}
              y1={y + nodeSize / 2}
              x2={x + horizontalOffset}
              y2={y + verticalSpacing - nodeSize / 2}
              className="tree-edge"
            />
            {renderTreeNode(node.right, x + horizontalOffset, y + verticalSpacing, level + 1, maxWidth)}
          </>
        )}
      </g>
    );
  };

  const renderTree = (tree) => {
    if (!tree || !tree.root) return null;

    const width = 800;
    const height = 500;

    return (
      <div className="tree-visualization">
        <h3>Binary Search Tree Visualization</h3>
        <div className="tree-info">
          <p>
            <strong>Input Numbers:</strong> {tree.numbers.join(', ')}
          </p>
          <p>
            <strong>Created:</strong> {new Date(tree.createdAt).toLocaleString()}
          </p>
          {tree.isBalanced && <p className="balanced-note">This tree is balanced</p>}
        </div>
        <svg width={width} height={height}>
          {renderTreeNode(tree.root, width / 2, 50)}
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

      {!showPrevious ? (
        <div className="input-section">
          <form onSubmit={handleSubmit}>
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
            <button type="submit" disabled={loading}>
              {loading ? 'Processing...' : 'Generate Tree'}
            </button>
          </form>

          {error && <div className="error-message">{error}</div>}

          {currentTree && renderTree(currentTree)}
        </div>
      ) : (
        <div className="previous-trees-section">
          <h3>Previous Trees</h3>

          {loading ? (
            <div className="loading-spinner">Loading...</div>
          ) : previousTrees.length === 0 ? (
            <p className="no-data">No previous trees found</p>
          ) : (
            <>
              <div className="tree-list">
                {previousTrees.map((tree) => (
                  <div key={tree.id} className="tree-item" onClick={() => handleLoadTree(tree.id)}>
                    <div className="tree-item-details">
                      <p className="tree-numbers">{tree.numbers.join(', ')}</p>
                      <p className="tree-date">{new Date(tree.createdAt).toLocaleString()}</p>
                      {tree.isBalanced && <span className="balanced-badge">Balanced</span>}
                    </div>
                    <button
                      className="delete-button"
                      onClick={(e) => handleDeleteTree(tree.id, e)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>

              <div className="pagination-controls">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  Previous
                </button>
                <span>
                  Page {currentPage + 1} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BinarySearchTree;