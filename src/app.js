import { DEFAULTS, LIMITS, EXAMPLES, recommend } from './calculator.js?v=3';
import { recommendProducts, validAffiliateUrl } from './affiliates.js?v=3';
import { publicShare, saveShareCard } from './share.js?v=3';

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
function carImage(car){return `<div class="car-stage ${car.id==='911'?'showroom':''}">${car.image?`<img src="${escape(car.image)}" alt="${escape(car.name)} 대표 참고 이미지" loading="lazy" referrerpolicy="no-referrer">`:''}<div class="image-fallback" ${car.image?'hidden':''}><span>${escape(car.brand)}</span><strong>${escape(car.name)}</strong></div></div>`;}
function setupImageFallbacks(){document.querySelectorAll('.car-stage img').forEach(img=>{img.addEventListener('error',()=>{img.hidden=true;img.nextElementSibling.hidden=false;});if(img.complete&&img.naturalWidth===0){img.hidden=true;img.nextElementSibling.hidden=false;}});}
function productsBlock(r){const products=recommendProducts({power:r.best?.id==='macan'?'electric':'gasoline'}).filter(p=>validAffiliateUrl(p.url));if(!products.length)return '';return `<section class="products"><h3>첫 차에 필요한 용품도 살펴보세요.</h3><p class="ad-disclosure">이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</p><div class="product-list">${products.map(p=>`<a href="${escape(p.url)}" target="_blank" rel="sponsored noopener noreferrer"><b>${escape(p.title)}</b><p>${escape(p.description)}</p><span>쿠팡에서 확인 ↗</span></a>`).join('')}</div></section>`;}
function budgetContext(r) {
 return `<div class="budget-context" aria-label="추천에 사용한 예산"><div><span>매달 차에 쓸 수 있는 돈</span><strong>${preciseMoney(r.monthlyLimit)}</strong></div><div><span>차 구입·유지에 쓸 자산</span><strong>${readable(r.upfront)}</strong></div></div><p class="budget-explanation">추정 월 수입 ${money(r.income)} − 지출 ${money(r.input.expenses)}${r.reserveTopup>0?` − 비상금 적립 ${preciseMoney(r.reserveTopup)}`:''}. 남는 돈의 35%를 월 차량 예산으로 잡았어요.${r.livingReserve>0?` 소득으로 부족한 5년치 생활비 ${readable(r.livingReserve)}는 자산에서 따로 남겼어요.`:''}</p>`;
}
function changeContext(r) {
 const before=state.previous;
 if(!before||before.family!==r.family)return '';
 const changes=Object.keys(LIMITS).filter(key=>before.input[key]!==r.input[key]);
 if(!changes.length)return '';
 const labels={salary:'연봉',expenses:'월 지출',assets:'내 자산',parents:'부모님 자산'};
 const sameCar=before.best?.id===r.best?.id;
 return `<div class="change-note" role="status"><b>이전 입력과 비교</b><p>${changes.map(key=>`${labels[key]} ${readable(before.input[key])} → ${readable(r.input[key])}`).join(' · ')}</p><p>월 차량 예산 ${preciseMoney(before.monthlyLimit)} → <strong>${preciseMoney(r.monthlyLimit)}</strong> · 차에 쓸 자산 ${readable(before.upfront)} → ${readable(r.upfront)}</p><p>${sameCar?(r.best?'추천 차종은 같아요. 바뀐 예산도 같은 차종 구간에 들어갑니다.':'아직 등록된 차종의 구입·유지비가 예산을 넘어가요.'):`${escape(before.best?.name||'맞는 차종 없음')} → ${escape(r.best?.name||'맞는 차종 없음')}`}${changes.includes('parents')&&!r.family?' 부모님 자산은 ‘지원 가정’에서만 반영해요.':''}</p></div>`;
}
function renderResults(scroll=false) {
 const r=recommend(state.values,state.family);state.result=r;const car=r.best;
 $('#input-mode-note').textContent=state.family?'부모님 지원 가정을 유지해 계산해요. 결과에서 바꿀 수 있어요.':'내 소득·자산만으로 계산해요.';
 const modes=`<div class="result-top"><button class="back-button" id="edit-inputs">← 금액 다시 입력</button><div class="mode-switch" role="group" aria-label="부모님 지원 가정 비교"><button data-mode="self" aria-pressed="${!state.family}">내 힘으로</button><button data-mode="family" aria-pressed="${state.family}">부모님 지원 가정</button></div></div>`;
 const familyNote=r.family?`<p class="family-note"><b>${readable(r.familySupport)}을 지원받는 가정</b>으로 비교 중이에요. 부모님 자산의 2%, 최대 1억 원이라는 임의 가정이며 실제 지원 약속이 아닙니다.${r.supportForProtection>0?` 이 중 ${readable(r.supportForProtection)}은 비상금·생활비로 먼저 남겼어요.`:''}</p>`:'';
 let result='';
 if(car) {
  const assetFunding=car.fromAssets>0?`<p class="asset-funding">월 ${preciseMoney(car.fromAssets)}은 미리 남겨둔 유지비 자금에서 써요. 5년치 ${readable(car.operatingReserve)}을 구입비와 별도로 확보한 계산이에요.</p>`:'';
  const topupNote=r.reserveTopup>0?`<p class="reserve-note">비상금 목표까지 ${readable(r.reserveGap)} 부족해서, 앞으로 24개월간 매달 ${preciseMoney(r.reserveTopup)}씩 모으는 조건이에요.</p>`:'';
  result=`<div class="result-showroom"><div class="result-visual"><p class="eyebrow">${r.family?'지원금을 받는다면, 예산 안에 들어오는 차':'내 예산 안에 들어오는 차'}</p><h2 id="result-title" tabindex="-1">${escape(car.name)}</h2><p class="car-trim">${escape(car.trim)} <span> / ${escape(car.tier)}</span></p>${carImage(car)}<div class="image-caption"><span>${escape(car.note||'실제 디자인과 옵션은 제조사에서 확인해주세요.')}</span>${car.source?`<a href="${escape(car.source)}" target="_blank" rel="noopener noreferrer">이미지 출처 ↗</a>`:''}</div></div><div class="result-summary"><p class="eyebrow">할부 + 유지비, 한 달에 약</p><div class="monthly-price">${format(car.monthly)}<small>만 원</small></div><p class="payment-note">할부 ${money(car.payment)} + 유지비 ${money(car.running)}</p>${assetFunding}<p class="result-reason">${r.livingDrawdown>0?'생활비와 차 유지비를 자산에서 충당하는 5년 계획이에요.':`생활비·차 비용${r.reserveTopup>0?'·비상금 적립':''}을 내고<br>매달 약 <strong>${money(car.left)}</strong>이 남아요.`}</p><dl class="numbers"><div><dt>계산에 쓴 차량가</dt><dd>${readable(car.price)}</dd></div><div><dt>처음에 내는 구입비</dt><dd>${readable(car.down)}</dd></div><div><dt>현재 확보한 비상금</dt><dd>${readable(r.reserveHeld)}</dd></div></dl>${topupNote}<a href="${escape(car.official)}" target="_blank" rel="noopener noreferrer">${car.trim.includes('중고')?'중고차 알아보기':'공식 모델 보기'}<span>↗</span></a></div></div><p class="assumption-line">차량가·유지비·실수령액은 비교용 추정 · 60개월 / 연 6% 할부 가정 · 실제 대출 승인·구매 가능 여부를 보장하지 않아요. <button class="text-link" data-open="method-dialog">추천 기준</button></p><div class="share-actions"><button id="share-result">내 추천 차 공유 ↗</button><button id="save-card">결과 카드 저장 ↓</button><p>공유할 때 연봉과 자산 금액은 빠져요.</p></div>${r.alternatives.length?`<section class="alternatives"><h3>조금 덜 쓰고 싶다면, 이 차도 좋아요.</h3><p>차값과 월 유지비가 더 적게 드는 선택.</p><div class="alternative-grid">${r.alternatives.map(alt=>`<article class="alternative">${carImage(alt)}<div><h4>${escape(alt.name)}</h4><p class="trim">${escape(alt.trim)} · 가정 가격 ${money(alt.price)}</p><p class="alt-cost">월 약 <b>${money(alt.monthly)}</b></p></div><a href="${escape(alt.official)}" target="_blank" rel="noopener noreferrer">차종 알아보기 ↗</a></article>`).join('')}</div></section>`:''}${productsBlock(r)}`;
 } else {
  result=`<div class="empty-result"><div class="empty-symbol" aria-hidden="true">Ⅱ</div><h2 id="result-title" tabindex="-1">지금 예산에 맞는 차를<br>찾지 못했어요.</h2><p>등록된 차 중 가장 저렴한 ${escape(r.next.name)} 중고(${money(r.next.price)})를 구입·유지하려면, 현재 예산에 자금 ${money(r.next.fundingGap)}이 더 필요해요.</p><p>계산에 쓰인 ${r.assessed.length}개 가격·트림 기준이에요. 실제 중고 매물이나 견적에 따라 달라질 수 있어요.</p><button class="back-button" data-edit>입력 금액 다시 확인하기 ↗</button></div>`;
 }
 $('#results').innerHTML=modes+familyNote+budgetContext(r)+changeContext(r)+result;
 $('#landing').hidden=true;$('#results').hidden=false;
 $('#edit-inputs').addEventListener('click',editInputs);$('[data-edit]')?.addEventListener('click',editInputs);
 document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{state.family=button.dataset.mode==='family';state.previous=null;renderResults();}));
 $('#share-result')?.addEventListener('click',shareResult);
 $('#save-card')?.addEventListener('click',async event=>{const button=event.currentTarget;button.disabled=true;try{await saveShareCard(state.result);toast('결과 카드를 저장했어요.');}catch{toast('이미지를 저장하지 못했어요. 추천 차 공유를 이용해주세요.');}finally{button.disabled=false;}});
 setupImageFallbacks();if(scroll){$('#results').scrollIntoView({behavior:'smooth',block:'start'});$('#result-title').focus({preventScroll:true});}
}
function editInputs(){ $('#input-mode-note').textContent=state.family?'부모님 지원 가정을 유지해 계산해요. 결과에서 바꿀 수 있어요.':'내 소득·자산만으로 계산해요.'; $('#results').hidden=true;$('#landing').hidden=false;$('#calculator').scrollIntoView({behavior:'smooth',block:'start'});$('#salary').focus({preventScroll:true});}
async function shareResult(){const share=publicShare(state.result,location.href);const text=[share.text,share.url].filter(Boolean).join('\n');try{if(navigator.share){await navigator.share(share);return;}if(navigator.clipboard){await navigator.clipboard.writeText(text);toast('차 이름과 링크를 복사했어요.');return;}}catch(error){if(error.name==='AbortError')return;}let dialog=$('#share-fallback');if(!dialog){dialog=document.createElement('dialog');dialog.id='share-fallback';dialog.innerHTML='<div class="dialog-heading"><h2>추천 차 공유</h2><button class="close" aria-label="닫기">×</button></div><p>아래 내용을 복사해서 보내주세요.</p><textarea readonly aria-label="공유할 내용"></textarea>';document.body.append(dialog);}dialog.querySelector('textarea').value=text;dialog.showModal();dialog.querySelector('textarea').select();}
$('#car-form').addEventListener('submit',event=>{event.preventDefault();if(collect()){state.previous=state.result;renderResults(true);}});
$('#car-form').addEventListener('input',()=>{$('#form-error').hidden=true;refreshReadable();});
$('#example-grid').innerHTML=EXAMPLES.map((example,i)=>`<button class="example" data-example="${example.id}"><span>EXAMPLE 0${i+1}</span><h3>${example.title}</h3><p>연봉 ${readable(example.salary)}<br>월 지출 ${money(example.expenses)} · 자산 ${readable(example.assets)}</p><small>이 조건으로 추천받기</small><span class="arrow" aria-hidden="true">↗</span></button>`).join('');
document.querySelectorAll('[data-example]').forEach(button=>button.addEventListener('click',()=>{const example=EXAMPLES.find(e=>e.id===button.dataset.example);for(const key of Object.keys(LIMITS))$(`#${key}`).value=example[key];refreshReadable();if(collect()){state.family=false;state.previous=null;renderResults(true);}}));
document.addEventListener('click',event=>{const opener=event.target.closest('[data-open]');if(opener)$(`#${opener.dataset.open}`)?.showModal();const close=event.target.closest('.close');if(close)close.closest('dialog').close();const nav=event.target.closest('a[href^="#"]');if(nav&&['#','#car-form','#examples'].includes(nav.getAttribute('href'))){$('#landing').hidden=false;$('#results').hidden=true;}});
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}}));
refreshReadable();
