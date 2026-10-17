import { setupCarImages } from './car-images.js?v=5';
import { DEFAULTS, LIMITS, EXAMPLES, CARS, CATALOGUE_SIZE, recommend } from './calculator.js?v=5';
import { recommendProducts, validAffiliateUrl } from './affiliates.js?v=5';
import { publicShare, saveShareCard } from './share.js?v=5';

const $=selector=>document.querySelector(selector);
const state={values:{...DEFAULTS},family:false,result:null,previous:null};
const format=n=>Math.round(n).toLocaleString('ko-KR');
const money=n=>`${format(n)}만 원`;
const preciseMoney=n=>`${n.toLocaleString('ko-KR',{minimumFractionDigits:1,maximumFractionDigits:1})}만 원`;
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let toastTimeout;
function readable(n){if(n===0)return '0원';if(n<10000)return money(n);const billion=Math.floor(n/10000),rest=Math.round(n%10000);return `${billion.toLocaleString('ko-KR')}억${rest?` ${format(rest)}만`:''} 원`;}
function refreshReadable(){for(const key of Object.keys(LIMITS)){const value=Number($(`#${key}`).value);$(`#${key}-readable`).textContent=Number.isFinite(value)&&value>=0?`${key==='expenses'?'매달 ':''}${readable(value)}`:'금액을 입력해주세요';}}
function collect(){for(const key of Object.keys(LIMITS)){const input=$(`#${key}`);if(!input.value.trim()||!input.checkValidity()){$('#form-error').textContent=`${{salary:'연봉',expenses:'월 지출',assets:'내 자산',parents:'부모님 자산'}[key]}에 0~${format(LIMITS[key])} 사이의 숫자를 입력해주세요.`;$('#form-error').hidden=false;input.focus();return false;}state.values[key]=Number(input.value);}$('#form-error').hidden=true;return true;}
function toast(message){clearTimeout(toastTimeout);$('#toast').textContent=message;$('#toast').classList.add('visible');toastTimeout=setTimeout(()=>$('#toast').classList.remove('visible'),3500);}
let disposeCarImages=()=>{};
function carImage(car){
 const sources=JSON.stringify([car.image,car.imageFallback].filter(Boolean));
 return `<div class="car-stage" data-image-state="loading" aria-busy="true"><img data-sources="${escape(sources)}" alt="${escape(car.name)} 외관 참고 이미지" width="720" height="400" loading="eager" decoding="async" referrerpolicy="no-referrer" style="visibility:hidden"><span class="image-loading">차량 사진을 불러오고 있어요</span><div class="image-fallback" hidden><strong>${escape(car.name)}</strong><p>사진 연결이 잠시 끊겼어요.</p><button type="button" class="image-retry">사진 다시 불러오기 ↻</button></div></div>`;
}
function productsBlock(r){const products=recommendProducts({power:r.best?.body?.includes('전기')?'electric':'gasoline'}).filter(p=>validAffiliateUrl(p.url));if(!products.length)return '';return `<section class="products"><h3>첫 차에 필요한 용품도 살펴보세요.</h3><p class="ad-disclosure">이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</p><div class="product-list">${products.map(p=>`<a href="${escape(p.url)}" target="_blank" rel="sponsored noopener noreferrer"><b>${escape(p.title)}</b><p>${escape(p.description)}</p><span>쿠팡에서 확인 ↗</span></a>`).join('')}</div></section>`;}
function budgetContext(r) {
 return `<div class="budget-context" aria-label="추천에 사용한 예산"><div><span>매달 차에 쓸 수 있는 돈</span><strong>${preciseMoney(r.monthlyLimit)}</strong></div><div><span>차 구입·유지에 쓸 자산</span><strong>${readable(r.upfront)}</strong></div></div><p class="budget-explanation">추정 월 수입 ${money(r.income)} − 지출 ${money(r.input.expenses)}${r.reserveTopup>0?` − 비상금 적립 ${preciseMoney(r.reserveTopup)}`:''}. 남는 돈의 35%를 월 차량 예산으로 잡았어요.${r.livingReserve>0?` 소득으로 부족한 5년치 생활비 ${readable(r.livingReserve)}는 자산에서 따로 남겼어요.`:''}</p>`;
}
function changeContext(r) {
 const before=state.previous;
 if(!before||before.family!==r.family)return '';
 const changes=Object.keys(LIMITS).filter(key=>before.input[key]!==r.input[key]);
 if(!changes.length)return '';
 const labels={salary:'연봉',expenses:'월 지출',assets:'내 자산',parents:'부모님 자산'};
 const sameCar=before.recommendations.map(c=>c.id).join(',')===r.recommendations.map(c=>c.id).join(',');
 return `<div class="change-note" role="status"><b>이전 입력과 비교</b><p>${changes.map(key=>`${labels[key]} ${readable(before.input[key])} → ${readable(r.input[key])}`).join(' · ')}</p><p>월 차량 예산 ${preciseMoney(before.monthlyLimit)} → <strong>${preciseMoney(r.monthlyLimit)}</strong> · 차에 쓸 자산 ${readable(before.upfront)} → ${readable(r.upfront)}</p><p>${sameCar?(r.best?'추천 3대는 같아요. 바뀐 예산도 같은 차종 구간에 들어갑니다.':'아직 등록된 차종의 구입·유지비가 예산을 넘어가요.'):'입력 변화에 맞춰 추천 후보를 다시 골랐어요.'}${changes.includes('parents')&&!r.family?' 부모님 자산은 ‘지원 가정’에서만 반영해요.':''}</p></div>`;
}
function recommendationCard(car,index,r) {
 const fit=car.affordable;
 return `<article class="recommendation-card ${fit?'fits':'over-budget'}" data-car="${escape(car.id)}" data-affordable="${fit}"><div class="recommendation-label"><span>0${index+1}</span><span>${fit?'예산 안':'예산 초과 · 비교용'}</span></div><h3>${escape(car.name)}</h3><p class="car-trim">${escape(car.trim)} · ${escape(car.body)}</p>${carImage(car)}<div class="card-image-note"><span>${escape(car.imageLabel)}</span><a href="${escape(car.source)}" target="_blank" rel="noopener noreferrer">출처 ↗</a>${car.imageFallbackSource?`<a href="${escape(car.imageFallbackSource)}" target="_blank" rel="noopener noreferrer">대체 사진 ↗</a>`:''}</div><div class="card-price"><span>비교용 차량가</span><b>${readable(car.price)}</b></div><div class="card-monthly"><span>할부 + 유지비 / 월</span><strong>${format(car.monthly)}<small>만 원</small></strong></div><p class="card-reason">${fit?(car.fromAssets>0?`이 중 월 ${preciseMoney(car.fromAssets)}은 미리 확보한 유지비 자금에서 써요.`:`생활비·차 비용${r.reserveTopup>0?'·비상금 적립':''}을 내고 월 ${money(car.left)}이 남아요.`):`현재 예산에 자금 ${money(car.fundingGap)}을 더해야 구입·유지 비용이 맞아요.`}</p><details class="card-breakdown"><summary>비용 내역 보기 <span>＋</span></summary><dl><div><dt>처음에 내는 구입비</dt><dd>${readable(car.down)}</dd></div><div><dt>월 할부</dt><dd>${money(car.payment)}</dd></div><div><dt>월 유지비 가정</dt><dd>${money(car.running)}</dd></div>${car.operatingReserve>0?`<div><dt>따로 남길 5년 유지비</dt><dd>${readable(car.operatingReserve)}</dd></div>`:''}</dl>${car.note?`<p>${escape(car.note)}</p>`:''}</details><a class="card-model-link" href="${escape(car.official)}" target="_blank" rel="noopener noreferrer">${car.trim.includes('중고')?'차종·중고차 확인':'모델·실제 견적 확인'}<span>↗</span></a></article>`;
}
function renderResults(scroll=false) {
 const r=recommend(state.values,state.family);state.result=r;
 const fits=r.recommendations.filter(car=>car.affordable).length;
 $('#input-mode-note').textContent=state.family?'부모님 지원 가정을 유지해 계산해요. 결과에서 바꿀 수 있어요.':'내 소득·자산만으로 계산해요.';
 const modes=`<div class="result-top"><button class="back-button" id="edit-inputs">← 금액 다시 입력</button><div class="mode-switch" role="group" aria-label="부모님 지원 가정 비교"><button data-mode="self" aria-pressed="${!state.family}">내 힘으로</button><button data-mode="family" aria-pressed="${state.family}">부모님 지원 가정</button></div></div>`;
 const familyNote=r.family?`<p class="family-note"><b>${readable(r.familySupport)}을 지원받는 가정</b>으로 비교 중이에요. 부모님 자산의 2%, 최대 1억 원이라는 임의 가정이며 실제 지원 약속이 아닙니다.${r.supportForProtection>0?` 이 중 ${readable(r.supportForProtection)}은 비상금·생활비로 먼저 남겼어요.`:''}</p>`:'';
 const title=fits===3?'내 조건에 맞는 차 3대.':fits>0?`예산에 맞는 ${fits}대와 다음 후보.`:'예산을 더 모으면 비교할 차 3대.';
 const explanation=fits===3?`${CATALOGUE_SIZE}개 차종에서 골랐어요. 같은 모델은 한 번만, 비슷한 예산에서 서로 다른 선택을 보여드려요.`:`현재 조건에 맞는 차는 ${fits}대예요. 나머지는 ‘예산 초과’로 구분했으니 필요한 추가자금을 확인해주세요.`;
 const reserveNote=r.reserveTopup>0?`<p class="reserve-note">현재 확보한 비상금 ${readable(r.reserveHeld)}. 목표까지 ${readable(r.reserveGap)} 부족해 매달 ${preciseMoney(r.reserveTopup)}씩 24개월간 적립하는 조건이에요.</p>`:'';
 const result=`<div class="recommendations-heading"><div><p class="eyebrow">${r.family?'부모님 지원 가정으로 비교했어요':'내 소득과 자산으로 비교했어요'}</p><h2 id="result-title" tabindex="-1">${title}</h2></div><button class="catalogue-button" data-open="catalogue-dialog">전체 ${CATALOGUE_SIZE}개 차종 ↗</button></div><p class="recommendations-explanation">${explanation}</p><div class="recommendations-grid">${r.recommendations.map((car,i)=>recommendationCard(car,i,r)).join('')}</div>${reserveNote}<p class="assumption-line">차량가·유지비·실수령액은 비교용 가정 · 60개월 / 연 6% 할부 · 실제 견적과 대출 승인 여부는 별도예요. 주문 제작 차량은 옵션·판매 조건에 따라 가격이 크게 달라져요. <button class="text-link" data-open="method-dialog">추천 기준</button></p>${fits?`<div class="share-actions"><button id="share-result">추천 ${fits}대 공유 ↗</button><button id="save-card">결과 카드 저장 ↓</button><p>금액과 예산 초과 차량은 공유에서 빠져요.</p></div>`:''}${productsBlock(r)}`;
 disposeCarImages();
 $('#results').innerHTML=modes+familyNote+budgetContext(r)+changeContext(r)+result;
 $('#landing').hidden=true;$('#results').hidden=false;
 $('#edit-inputs').addEventListener('click',editInputs);
 document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{state.family=button.dataset.mode==='family';state.previous=null;renderResults();}));
 $('#share-result')?.addEventListener('click',shareResult);
 $('#save-card')?.addEventListener('click',async event=>{const button=event.currentTarget;button.disabled=true;try{await saveShareCard(state.result);toast('결과 카드를 저장했어요.');}catch{toast('이미지를 저장하지 못했어요. 추천 차 공유를 이용해주세요.');}finally{button.disabled=false;}});
 disposeCarImages=setupCarImages($('#results'));if(scroll){$('#results').scrollIntoView({behavior:'smooth',block:'start'});$('#result-title').focus({preventScroll:true});}
}
function editInputs(){ $('#input-mode-note').textContent=state.family?'부모님 지원 가정을 유지해 계산해요. 결과에서 바꿀 수 있어요.':'내 소득·자산만으로 계산해요.'; $('#results').hidden=true;$('#landing').hidden=false;$('#calculator').scrollIntoView({behavior:'smooth',block:'start'});$('#salary').focus({preventScroll:true});}
async function shareResult(){const share=publicShare(state.result,location.href);const text=[share.text,share.url].filter(Boolean).join('\n');try{if(navigator.share){await navigator.share(share);return;}if(navigator.clipboard){await navigator.clipboard.writeText(text);toast('차 이름과 링크를 복사했어요.');return;}}catch(error){if(error.name==='AbortError')return;}let dialog=$('#share-fallback');if(!dialog){dialog=document.createElement('dialog');dialog.id='share-fallback';dialog.innerHTML='<div class="dialog-heading"><h2>추천 차 공유</h2><button class="close" aria-label="닫기">×</button></div><p>아래 내용을 복사해서 보내주세요.</p><textarea readonly aria-label="공유할 내용"></textarea>';document.body.append(dialog);}dialog.querySelector('textarea').value=text;dialog.showModal();dialog.querySelector('textarea').select();}
$('#car-form').addEventListener('submit',event=>{event.preventDefault();if(collect()){state.previous=state.result;renderResults(true);}});
$('#car-form').addEventListener('input',()=>{$('#form-error').hidden=true;refreshReadable();});
$('#catalogue-count').textContent=CATALOGUE_SIZE;
const modelGroups=[...new Set(CARS.map(c=>c.name))].map(name=>CARS.filter(c=>c.name===name));
$('#catalogue-list').innerHTML=modelGroups.map(group=>`<li><b>${escape(group[0].name)}</b><span>${readable(group[0].price)}${group.length>1?' ~ '+readable(group.at(-1).price):''}</span></li>`).join('');
$('#example-grid').innerHTML=EXAMPLES.map((example,i)=>`<button class="example" data-example="${example.id}"><span>EXAMPLE 0${i+1}</span><h3>${example.title}</h3><p>연봉 ${readable(example.salary)}<br>월 지출 ${money(example.expenses)} · 자산 ${readable(example.assets)}</p><small>이 조건으로 추천받기</small><span class="arrow" aria-hidden="true">↗</span></button>`).join('');
document.querySelectorAll('[data-example]').forEach(button=>button.addEventListener('click',()=>{const example=EXAMPLES.find(e=>e.id===button.dataset.example);for(const key of Object.keys(LIMITS))$(`#${key}`).value=example[key];refreshReadable();if(collect()){state.family=false;state.previous=null;renderResults(true);}}));
document.addEventListener('click',event=>{const opener=event.target.closest('[data-open]');if(opener)$(`#${opener.dataset.open}`)?.showModal();const close=event.target.closest('.close');if(close)close.closest('dialog').close();const nav=event.target.closest('a[href^="#"]');if(nav&&['#','#car-form','#examples'].includes(nav.getAttribute('href'))){$('#landing').hidden=false;$('#results').hidden=true;}});
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}}));
refreshReadable();
