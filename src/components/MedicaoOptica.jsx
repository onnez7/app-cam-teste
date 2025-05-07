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
  const [imagemCapturada, setImagemCapturada] = useState(null);
  const [modoResultado, setModoResultado] = useState(false);
  const [medidaCorreta, setMedidaCorreta] = useState({ dnpOD: '', dnpOE: '' });

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
        width: 480,
        height: 640,
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

      // Captura da imagem
      const imageData = canvas.toDataURL('image/png');

      setImagemCapturada(imageData);
      setDadosMedicao(dados);
      setCapturar(false);
      setModoResultado(true);
      setMensagem("Medição capturada com sucesso");

      const audio = new Audio('/snap.mp3');
      audio.play();
    }
  };

  const salvarMedicao = async () => {
    const { error } = await supabase.from('medicoes_opticas').insert([
      {
        ...dadosMedicao,
        imagem: imagemCapturada,
        medidaCorreta_od: medidaCorreta.dnpOD,
        medidaCorreta_oe: medidaCorreta.dnpOE,
      },
    ]);
    if (error) console.error('Erro ao salvar no Supabase:', error);
  };

  const reiniciar = () => {
    setDadosMedicao(null);
    setImagemCapturada(null);
    setModoResultado(false);
    setMensagem("Posicione-se de frente, com boa iluminação");
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-start p-2 bg-white">
      <h1 className="text-xl font-bold text-[#7A30A8] mt-2">Medição Óptica Visão+</h1>
      {!modoResultado && (
        <>
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/png"
            videoConstraints={{ facingMode: 'user' }}
            mirrored
            style={{ display: 'none' }}
          />
          <canvas
            ref={canvasRef}
            width={480}
            height={640}
            className="rounded-xl shadow border-2 border-[#FF7B30]"
          />
          <OverlayVisual mensagem={mensagem} />
          <button
            onClick={() => setCapturar(true)}
            className="mt-4 px-6 py-3 bg-[#7A30A8] text-white rounded-full text-sm shadow hover:bg-[#692391] transition-all"
          >
            Capturar Medição
          </button>
        </>
      )}

      {modoResultado && dadosMedicao && (
        <div className="w-full flex flex-col items-center animate-fade-in">
          <img src={imagemCapturada} alt="Captura" className="w-64 rounded-lg border mt-4" />
          <div className="text-sm mt-4 space-y-1">
            <p>DNP OD: {dadosMedicao.dnp.direita_mm} mm</p>
            <p>DNP OE: {dadosMedicao.dnp.esquerda_mm} mm</p>
            <p>Altura OD: {dadosMedicao.alturaCentro.direita_px} px</p>
            <p>Altura OE: {dadosMedicao.alturaCentro.esquerda_px} px</p>
            <p>Distância estimada: {dadosMedicao.distanciaEstimada_cm} cm</p>
          </div>

          <div className="mt-4 w-64">
            <label className="text-xs text-gray-600">DNP Correta OD:</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={medidaCorreta.dnpOD}
              onChange={(e) => setMedidaCorreta({ ...medidaCorreta, dnpOD: e.target.value })}
            />
            <label className="text-xs text-gray-600 mt-2 block">DNP Correta OE:</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={medidaCorreta.dnpOE}
              onChange={(e) => setMedidaCorreta({ ...medidaCorreta, dnpOE: e.target.value })}
            />
          </div>

          <div className="flex space-x-4 mt-4">
            <button
              onClick={salvarMedicao}
              className="px-4 py-2 bg-[#FF7B30] text-white rounded shadow"
            >
              Salvar Medição
            </button>
            <button
              onClick={reiniciar}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded"
            >
              Refazer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicaoOptica;