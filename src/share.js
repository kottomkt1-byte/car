export function publicShare(result, url) {
  // Allowlist: raw inputs and monetary values never enter share data.
  const cleanUrl = new URL(url); cleanUrl.search = ''; cleanUrl.hash = '';
  const shareable = ['https:', 'http:'].includes(cleanUrl.protocol) && !['localhost', '127.0.0.1', '[::1]'].includes(cleanUrl.hostname);
  const name = result.best?.name || '현재 예산에 맞는 차종 없음';
  const mode = result.family ? '부모님 지원 가정' : '내 소득·자산 기준';
  return {title:`내 추천 차는 ${name} | 차분히`,text:`내 형편에 맞는 차는 ${name}!\n${mode}으로 계산했어요.\n너는 아반떼? BMW? 포르쉐?`,...(shareable ? {url:cleanUrl.href} : {})};
}
export async function saveShareCard(result) {
  await document.fonts.ready;
  const canvas = document.createElement('canvas'); canvas.width=1080; canvas.height=1350;
  const c=canvas.getContext('2d'); if(!c) throw new Error('이미지를 만들 수 없어요.');
  c.fillStyle='#101113'; c.fillRect(0,0,1080,1350);
  c.fillStyle='#ff633c'; c.fillRect(70,70,10,48); c.font='bold 35px sans-serif'; c.fillText('차분히 · 내 차 추천',105,108);
  c.fillStyle='#a6a8ae';c.font='32px sans-serif';c.fillText(result.family?'부모님 지원을 받는다면':'내 소득과 자산으로',80,260);
  c.fillStyle='#fff';c.font='bold 55px sans-serif';c.fillText('내 추천 차는',80,365);
  c.fillStyle='#ff633c';c.font='bold 85px sans-serif';
  wrap(c,result.best?.name||'차종 없음',920).forEach((line,i)=>c.fillText(line,80,500+i*110));
  c.fillStyle='#a6a8ae';c.font='28px sans-serif';c.fillText(result.best?.trim||'지출과 비상금부터 확인하기',80,745);
  c.strokeStyle='#414247';c.lineWidth=2;c.beginPath();c.moveTo(80,850);c.lineTo(1000,850);c.stroke();
  c.fillStyle='#fff';c.font='bold 47px sans-serif';c.fillText('너는 무슨 차 나와?',80,990);
  c.fillStyle='#a6a8ae';c.font='29px sans-serif';c.fillText('연봉 · 지출 · 내 자산 · 부모님 자산',80,1075);
  c.font='25px sans-serif';c.fillText('숫자 4개로 내 차 찾기  ↗',80,1210);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('이미지를 만들 수 없어요.');
  const objectUrl=URL.createObjectURL(blob);const a=document.createElement('a');a.href=objectUrl;a.download='차분히-내-추천-차.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(objectUrl),3000);
}
function wrap(c,text,max){const lines=[];let line='';for(const word of text.split(' ')){const next=line?`${line} ${word}`:word;if(c.measureText(next).width>max&&line){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);return lines;}
