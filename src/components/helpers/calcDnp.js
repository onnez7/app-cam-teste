// 📁 src/helpers/calcDnp.js
export function calcularDNP(landmarks, width) {
  const pupilaEsq = landmarks[33];
  const pupilaDir = landmarks[263];
  const meioNariz = (landmarks[1].x + landmarks[2].x) / 2;
  const fatorEscalaMM = 0.2646;

  const dnpOD = ((pupilaDir.x - meioNariz) * width * fatorEscalaMM).toFixed(2);
  const dnpOS = ((meioNariz - pupilaEsq.x) * width * fatorEscalaMM).toFixed(2);

  return {
    direita_mm: dnpOD,
    esquerda_mm: dnpOS,
  };
}