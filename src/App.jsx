import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MedicaoOptica from './components/MedicaoOptica';
import ResultadoMedicao from './pages/ResultadoMedicao';

export function App() {
  return (
    <Router>
      <Routes>

        {/* Página de medição */}
        <Route path="/" element={<MedicaoOptica />} />

        {/* Página de resultado */}
        <Route path="/resultado" element={<ResultadoMedicao />} />
      </Routes>
    </Router>
  );
}


