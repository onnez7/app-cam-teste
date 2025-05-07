// 📁 src/helpers/validarAngulo.js
export function validarAngulo(landmarks) {
  const topo = landmarks[10];
  const queixo = landmarks[152];
  const inclinacao = Math.atan2(queixo.x - topo.x, queixo.y - topo.y) * (180 / Math.PI);
  return inclinacao;
}