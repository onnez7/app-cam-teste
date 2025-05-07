// 📁 src/pages/ResultadoMedicao.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ResultadoMedicao = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const dados = state?.dados;

  if (!dados) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-gray-600">Nenhuma medição encontrada.</p>
        <button
          onClick={() => navigate('/medir')}
          className="mt-4 px-4 py-2 bg-purple-700 text-white rounded"
        >
          Nova Medição
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 flex flex-col items-center text-gray-800">
      {/* Header */}
      <h1 className="text-2xl font-bold text-[#7A30A8] mb-1">VISÃO+</h1>
      <h2 className="text-lg font-semibold">Medição Óptica</h2>
      <p className="text-sm text-gray-500 mb-4">Obtenha medidas precisas para seus óculos usando nosso medidor</p>

      {/* Ações */}
      <div className="w-full flex justify-between items-center mb-3">
        <button
          onClick={() => navigate('/medir')}
          className="px-4 py-2 bg-[#7A30A8] text-white text-sm rounded"
        >
          Nova Medição
        </button>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-[#7A30A8] text-white text-sm rounded flex items-center"
        >
          <span className="mr-2">📄</span> Baixar PDF
        </button>
      </div>

      {/* Resultados */}
      <div className="w-full space-y-3">
        <div className="border rounded p-3">
          <h3 className="font-semibold">Distancia Naso-Pupilar (DNP)</h3>
          <p className="text-sm text-gray-500">Distância entre as pupilas</p>
          <div className="flex justify-between font-bold text-lg mt-2">
            <span>Olho direito<br />{dados.dnp.direita_mm} mm</span>
            <span>Olho esquerdo<br />{dados.dnp.esquerda_mm} mm</span>
          </div>
        </div>

        <div className="border rounded p-3">
          <h3 className="font-semibold">Altura de Montagem</h3>
          <p className="text-sm text-gray-500">Altura do centro óptico</p>
          <div className="flex justify-between font-bold text-lg mt-2">
            <span>Olho direito<br />{dados.alturaCentro.direita_px} mm</span>
            <span>Olho esquerdo<br />{dados.alturaCentro.esquerda_px} mm</span>
          </div>
        </div>

        <div className="border rounded p-3">
          <h3 className="font-semibold">Informações Adicionais</h3>
          <p className="text-sm text-gray-500">Outros parâmetros</p>
          <div className="text-sm mt-2">
            <p>Formato do Rosto: <span className="font-medium">Oval</span></p>
            <p>Inclinação: <span className="font-medium">{dados.inclinacao}°</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultadoMedicao;
