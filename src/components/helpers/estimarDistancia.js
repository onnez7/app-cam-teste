// 📁 src/helpers/estimarDistancia.js
export function estimarDistancia(landmarks, width) {
  const pontoEsq = landmarks[127];
  const pontoDir = landmarks[356];
  const larguraFace = (pontoDir.x - pontoEsq.x) * width;
  const calibracaoMM = 150; // média da largura da cabeça humana em mm
  return (calibracaoMM / larguraFace).toFixed(2);
}