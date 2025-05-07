// 📁 src/components/MedicaoOptica.jsx
import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceMesh from '@mediapipe/face_mesh';
import * as cam from '@mediapipe/camera_utils';
import { createClient } from '@supabase/supabase-js';
import OverlayVisual from './OverlayVisual';
import { calcularDNP } from './helpers/calcDnp';
import { calcularAlturaCentro } from './helpers/calcAlturaCentro';
import { estimarDistancia } from './helpers/estimarDistancia';
import { validarAngulo } from './helpers/validarAngulo';

const supabase = createClient('https://SEU-PROJETO.supabase.co', 'CHAVE_PUBLICA_SUPABASE');

const MedicaoOptica = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [dadosMedicao, setDadosMedicao] = useState(null);
  const [mensagem, setMensagem] = useState("Posicione-se de frente, com boa iluminação");
  const [capturar, setCapturar] = useState(false);

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

    if (webcamRef.current?.video) {
      const camera = new cam.Camera(webcamRef.current.video, {
        onFrame: async () => {
          await faceMeshInstance.send({ image: webcamRef.current.video });
        },
        width: 640,
        height: 480,
      });
      camera.start();
    }
  }, [capturar]);

  const onResults = (results) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0 && capturar) {
      const landmarks = results.multiFaceLandmarks[0];

      const inclinacao = validarAngulo(landmarks);
      if (Math.abs(inclinacao) > 5) {
        setMensagem("Rosto inclinado. Por favor, alinhe-se");
        return;
      }

      const dnp = calcularDNP(landmarks, canvas.width);
      const alturaCentro = calcularAlturaCentro(landmarks, canvas.height);
      const distanciaCM = estimarDistancia(landmarks, canvas.width);

      const dados = {
        dnp,
        alturaCentro,
        inclinacao: inclinacao.toFixed(2),
        distanciaEstimada_cm: distanciaCM,
        timestamp: new Date().toISOString(),
      };

      setMensagem("Medição capturada com sucesso");
      setDadosMedicao(dados);
      setCapturar(false);
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
      <OverlayVisual mensagem={mensagem} />

      <button
        className="mt-4 px-4 py-2 bg-[#7A30A8] text-white rounded hover:bg-[#5c247c]"
        onClick={() => setCapturar(true)}
      >
        Capturar Medição
      </button>

      {dadosMedicao && (
        <div className="mt-4">
          <p>DNP OD: {dadosMedicao.dnp.direita_mm} mm</p>
          <p>DNP OE: {dadosMedicao.dnp.esquerda_mm} mm</p>
          <p>Altura OD: {dadosMedicao.alturaCentro.direita_px} px</p>
          <p>Altura OE: {dadosMedicao.alturaCentro.esquerda_px} px</p>
          <p>Distância estimada: {dadosMedicao.distanciaEstimada_cm} cm</p>
          <button className="mt-2 px-4 py-2 bg-[#FF7B30] text-white rounded" onClick={salvarMedicao}>
            Salvar Medição
          </button>
        </div>
      )}
    </div>
  );
};

export default MedicaoOptica;
