import React from 'react';

const SimpleMoleculeViewer = ({ modelData, selectedAtomIds = [], onChangeSelection, width = 400, height = 300 }) => {
  if (!modelData || !modelData.nodes || !modelData.links) {
    return null;
  }

  const { nodes, links } = modelData;
  
  // Calculate the bounds of the molecule
  const padding = 50;
  const viewBoxWidth = width - padding * 2;
  const viewBoxHeight = height - padding * 2;
  
  // Simple layout: position nodes in a rough circle or grid
  const layoutNodes = () => {
    return nodes.map((node, index) => {
      let x, y;
      
      if (nodes.length <= 6) {
        // Circular layout for small molecules
        const angle = (2 * Math.PI * index) / nodes.length;
        const radius = Math.min(viewBoxWidth, viewBoxHeight) / 4;
        x = viewBoxWidth / 2 + radius * Math.cos(angle);
        y = viewBoxHeight / 2 + radius * Math.sin(angle);
      } else {
        // Grid layout for larger molecules
        const cols = Math.ceil(Math.sqrt(nodes.length));
        const rows = Math.ceil(nodes.length / cols);
        const cellWidth = viewBoxWidth / cols;
        const cellHeight = viewBoxHeight / rows;
        
        const row = Math.floor(index / cols);
        const col = index % cols;
        
        x = (col + 0.5) * cellWidth;
        y = (row + 0.5) * cellHeight;
      }
      
      return {
        ...node,
        x: x + padding,
        y: y + padding
      };
    });
  };

  const positionedNodes = layoutNodes();
  
  const handleAtomClick = (nodeId) => {
    if (onChangeSelection) {
      const newSelection = selectedAtomIds.includes(nodeId)
        ? selectedAtomIds.filter(id => id !== nodeId)
        : [...selectedAtomIds, nodeId];
      onChangeSelection(newSelection);
    }
  };

  const getAtomColor = (atom) => {
    const colorMap = {
      'C': '#404040',
      'N': '#3050F8',
      'O': '#FF0D0D',
      'H': '#FFFFFF',
      'S': '#FFFF30',
      'P': '#FF8000',
      'F': '#90E050',
      'Cl': '#1FF01F',
      'Br': '#A62929',
      'I': '#940094',
    };
    return colorMap[atom] || '#FF69B4';
  };

  const getBondWidth = (bond) => {
    return bond === 2 ? 3 : bond === 3 ? 4 : 2;
  };

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="border border-gray-300 rounded-lg bg-white">
      {/* Render bonds first (so they appear behind atoms) */}
      {links.map((link) => {
        const sourceNode = positionedNodes.find(n => n.id === link.source);
        const targetNode = positionedNodes.find(n => n.id === link.target);
        
        if (!sourceNode || !targetNode) return null;
        
        return (
          <g key={link.id}>
            <line
              x1={sourceNode.x}
              y1={sourceNode.y}
              x2={targetNode.x}
              y2={targetNode.y}
              stroke="#333"
              strokeWidth={getBondWidth(link.bond)}
              strokeLinecap="round"
            />
            {/* Double bond */}
            {link.bond === 2 && (
              <line
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke="white"
                strokeWidth="1"
                strokeLinecap="round"
              />
            )}
          </g>
        );
      })}
      
      {/* Render atoms */}
      {positionedNodes.map((node) => {
        const isSelected = selectedAtomIds.includes(node.id);
        const atomColor = getAtomColor(node.atom);
        
        return (
          <g
            key={node.id}
            onClick={() => handleAtomClick(node.id)}
            style={{ cursor: 'pointer' }}
            className="hover:opacity-80"
          >
            {/* Atom circle */}
            <circle
              cx={node.x}
              cy={node.y}
              r={node.atom === 'H' ? 8 : 12}
              fill={atomColor}
              stroke={isSelected ? '#39f8ff' : '#333'}
              strokeWidth={isSelected ? 3 : 1}
            />
            
            {/* Atom label */}
            <text
              x={node.x}
              y={node.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="12"
              fontWeight="bold"
              fill={node.atom === 'H' || atomColor === '#FFFFFF' ? '#333' : 'white'}
              pointerEvents="none"
            >
              {node.atom}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default SimpleMoleculeViewer;
