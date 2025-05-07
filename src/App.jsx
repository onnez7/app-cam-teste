import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MedicaoOptica from './components/MedicaoOptica';
import ResultadoMedicao from './pages/ResultadoMedicao';

export function App() {
  return (
    <Router>
      <Routes>
        {/* Página padrão redireciona para medição */}
        <Route path="/" element={<Navigate to="/medir" replace />} />

        {/* Página de medição */}
        <Route path="/medir" element={<MedicaoOptica />} />

        {/* Página de resultado */}
        <Route path="/resultado" element={<ResultadoMedicao />} />
      </Routes>
    </Router>
  );
}


