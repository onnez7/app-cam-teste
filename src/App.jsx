
import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceMesh from '@mediapipe/face_mesh';
import * as cam from '@mediapipe/camera_utils';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabase = createClient('https://SEU-PROJETO.supabase.co', 'CHAVE_PUBLICA_SUPABASE');

const MedicaoOptica = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [dadosMedicao, setDadosMedicao] = useState(null);

  useEffect(() => {
    const faceMeshInstance = new faceMesh.FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,

    });

    faceMeshInstance.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.9,
      minTrackingConfidence: 0.9,
    });

    faceMeshInstance.onResults(onResults);

    if (typeof webcamRef.current !== 'undefined' && webcamRef.current !== null) {
      const camera = new cam.Camera(webcamRef.current.video, {
        onFrame: async () => {
          await faceMeshInstance.send({ image: webcamRef.current.video });
        },
        width: 640,
        height: 480,
      });
      camera.start();
    }
  }, []);

  const onResults = (results) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];

      // Exemplo de cálculo da DNP entre os pontos das pupilas (33 e 263)
      const pupilaEsq = landmarks[33];
      const pupilaDir = landmarks[263];
      const dnp = Math.sqrt(
        Math.pow((pupilaDir.x - pupilaEsq.x) * canvas.width, 2) +
        Math.pow((pupilaDir.y - pupilaEsq.y) * canvas.height, 2)
      );

      const dados = {
        dnp_mm: (dnp * 0.2646).toFixed(2), // Supondo fator de escala aproximado
        alturaCentroOptico: ((landmarks[168].y + landmarks[8].y) / 2 * canvas.height).toFixed(2),
        timestamp: new Date().toISOString(),
      };

      setDadosMedicao(dados);
    }
  };

  const salvarMedicao = async () => {
    const { error } = await supabase.from('medicoes_opticas').insert([dadosMedicao]);
    if (error) console.error('Erro ao salvar no Supabase:', error);
  };

  return (
    <div className="p-4 text-center">
      <h1 className="text-2xl font-bold text-[#7A30A8]">Medição Óptica Visão+</h1>
      <Webcam ref={webcamRef} style={{ display: 'none' }} />
      <canvas ref={canvasRef} width={640} height={480} className="mx-auto border-2 border-[#FF7B30]" />
      {dadosMedicao && (
        <div className="mt-4">
          <p>DNP Estimada: {dadosMedicao.dnp_mm} mm</p>
          <p>Altura Centro Óptico: {dadosMedicao.alturaCentroOptico} px</p>
          <button
            className="mt-2 px-4 py-2 bg-[#FF7B30] text-white rounded"
            onClick={salvarMedicao}
          >
            Salvar Medição
          </button>
        </div>
      )}
    </div>
  );
};

export default MedicaoOptica