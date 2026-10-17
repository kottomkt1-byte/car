import { DEFAULTS, NUMERIC_LIMITS, PRESETS, calculate, analyzeCar } from './calculator.js';
import { recommendProducts, validAffiliateUrl } from './affiliates.js';
import { publicShare, saveShareCard } from './share.js';

const $ = selector => document.querySelector(selector);
const state = { values: { ...DEFAULTS }, step: 0, result: null, comparison: 2500, edited: false };
const format = value => Number(value).toLocaleString('ko-KR', { maximumFractionDigits: 1 });
const money = value => `${format(Math.round(value * 10) / 10)}만 원`;
const rounded = value => `${Math.floor(value / 10) * 10 >= 10 ? format(Math.floor(value / 10) * 10) : format(Math.floor(value))}`;
const signedMoney = value => value < 0 ? `−${money(Math.abs(value))}` : money(value);
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
let toastTimeout;

function field(key, label, unit = '만 원', hint = '', wide = false, step = 'any') {
  const [min, max] = NUMERIC_LIMITS[key];
  return `<div class="field ${wide ? 'wide' : ''}"><label class="field-label" for="${key}">${label}</label><div class="input-wrap"><input id="${key}" name="${key}" type="number" inputmode="decimal" min="${min}" max="${max}" step="${step}" value="${state.values[key]}" aria-describedby="${key}-hint" required><span class="unit">${unit}</span></div><p id="${key}-hint" class="field-hint">${hint}</p></div>`;
}
function select(key, label, options, hint = '', wide = false) {
  return `<div class="field ${wide ? 'wide' : ''}"><label class="field-label" for="${key}">${label}</label><div class="input-wrap"><select id="${key}" name="${key}" aria-describedby="${key}-hint">${options.map(([value, text]) => `<option value="${value}" ${String(state.values[key]) === String(value) ? 'selected' : ''}>${text}</option>`).join('')}</select></div><p id="${key}-hint" class="field-hint">${hint}</p></div>`;
}
function check(key, label, hint = '') {
  return `<label class="check-field"><input type="checkbox" name="${key}" ${state.values[key] ? 'checked' : ''}><span>${label}${hint ? `<p>${hint}</p>` : ''}</span></label>`;
}
const divider = text => `<div class="field-divider">${text}</div>`;
const details = (title, content) => `<details class="input-details"><summary>${title}</summary><div class="fields">${content}</div></details>`;
const titles = [
  ['월급 다음, 남는 여유는?', '매달 반복되는 수입과 지출부터 알아볼게요.'],
  ['차에 쓸 수 있는 돈은 얼마인가요?', '내 자산과 가족의 지원을 구분해서 계산해요.'],
  ['마음속에 주차해 둔 차가 있나요?', '정확한 견적이 없다면 생각 중인 가격을 넣어주세요.'],
  ['차를 산 뒤의 일상도 그려볼게요.', '자주 가는 길, 주차하는 곳, 예상 유지비까지.']
];

function renderStep() {
  const p = state.values;
  const [title, subtitle] = titles[state.step];
  let content = '';
  if (state.step === 0) {
    content = `<div class="fields">${select('incomeMode', '수입 계산 방법', [['net', '실수령액 직접 입력'], ['gross', '연봉으로 간편 추정']], '급여명세서의 실제 월 수령액을 권장해요.', true)}
      ${field('annualSalary', '세전 연봉', '만 원 / 년', p.incomeMode === 'net' ? '직접 입력 모드에서는 참고 정보예요.' : '상여금은 안정적으로 받는 금액만.')}
      ${p.incomeMode === 'net' ? field('netMonthly', '월 실수령액', '만 원 / 월', '세금·보험료를 뺀 실제 수입.') : field('netRate', '예상 실수령 비율', '%', '예시 82%. 세법에 따른 자동 계산이 아니에요.')}
      ${field('otherIncome', '안정적인 추가 수입', '만 원 / 월', '불규칙한 수입은 보수적으로 넣어주세요.')}
      ${field('saving', '꼭 지킬 월 저축액', '만 원 / 월', '차를 사도 계속하고 싶은 저축·투자.')}
      ${divider('현재 차·대중교통 비용은 빼고 입력해주세요')}
      ${field('living', '생활비', '만 원 / 월', '식비, 통신비, 쇼핑, 여가 등.')}
      ${field('housing', '주거비', '만 원 / 월', '월세와 관리비. 대출 상환은 아래에.')}
      ${field('debtPayment', '기존 부채 월 상환액', '만 원 / 월', '원금+이자. 매각할 차의 대출은 제외.')}
      ${field('familyExpense', '부양·육아 등 추가 지출', '만 원 / 월', '위 생활비와 중복 없이 넣어주세요.')}</div>`;
  } else if (state.step === 1) {
    content = `<div class="fields">${field('cash', '현금·예금', '만 원', '바로 사용할 수 있는 자금.')}
      ${field('investments', '주식·펀드 등 금융자산', '만 원', '평가금액 기준. 연금 등 인출 불가 자산 제외.')}
      ${field('protectedSavings', '건드리지 않을 목표자금', '만 원', '집, 결혼, 교육 등. 비상금과 별도.')}
      ${select('reserveMonths', '남겨둘 생활비 비상금', [[3, '3개월'], [6, '6개월'], [9, '9개월'], [12, '12개월']], '생활·주거·부채·가족 지출의 합계 기준.')}
      ${field('investmentUse', '금융자산 현금화 비율', '%', '매도 비용·세금을 고려한 사용 가능 비율.')}
      ${field('assetUse', '남은 자금 중 차량 투입 비율', '%', '비상금·목표자금을 남긴 후 적용해요.')}
      ${divider('가족의 자산과 실제 지원은 별개예요')}
      ${field('parentAssets', '부모님 총자산 · 선택', '만 원', '모르면 0. 예산에는 합산하지 않아요.')}
      ${field('familySupport', '실제 받을 차량 지원금', '만 원', '증여 관련 비용 등을 뺀 순수 지원금.')}
      ${check('supportConfirmed', '이 지원금은 실제로 받기로 확정했어요.', '체크한 경우에만 차량 구매 예산에 더해요.')}</div>
      ${details('순자산과 기존 차량 정보도 넣을게요', `${field('realEstate', '내 부동산·임차보증금 등', '만 원', '순자산에만 반영. 차 구매 자금에서는 제외.')}${field('debtBalance', '기존 부채 잔액', '만 원', '주택·신용대출 등. 아래 기존 차 대출 제외.')}${field('tradeIn', '기존 차 예상 매각가', '만 원')}${field('tradeInLoan', '매각 시 갚을 기존 차 대출', '만 원', '매각가에서 차감해 초기자금에 반영해요.')}`)}`;
  } else if (state.step === 2) {
    content = `<div class="step-info">차종보다 먼저 가격을 맞춰봐요. 옵션을 포함한 실제 견적을 넣으면 더 유용해요.</div><div class="fields">
      ${field('dreamPrice', '드림카 차량 가격', '만 원', '취득·등록비 제외. 할인·보조금을 뺀 차량 가격.', true)}
      ${select('term', '할부 기간', [[0, '일시불'], [24, '24개월'], [36, '36개월'], [48, '48개월'], [60, '60개월'], [72, '72개월'], [84, '84개월']], '원리금균등상환 가정. 초기자금은 자동 반영.')}
      ${field('apr', '할부 연 이자율', '%', p.term === 0 ? '일시불 선택 시 이자는 적용하지 않아요.' : '예시 금리예요. 실제 금융사 견적을 확인하세요.')}
      ${field('acquisitionRate', '취득 관련 비용률', '%', '차량 가격에 적용할 예시 비율. 차종·감면에 맞게 수정.')}
      ${field('registration', '그 밖의 등록 부대비용', '만 원', '공채 할인·등록 수수료 등 실제 부담액.')}
      ${field('ownershipYears', '예상 보유기간', '년', '얼마나 오래 함께할 예정인가요?', false, '1')}
      ${field('residualPercent', '보유기간 뒤 예상 잔존가치', '%', '구입가 대비 중고 매각가 가정. 시세 예측은 아니에요.')}</div>`;
  } else {
    const electric = p.power === 'electric';
    content = `<div class="fields">${select('power', '동력 종류', [['gasoline', '가솔린 / 디젤'], ['hybrid', '하이브리드'], ['electric', '전기']], '종류 변경 시 연비·에너지 단가 예시도 바뀌어요.')}
      ${field('annualKm', '연간 주행거리', 'km', '출퇴근 + 주말 이동을 모두 포함.')}
      ${field('efficiency', electric ? '예상 전비' : '예상 실연비', electric ? 'km/kWh' : 'km/L', '공인 수치보다 내 운전 환경에 맞게.')}
      ${field('energyPrice', electric ? '평균 충전 단가' : '평균 유류 단가', electric ? '원/kWh' : '원/L', '현재 가격이 아닌 수정 가능한 예시 값이에요.')}
      ${field('insurance', '자동차 보험료', '만 원 / 년', '운전자 조건에 따른 실제 견적을 권장해요.')}
      ${field('vehicleTax', '자동차세', '만 원 / 년', '차종·배기량·차령 등에 맞게 수정.')}
      ${field('parking', '주차비', '만 원 / 월', '집과 직장의 주차비를 합쳐주세요.')}
      ${field('toll', '통행료 등', '만 원 / 월')}
      ${field('maintenance', '정비·소모품 적립', '만 원 / 년', '타이어, 오일, 점검, 예상 수리비.')}
      ${field('transport', '비교할 대중교통·택시비', '만 원 / 월', '별도 비교용. 차량 예산에서 추가 차감하지 않아요.')}</div>
      ${details('내 기준과 라이프스타일 조정', `${field('incomeCap', '소득 중 월 차량 지출 한도', '%', '서비스 기본값 20%. 나의 계획에 맞게 조정해요.', true)}${check('hasChildren', '아이와 함께 탈 예정이에요.')}${check('outdoor', '캠핑·여행 등 주말 야외활동을 좋아해요.')}`)}`;
  }
  $('#step-content').innerHTML = `<div class="step-title"><div><h3 tabindex="-1">${title}</h3><p>${subtitle}</p></div><span aria-hidden="true">0${state.step + 1}</span></div>${content}`;
  document.querySelectorAll('.step-button').forEach((button, index) => {
    button.classList.toggle('active', index === state.step);
    if (index === state.step) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
  });
  $('#step-count').textContent = `${state.step + 1} / 4`;
  $('#previous-step').disabled = state.step === 0;
  $('#next-step').innerHTML = `${['자산 살펴보기', '드림카 만나보기', '유지비 알아보기', '내 차고 열기'][state.step]} <span aria-hidden="true">${state.step === 3 ? '↗' : '→'}</span>`;
  $('#form-error').hidden = true;
}

function row(label, value, className = '') { return `<div class="metric-row"><span>${label}</span><b class="${className}">${value}</b></div>`; }
function renderLive() {
  const r = calculate(state.values);
  $('#live-price').innerHTML = `${rounded(r.safePrice)} <small>만 원</small>`;
  $('#live-metrics').innerHTML = row('월 가용 소득', signedMoney(r.freeCash)) + row('차량 초기자금', money(r.upfront)) + row('예상 월 유지비', money(r.operating));
  $('#live-insight').innerHTML = r.safePrice > 0 ? `비상금·목표자금 <b>${money(r.reserve)}</b>을 남겨두고, 매달 차량에 최대 <b>${money(r.safeMonthly)}</b>을 쓸 수 있는 계획이에요.` : r.reserveShortfall > 0 ? `설정한 비상금·목표자금까지 <b>${money(r.reserveShortfall)}</b>이 부족해요. 예산보다 안전자금 확보를 먼저 확인해주세요.` : `지금 가정으로는 <b>구매를 잠시 보류</b>하는 편이 좋아 보여요. 생활비와 저축, 유지비부터 조정해 보세요.`;
}

function validateStep() {
  const invalid = [...$('#budget-form').querySelectorAll('input,select')].find(input => !input.checkValidity());
  if (!invalid) { $('#form-error').hidden = true; return true; }
  const label = document.querySelector(`label[for="${invalid.id}"]`)?.textContent || '입력값';
  $('#form-error').textContent = `${label}: ${invalid.min || 0}~${Number(invalid.max || 1000000).toLocaleString('ko-KR')} 범위의 숫자를 입력해주세요.`;
  $('#form-error').hidden = false;
  invalid.closest('details')?.setAttribute('open', '');
  invalid.focus(); return false;
}

function moveStep(next) {
  if (!validateStep()) return;
  state.step = next; renderStep();
  $('#step-content h3').focus({ preventScroll: true });
  $('#calculator').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderResults(scroll = false) {
  const r = calculate(state.values); state.result = r;
  const p = r.p; const d = r.dream;
  const status = { safe: '여유 있는 선택', tight: '조금 빠듯한 선택', over: '예산 재검토', hold: '차량 가격을 입력해주세요' }[d.status];
  const breakdown = [
    ['월 할부금', d.installment, '#d5e8a1'], ['연료·충전비', r.energy, '#90a588'],
    ['보험료', p.insurance / 12, '#6d8790'], ['주차·통행료', p.parking + p.toll, '#a3977b'],
    ['세금·정비 적립', (p.vehicleTax + p.maintenance) / 12, '#7e7c8e']
  ];
  const hasAffiliate = recommendProducts(p).some(product => validAffiliateUrl(product.url));
  const productIcons = { phone: '▣', spark: '✧', shield: '◇', box: '▤', mountain: '△', bolt: 'ϟ' };
  const scenario = `<div class="scenario-actions"><button type="button" data-scenario="cheaper">차값 500만 원 낮추면?</button><button type="button" data-scenario="shorter" ${p.term <= 24 ? 'disabled' : ''}>할부를 12개월 줄이면?</button><button type="button" data-scenario="independent" ${!p.supportConfirmed || p.familySupport === 0 ? 'disabled' : ''}>가족 지원 없이 보면?</button><button type="button" id="edit-result">입력 다시 살펴보기 ↗</button></div>`;
  $('#results').innerHTML = `
    <div class="section-heading"><div><div class="eyebrow">YOUR NEXT CHAPTER</div><h2 id="result-title" tabindex="-1">차보다 먼저, 당신의 일상.</h2></div><p>${state.edited ? '입력한 조건을 바탕으로 계산했어요.' : '예시 입력값의 결과예요.'}<br>한 가지 정답보다, 나에게 맞는 선택.</p></div>
    <div class="result-hero"><div class="result-persona"><div class="eyebrow">MY GARAGE TYPE · ${state.edited ? '나의 결과' : '예시 결과'}</div><div class="persona-icon" aria-hidden="true">${r.persona.emoji}</div><h2>${r.persona.label}</h2><p>${r.persona.message}</p></div><div class="result-budget"><span>일상을 지키는 차량 가격 상한</span><strong>${rounded(r.safePrice)} <small>만 원</small></strong><p>취득·등록비와 월 유지비까지 고려한 계획 예산</p><p>가족 지원 없이 계산하면 <b>${rounded(r.independentPrice)}만 원</b></p></div></div>
    <div class="result-actions"><button type="button" class="button primary" id="share-result">내 유형 공유 ↗</button><button type="button" class="button secondary" id="save-card">유형 카드 저장 ↓</button><button type="button" class="button secondary" id="print-result">상세 결과 인쇄</button></div>
    <p class="share-note">공유 링크와 유형 카드에는 연봉·자산·부모님 정보·금액이 포함되지 않아요. 인쇄물에는 상세 결과가 포함돼요.</p>
    <div class="result-grid"><article class="result-card good"><small>입력한 드림카 ${money(p.dreamPrice)}</small><strong class="${d.status === 'over' ? 'danger-text' : ''}">${status}</strong><p>${d.cashNeeded > 0 ? `구매 시 추가 현금 ${money(d.cashNeeded)} 필요` : `차량 지출은 월 소득의 ${format(d.ratio)}%`}</p></article><article class="result-card"><small>드림카 월 현금 지출</small><strong>${money(d.monthly)}</strong><p>할부 + 보험 + 연료 + 세금·정비 + 주차</p></article><article class="result-card"><small>차량 지출 후 남는 월 여유</small><strong class="${d.remainder < 0 ? 'danger-text' : 'accent-text'}">${signedMoney(d.remainder)}</strong><p>설정한 월 저축 ${money(p.saving)}도 지킨 뒤</p></article></div>
    <div class="results-block"><div class="block-heading"><h3>사고 난 뒤, 진짜 들어가는 돈.</h3><span>금액 단위: 만 원</span></div><div class="cost-layout">
      <article class="cost-panel"><p>01 / 매달 통장에서 나가는 돈</p><div class="cost-bars" aria-hidden="true">${breakdown.map(([, value, color]) => `<span style="--bar:${color};flex:${Math.max(0, value)}"></span>`).join('')}</div>${breakdown.map(([label, value, color]) => row(`<span class="cost-key"><i style="--bar:${color}"></i>${label}</span>`, money(p.dreamPrice > 0 ? value : 0))).join('')}${row('월 합계', money(d.monthly))}</article>
      <article class="cost-panel"><p>02 / ${p.ownershipYears}년간 소유하는 데 드는 비용</p>${row('예상 감가상각', money(d.price - d.residual))}${row('취득·등록 비용', money(d.acquisition))}${row('보유기간에 발생하는 이자', money(d.interestDuringOwnership))}${row('보유기간 유지비 합계', money(p.dreamPrice > 0 ? r.operating * p.ownershipYears * 12 : 0))}${row('총 보유비용', money(d.totalOwnership))}<p class="tiny">월평균 경제적 비용 ${money(d.economicMonthly)}. 원금과 감가상각은 중복 합산하지 않아요.</p></article></div>
      <div class="stress-box"><div><h4>만약 수입이 20% 줄고, 금리가 2%p 오른다면?</h4><p>같은 대출액을 높아진 금리로 다시 계산한 가상 상황이에요. 고정금리 계약의 실제 금리 변경을 뜻하지 않아요.</p></div><strong class="${r.stressRemainder < 0 ? 'danger-text' : 'accent-text'}">월 ${signedMoney(r.stressRemainder)}</strong></div>${scenario}</div>
    <div class="results-block"><div class="block-heading"><h3>가격을 바꾸면, 일상도 달라져요.</h3><span>차종·시세 추천이 아닌 가격 비교</span></div><div id="comparison-table"></div><form id="compare-form" class="compare-controls"><label for="compare-price">다른 차량 가격</label><input id="compare-price" type="number" min="1" max="1000000" step="any" value="${state.comparison}" required inputmode="decimal"><span>만 원</span><button class="button secondary" type="submit">비교하기</button></form><p class="tiny" style="margin-top:10px">비교 차량은 같은 유지비·금리·잔존가치 가정을 사용해요. 차종이 바뀌면 입력값도 수정해주세요.</p></div>
    <div class="results-block"><div class="block-heading"><h3>내 예산의 뒷이야기.</h3></div><div class="cost-layout"><article class="cost-panel">${row('내 순자산 (기존 차량 포함)', signedMoney(r.netWorth))}${row('남겨두는 비상금·목표자금', money(r.reserve))}${row('자기자금 중 차량에 투입', money(r.selfCash))}${row('확정된 가족 지원금', money(r.support))}${row('기존 차량 순매각액', signedMoney(r.tradeEquity))}${row('총 초기자금', money(r.upfront))}</article><article class="cost-panel">${row('드림카 취득 총액', money(d.totalPurchase))}${row('드림카 대출 원금', money(d.loan))}${row('할부 전체기간 총이자', money(d.totalInterest))}${row(`${p.ownershipYears}년 뒤 남은 대출`, money(d.remainingLoan))}${row('예상 매각가 − 남은 대출', signedMoney(d.residual - d.remainingLoan))}${row('드림카 월 경제비용 − 대중교통비', signedMoney(d.economicMonthly - p.transport))}<p class="tiny">마지막 비교는 소유비용의 월평균이에요. 시간·편의의 가치는 포함하지 않아요.</p></article></div><p class="tiny" style="margin-top:13px">여유 예산 ${money(r.safePrice)} / 빠듯한 상한선 ${money(r.stretchPrice)}. 상한선까지 소비하라는 뜻은 아니에요. 가족 지원은 순수 수령액으로 입력하고, 증여 관련 비용은 별도로 확인해주세요.</p></div>
    ${r.warnings.length ? `<aside class="warning-list"><h3>결정 전에 한 번 더 살펴볼 것</h3><ul>${r.warnings.map(warning => `<li>${escape(warning)}</li>`).join('')}</ul></aside>` : ''}
    <section class="affiliate-section" aria-labelledby="products-title"><div class="affiliate-label">${hasAffiliate ? '광고 · COUPANG PARTNERS' : 'FOR YOUR EVERYDAY DRIVE'}</div><h3 id="products-title">차를 골랐다면, 작은 준비부터.</h3><p>당신의 주행 생활에 맞는 용품 체크리스트. 꼭 필요한 것만 천천히 준비해요.</p>${hasAffiliate ? '<p class="affiliate-disclosure">이 페이지는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</p>' : ''}<div class="products">${recommendProducts(p).map(product => `<article class="product"><div class="product-icon" aria-hidden="true">${productIcons[product.icon]}</div><small>${product.category}</small><h4>${product.title}</h4><p>${product.description}</p>${validAffiliateUrl(product.url) ? `<a href="${escape(product.url)}" target="_blank" rel="sponsored noopener noreferrer" data-product="${product.id}">쿠팡에서 비교하기 <span>↗</span></a>` : '<span class="unavailable">구매 전 규격과 호환성을 확인하세요</span>'}</article>`).join('')}</div><div class="spending-note">용품 구입비는 위 계산에 포함되지 않아요. 예산이 빠듯하면 구매를 미뤄도 괜찮아요.</div></section>
  `;
  $('#results').hidden = false; renderComparison();
  $('#compare-form').addEventListener('submit', event => {
    event.preventDefault(); const input = $('#compare-price');
    if (!input.checkValidity()) return input.reportValidity();
    state.comparison = Number(input.value); renderComparison(); toast('새 가격으로 비교했어요.');
  });
  $('#share-result').addEventListener('click', shareResult);
  $('#save-card').addEventListener('click', async () => {
    try { await saveShareCard(state.result); toast('금액 없는 유형 카드를 저장했어요.'); } catch { toast('이미지 저장을 지원하지 않는 환경이에요. 유형 공유를 이용해주세요.'); }
  });
  $('#print-result').addEventListener('click', () => window.print());
  $('#edit-result').addEventListener('click', () => { $('#calculator').scrollIntoView({ behavior: 'smooth' }); $('#step-content h3').focus({ preventScroll: true }); });
  document.querySelectorAll('[data-scenario]').forEach(button => button.addEventListener('click', () => {
    const type = button.dataset.scenario;
    if (type === 'cheaper') state.values.dreamPrice = Math.max(0, state.values.dreamPrice - 500);
    if (type === 'shorter') state.values.term = Math.max(24, state.values.term - 12);
    if (type === 'independent') state.values.supportConfirmed = false;
    state.edited = true; renderStep(); renderLive(); renderResults(false); toast('입력값과 결과를 함께 변경했어요.');
  }));
  if (scroll) { $('#results').scrollIntoView({ behavior: 'smooth' }); $('#result-title').focus({ preventScroll: true }); }
}

function renderComparison() {
  const r = state.result;
  const candidates = [
    ['여유 예산', Math.floor(r.safePrice / 10) * 10], ['나의 드림카', r.p.dreamPrice], ['비교할 가격', state.comparison]
  ];
  $('#comparison-table').innerHTML = `<div class="comparison-wrap"><table><caption class="sr-only">동일한 유지비 조건에서 차량 가격별 월 지출과 보유비용 비교</caption><thead><tr><th scope="col">차량 가격</th><th scope="col">월 지출</th><th scope="col">월 잔여 여유</th><th scope="col">${r.p.ownershipYears}년 보유비용</th></tr></thead><tbody>${candidates.map(([name, price]) => {
    const car = analyzeCar(price, r);
    return `<tr><td>${name}<br>${money(price)}${car.cashNeeded > 0 ? '<span class="tag">초기자금 부족</span>' : ''}</td><td>${price === 0 ? '—' : money(car.monthly)}</td><td class="${car.remainder < 0 ? 'danger-text' : ''}">${price === 0 ? '구매 보류' : signedMoney(car.remainder)}</td><td>${price === 0 ? '—' : money(car.totalOwnership)}</td></tr>`;
  }).join('')}</tbody></table></div>`;
}

async function shareResult() {
  const payload = publicShare(state.result, location.href);
  try {
    if (navigator.share) { await navigator.share(payload); return; }
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(`${payload.text}${payload.url ? `\n${payload.url}` : ''}`); toast(payload.url ? '유형과 테스트 링크를 복사했어요.' : '미리보기에서는 유형 문구만 복사해요.'); return; }
    showCopyFallback(payload);
  } catch (error) { if (error.name !== 'AbortError') showCopyFallback(payload); }
}

function showCopyFallback(payload) {
  let dialog = $('#copy-dialog');
  if (!dialog) {
    dialog = document.createElement('dialog'); dialog.id = 'copy-dialog';
    dialog.innerHTML = '<div class="dialog-top"><h2>아래 내용을 복사해 공유하세요.</h2><button class="icon-button" aria-label="닫기">×</button></div><textarea aria-label="공유할 내용" readonly style="width:100%;min-height:180px;padding:16px;background:var(--surface);color:var(--ink);border:1px solid var(--line)"></textarea>';
    document.body.append(dialog); dialog.querySelector('button').addEventListener('click', () => dialog.close());
  }
  dialog.querySelector('textarea').value = `${payload.text}${payload.url ? `\n${payload.url}` : ''}`;
  dialog.showModal(); dialog.querySelector('textarea').select();
}

function toast(text) { clearTimeout(toastTimeout); $('#toast').textContent = text; $('#toast').classList.add('show'); toastTimeout = setTimeout(() => $('#toast').classList.remove('show'), 3500); }

$('#budget-form').addEventListener('input', event => {
  const input = event.target; const key = input.name;
  if (!(key in DEFAULTS)) return;
  if (state.result) { $('#results').hidden = true; state.result = null; }
  if (input.type === 'checkbox') state.values[key] = input.checked;
  else if (input.type === 'number') {
    if (input.value === '' || !input.checkValidity()) { $('#live-insight').textContent = '입력 중이에요. 올바른 숫자를 넣으면 예산을 다시 계산해요.'; return; }
    state.values[key] = Number(input.value);
  } else state.values[key] = key in NUMERIC_LIMITS ? Number(input.value) : input.value;
  state.edited = true; $('#example-note').textContent = '입력한 숫자로 계산하고 있어요. 아직 바꾸지 않은 항목의 예시 값도 확인해주세요.';
  renderLive();
});

$('#budget-form').addEventListener('change', event => {
  const key = event.target.name;
  if (key === 'power') {
    const energyDefaults = { gasoline: [14, 1700], hybrid: [20, 1700], electric: [5, 300] };
    [state.values.efficiency, state.values.energyPrice] = energyDefaults[state.values.power];
    if (state.values.power === 'electric') state.values.vehicleTax = 13;
    else state.values.vehicleTax = 29;
    renderStep(); renderLive(); $('#power').focus(); toast('연비·에너지 단가·자동차세 예시를 변경했어요.');
  } else if (key === 'incomeMode' || key === 'term') { renderStep(); renderLive(); $(`#${key}`).focus(); }
});

$('#budget-form').addEventListener('submit', event => { event.preventDefault(); if (!validateStep()) return; if (state.step < 3) moveStep(state.step + 1); else renderResults(true); });
$('#previous-step').addEventListener('click', () => moveStep(Math.max(0, state.step - 1)));
document.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => moveStep(Number(button.dataset.step))));
document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => {
  state.values = { ...PRESETS[button.dataset.preset] }; state.step = 0; state.edited = false; state.result = null;
  $('#results').hidden = true; renderStep(); renderLive(); $('#example-note').textContent = '선택한 상황의 예시 값이에요. 내 숫자로 바꿔서 계산해주세요.'; toast('상황별 예시를 불러왔어요.');
}));
$('#reset-inputs').addEventListener('click', () => {
  state.values = { ...DEFAULTS }; state.step = 0; state.edited = false; state.result = null;
  $('#results').hidden = true; renderStep(); renderLive(); $('#example-note').textContent = '기본 예시 값으로 초기화했어요. 내 숫자로 바꿔주세요.'; toast('입력값을 초기화했어요.');
});
$('#design-open').addEventListener('click', () => $('#design-dialog').showModal());
$('#privacy-open').addEventListener('click', () => $('#privacy-dialog').showModal());
document.querySelectorAll('.dialog-close').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('[data-theme]').forEach(button => button.addEventListener('click', () => {
  document.body.dataset.theme = button.dataset.theme;
  $('#design-dialog').close(); toast('선택한 분위기를 적용했어요.');
}));
renderStep(); renderLive();
