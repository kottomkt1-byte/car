export function publicShare(result, url) {
  // Deliberate allowlist: no salary, assets, parent information, price, or form state.
  const cleanUrl = new URL(url);
  cleanUrl.search = '';
  cleanUrl.hash = '';
  const shareable = ['https:', 'http:'].includes(cleanUrl.protocol) &&
    !['localhost', '127.0.0.1', '[::1]'].includes(cleanUrl.hostname);
  return {
    title: `차분히 | ${result.persona.short}`,
    text: `내 자동차 소비 유형은 “${result.persona.label}” 🚗\n드림카와 통장 사이, 너는 어떤 드라이버야?\n차분히에서 알아보기`,
    ...(shareable ? { url: cleanUrl.href } : {})
  };
}

export async function saveShareCard(result) {
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const c = canvas.getContext('2d');
  c.fillStyle = '#f5f3eb'; c.fillRect(0, 0, 1080, 1350);
  c.fillStyle = '#20251f'; c.fillRect(55, 55, 970, 1240);
  c.fillStyle = '#d4ef79'; c.font = 'bold 42px sans-serif'; c.fillText('차분히  /  MY GARAGE TYPE', 110, 145);
  c.fillStyle = '#ffffff'; c.font = 'bold 50px sans-serif'; c.fillText('나의 드라이버 유형은', 110, 270);
  c.font = '96px sans-serif'; c.fillText(result.persona.emoji, 110, 435);
  c.fillStyle = '#d4ef79'; c.font = 'bold 65px sans-serif';
  const lines = wrap(c, result.persona.label, 820);
  lines.forEach((line, i) => c.fillText(line, 110, 580 + i * 90));
  c.strokeStyle = '#5d665a'; c.lineWidth = 2; c.beginPath(); c.moveTo(110, 860); c.lineTo(970, 860); c.stroke();
  c.fillStyle = '#ffffff'; c.font = '38px sans-serif';
  c.fillText('드림카와 통장 사이,', 110, 960); c.fillText('너는 어떤 드라이버야?', 110, 1018);
  c.fillStyle = '#b9c1b6'; c.font = '28px sans-serif'; c.fillText('차분히 · 내 삶에 맞는 자동차 예산', 110, 1180);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('이미지 생성에 실패했어요.');
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = objectUrl; a.download = '차분히-나의-드라이버-유형.png';
  a.click(); setTimeout(() => URL.revokeObjectURL(objectUrl), 3000);
}

function wrap(c, text, max) {
  const lines = []; let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (c.measureText(next).width > max && line) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}
