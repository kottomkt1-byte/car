function shareCars(result) {
 // Explicit allowlist; never share unaffordable comparison targets or raw inputs.
 return (result.recommendations || [result.best]).filter(car=>car?.affordable).slice(0,3).map(car=>({name:car.name,trim:car.trim}));
}
export function publicShare(result,url) {
 const cleanUrl=new URL(url);cleanUrl.search='';cleanUrl.hash='';
 const shareable=['https:','http:'].includes(cleanUrl.protocol)&&!['localhost','127.0.0.1','[::1]'].includes(cleanUrl.hostname);
 const cars=shareCars(result),mode='내 소득·자산 기준';
 return {title:`내 조건에 맞는 차 ${cars.length}대 | 차분히`,text:`${mode}으로 추천받은 차!\n${cars.length?cars.map((car,i)=>`${i+1}. ${car.name} (${car.trim})`).join('\n'):'현재 예산에 맞는 차종 없음'}\n너는 무슨 차 나와?`,...(shareable?{url:cleanUrl.href}:{})};
}
export function kakaoSharePayload(result,url) {
 const share=publicShare(result,url),cars=shareCars(result);
 if(!share.url||!cars.length)throw new Error('공유할 추천 차량과 사이트 주소가 필요해요.');
 const lines=cars.map((car,i)=>`${i+1}. ${car.name.length>42?car.name.slice(0,41)+'…':car.name}`);
 return {objectType:'text',text:`내 조건에 맞는 차 ${cars.length}대 🚗\n\n${lines.join('\n')}\n\n너는 무슨 차 나와?`,link:{webUrl:share.url,mobileWebUrl:share.url},buttonTitle:'나도 내 차 찾기'};
}
export async function saveShareCard(result) {
 await document.fonts.ready;
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;
 const c=canvas.getContext('2d');if(!c)throw new Error('이미지를 만들 수 없어요.');
 const cars=shareCars(result);
 c.fillStyle='#101113';c.fillRect(0,0,1080,1350);c.fillStyle='#ff633c';c.fillRect(70,70,10,48);
 c.font='bold 35px sans-serif';c.fillText('차분히 · 내 차 추천',105,108);
 c.fillStyle='#a6a8ae';c.font='28px sans-serif';c.fillText('내 소득과 자산으로',80,220);
 c.fillStyle='#fff';c.font='bold 56px sans-serif';c.fillText(`내 조건에 맞는 차 ${cars.length}대`,80,315);
 cars.forEach((car,i)=>{
  const y=445+i*230;c.fillStyle='#ff633c';c.font='bold 26px sans-serif';c.fillText(`0${i+1}`,80,y);
  let size=58;c.font=`bold ${size}px sans-serif`;while(c.measureText(car.name).width>850&&size>30)c.font=`bold ${--size}px sans-serif`;
  c.fillStyle='#fff';c.fillText(car.name,80,y+70);c.fillStyle='#a6a8ae';c.font='25px sans-serif';c.fillText(car.trim,80,y+120);
 });
 c.strokeStyle='#414247';c.lineWidth=2;c.beginPath();c.moveTo(80,1110);c.lineTo(1000,1110);c.stroke();
 c.fillStyle='#fff';c.font='bold 43px sans-serif';c.fillText('너는 무슨 차 나와?',80,1200);
 c.fillStyle='#a6a8ae';c.font='24px sans-serif';c.fillText('연봉 · 지출 · 내 자산',80,1270);
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('이미지를 만들 수 없어요.');
 const objectUrl=URL.createObjectURL(blob),a=document.createElement('a');a.href=objectUrl;a.download='차분히-내-추천-차-3대.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(objectUrl),3000);
}
