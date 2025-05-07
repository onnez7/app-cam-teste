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
import {
  FilesetResolver,
  FaceLandmarker,
} from '@mediapipe/tasks-vision';

// Instancia do Supabase
const supabase = createClient('https://pfjqttbdxwsvkmtnfwtr.supabase.co', 'CHAVE_PUBLICA_AQUI');

// Função auxiliar para converter base64 em arquivo
function dataURLtoFile(dataUrl, filename) {
  const arr = dataUrl.split(','), mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

const MedicaoOptica = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  // Estados principais
  const [dadosMedicao, setDadosMedicao] = useState(null);
  const [mensagem, setMensagem] = useState("Posicione-se de frente, com boa iluminação");
  const [capturar, setCapturar] = useState(false);
  const [imagemCapturada, setImagemCapturada] = useState(null);
  const [modoResultado, setModoResultado] = useState(false);
  const [medidaCorreta, setMedidaCorreta] = useState({ dnpOD: '', dnpOE: '' });

  // Inicialização da câmera + MediaPipe FaceMesh
  useEffect(() => {
    const faceMeshInstance = new faceMesh.FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMeshInstance.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.8, // ajustado para evitar falsos negativos
      minTrackingConfidence: 0.8,
    });

    faceMeshInstance.onResults(onResults);

    const iniciarCamera = () => {
      if (webcamRef.current && webcamRef.current.video.readyState === 4) {
        const camera = new cam.Camera(webcamRef.current.video, {
          onFrame: async () => {
            await faceMeshInstance.send({ image: webcamRef.current.video });
          },
          width: 480,
          height: 640,
        });
        camera.start();
      } else {
        setTimeout(iniciarCamera, 100);
      }
    };

    iniciarCamera();
  }, []);

  // Lógica ao receber resultado da MediaPipe
  const onResults = (results) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    // Só continua se o botão "capturar" foi clicado
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0 && capturar) {
      const landmarks = results.multiFaceLandmarks[0];

      const inclinacao = validarAngulo(landmarks);
      if (Math.abs(inclinacao) > 5) {
        setMensagem("Rosto inclinado. Por favor, alinhe-se");
        return;
      }

      // Cálculo das medidas
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

      // Captura da imagem e feedback
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

  // Envio para Supabase (imagem e dados)
  const salvarMedicao = async () => {
    try {
      const file = dataURLtoFile(imagemCapturada, 'captura.png');
      const { data, error: uploadError } = await supabase.storage
        .from('capturas')
        .upload(`medicao-${Date.now()}.png`, file, {
          contentType: 'image/png',
          upsert: true,
        });

      if (uploadError) console.error('Erro ao subir imagem:', uploadError);

      const urlImagem = data?.path
        ? `https://pfjqttbdxwsvkmtnfwtr.supabase.co/storage/v1/object/public/capturas/${data.path}`
        : imagemCapturada;

      const { error: dbError } = await supabase.from('medicoes_opticas').insert([
        {
          ...dadosMedicao,
          imagem: urlImagem,
          medidaCorreta_od: medidaCorreta.dnpOD,
          medidaCorreta_oe: medidaCorreta.dnpOE,
        },
      ]);

      if (dbError) console.error('Erro ao salvar no banco:', dbError);
    } catch (e) {
      console.error('Erro geral ao salvar:', e);
    }
  };

  // Reset da aplicação
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
          {/* Webcam oculta usada pela MediaPipe */}
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/png"
            videoConstraints={{
              facingMode: 'user',
              width: { ideal: 480 },
              height: { ideal: 640 },
            }}
            mirrored
            style={{ display: 'none' }}
          />

          {/* Canvas visível para desenhar resultados */}
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

      {/* Tela de resultado final */}
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