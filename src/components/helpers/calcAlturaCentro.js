// 📁 src/helpers/calcAlturaCentro.js
export function calcularAlturaCentro(landmarks, height) {
  const pupilaEsq = landmarks[33];
  const pupilaDir = landmarks[263];
  const armaçãoY = (landmarks[234].y + landmarks[454].y) / 2;

  const alturaOD = ((pupilaDir.y - armaçãoY) * height).toFixed(2);
  const alturaOS = ((pupilaEsq.y - armaçãoY) * height).toFixed(2);

  return {
    direita_px: alturaOD,
    esquerda_px: alturaOS,
  };
}