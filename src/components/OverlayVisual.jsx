// 📁 src/components/OverlayVisual.jsx
import React from 'react';

const OverlayVisual = ({ mensagem }) => {
  return (
    <div className="mt-2 text-[#7A30A8] font-medium animate-pulse">
      {mensagem}
    </div>
  );
};

export default OverlayVisual;