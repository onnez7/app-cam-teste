// 📁 src/components/MedicaoOptica.jsx
import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import * as faceMesh from '@mediapipe/face_mesh';
import * as cam from '@mediapipe/camera_utils';
import { supabase } from '../lib/supabase';
import OverlayVisual from './OverlayVisual';
import { calcularDNP } from './helpers/calcDnp';
import { calcularAlturaCentro } from './helpers/calcAlturaCentro';
import { estimarDistancia } from './helpers/estimarDistancia';
import { validarAngulo } from './helpers/validarAngulo';

function dataURLtoFile(dataUrl, filename) {
  const arr = dataUrl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

const MedicaoOptica = () => {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [mensagem, setMensagem] = useState("Posicione-se de frente, com boa iluminação");
  const [capturar, setCapturar] = useState(false);

  useEffect(() => {
    const faceMeshInstance = new faceMesh.FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`,
    });

    faceMeshInstance.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.8,
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

      const imageData = canvas.toDataURL('image/png');

      const audio = new Audio('/snap.mp3');
      audio.play();

      navigate('/resultado', { state: { dados, imagem: imageData } });
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-start p-2 bg-white">
      <h1 className="text-xl font-bold text-[#7A30A8] mt-2">Medição Óptica Visão+</h1>

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
    </div>
  );
};

export default MedicaoOptica;