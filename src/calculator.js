// All monetary inputs and outputs are in 만원 (KRW 10,000).
// The ratios below are this service's editable planning assumptions, not lending rules.
export const DEFAULTS = Object.freeze({
  annualSalary: 5000, incomeMode: 'net', netMonthly: 350, netRate: 82, otherIncome: 0,
  living: 100, housing: 50, debtPayment: 0, familyExpense: 0, saving: 70,
  cash: 3000, investments: 1000, investmentUse: 50, realEstate: 0, debtBalance: 0,
  protectedSavings: 500, reserveMonths: 6, assetUse: 60,
  parentAssets: 0, familySupport: 0, supportConfirmed: false,
  tradeIn: 0, tradeInLoan: 0,
  dreamPrice: 3200, apr: 5.5, term: 48, acquisitionRate: 7, registration: 30,
  annualKm: 12000, power: 'gasoline', efficiency: 14, energyPrice: 1700,
  insurance: 100, vehicleTax: 29, parking: 10, toll: 3, maintenance: 40,
  ownershipYears: 5, residualPercent: 55, transport: 10, incomeCap: 20,
  hasChildren: false, outdoor: false
});

export const NUMERIC_LIMITS = {
  annualSalary: [0, 1000000], netMonthly: [0, 100000], netRate: [1, 100], otherIncome: [0, 100000],
  living: [0, 100000], housing: [0, 100000], debtPayment: [0, 100000], familyExpense: [0, 100000], saving: [0, 100000],
  cash: [0, 100000000], investments: [0, 100000000], investmentUse: [0, 100], realEstate: [0, 100000000], debtBalance: [0, 100000000],
  protectedSavings: [0, 100000000], reserveMonths: [0, 36], assetUse: [0, 100], parentAssets: [0, 100000000], familySupport: [0, 100000000],
  tradeIn: [0, 1000000], tradeInLoan: [0, 1000000], dreamPrice: [0, 1000000], apr: [0, 40], term: [0, 120],
  acquisitionRate: [0, 20], registration: [0, 10000], annualKm: [0, 300000], efficiency: [0.1, 100], energyPrice: [0, 10000],
  insurance: [0, 10000], vehicleTax: [0, 10000], parking: [0, 10000], toll: [0, 10000], maintenance: [0, 10000],
  ownershipYears: [1, 15], residualPercent: [0, 100], transport: [0, 10000], incomeCap: [5, 50]
};

export function normalize(input = {}) {
  const p = { ...DEFAULTS, ...input };
  for (const [key, [min, max]] of Object.entries(NUMERIC_LIMITS)) {
    const v = Number(p[key]);
    p[key] = Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : DEFAULTS[key];
  }
  p.term = Math.round(p.term);
  p.supportConfirmed = p.supportConfirmed === true;
  p.incomeMode = p.incomeMode === 'gross' ? 'gross' : 'net';
  p.power = ['gasoline', 'hybrid', 'electric'].includes(p.power) ? p.power : 'gasoline';
  return p;
}

export function payment(principal, apr, months) {
  if (principal <= 0 || months <= 0) return 0;
  const r = apr / 1200;
  return r === 0 ? principal / months : principal * r / (1 - (1 + r) ** -months);
}

export function presentValue(monthly, apr, months) {
  if (monthly <= 0 || months <= 0) return 0;
  const r = apr / 1200;
  return r === 0 ? monthly * months : monthly * (1 - (1 + r) ** -months) / r;
}

export function loanBalance(principal, apr, months, paidMonths) {
  if (principal <= 0 || months <= 0 || paidMonths >= months) return 0;
  const n = Math.max(0, paidMonths);
  const r = apr / 1200;
  if (r === 0) return principal * (1 - n / months);
  return Math.max(0, principal * (1 + r) ** n - payment(principal, apr, months) * ((1 + r) ** n - 1) / r);
}

function priceFromBudget(cash, installment, p) {
  return Math.max(0, (cash + presentValue(installment, p.apr, p.term) - p.registration) / (1 + p.acquisitionRate / 100));
}

export function calculate(input = {}) {
  const p = normalize(input);
  const income = (p.incomeMode === 'gross' ? p.annualSalary * p.netRate / 1200 : p.netMonthly) + p.otherIncome;
  const essentials = p.living + p.housing + p.debtPayment + p.familyExpense;
  const freeCash = income - essentials - p.saving;
  const reserve = essentials * p.reserveMonths + p.protectedSavings;
  const liquidAssets = p.cash + p.investments * p.investmentUse / 100;
  const reserveShortfall = Math.max(0, reserve - liquidAssets);
  const selfCash = Math.max(0, liquidAssets - reserve) * p.assetUse / 100;
  const support = p.supportConfirmed ? p.familySupport : 0;
  const tradeEquity = p.tradeIn - p.tradeInLoan;
  const equityShortfall = Math.max(0, -(selfCash + support + tradeEquity));
  const upfront = Math.max(0, selfCash + support + tradeEquity);
  const energy = p.annualKm / p.efficiency * p.energyPrice / 10000 / 12;
  const operating = energy + (p.insurance + p.vehicleTax + p.maintenance) / 12 + p.parking + p.toll;
  const safeMonthly = Math.max(0, Math.min(income * p.incomeCap / 100, freeCash * 0.7));
  const stretchMonthly = Math.max(0, Math.min(income * Math.min(50, p.incomeCap + 10) / 100, freeCash));
  const canOperate = operating <= safeMonthly && freeCash >= 0 && equityShortfall === 0 && reserveShortfall === 0;
  const safePrice = canOperate ? priceFromBudget(upfront, Math.max(0, safeMonthly - operating), p) : 0;
  const stretchPrice = operating <= stretchMonthly && equityShortfall === 0
    ? priceFromBudget(upfront, Math.max(0, stretchMonthly - operating), p) : 0;
  const independentCash = Math.max(0, selfCash + tradeEquity);
  const independentPrice = canOperate && selfCash + tradeEquity >= 0
    ? priceFromBudget(independentCash, Math.max(0, safeMonthly - operating), p) : 0;
  const netWorth = p.cash + p.investments + p.realEstate - p.debtBalance + tradeEquity;
  const base = { p, income, essentials, freeCash, reserve, liquidAssets, reserveShortfall, selfCash, support, tradeEquity,
    equityShortfall, upfront, energy, operating, safeMonthly, stretchMonthly, safePrice, stretchPrice, independentPrice, netWorth };
  const dream = analyzeCar(p.dreamPrice, base);
  const safe = analyzeCar(safePrice, base);
  const stressedIncome = income * 0.8;
  const stressedPayment = payment(dream.loan, Math.min(40, p.apr + 2), p.term);
  const stressRemainder = stressedIncome - essentials - p.saving - (p.dreamPrice > 0 ? operating + stressedPayment : 0);
  const warnings = [];
  if (reserveShortfall > 0) warnings.push(`설정한 비상금·목표자금이 가용자산보다 ${Math.ceil(reserveShortfall).toLocaleString('ko-KR')}만 원 많아요. 예산보다 비상금 확보를 먼저 확인하세요.`);
  if (freeCash <= 0) warnings.push('생활비와 저축을 빼면 남는 월 소득이 없어요. 차량 구매 전에 현금흐름을 점검해 보세요.');
  if (p.debtBalance > 0 && p.debtPayment === 0) warnings.push('부채가 있지만 월 상환액이 0원이에요. 이자와 만기 상환에 필요한 적립액도 넣어주세요.');
  if (equityShortfall > 0) warnings.push('기존 차의 남은 대출을 정리할 자금이 부족해요. 부족분을 먼저 해결해야 해요.');
  if (p.incomeMode === 'gross') warnings.push('실수령액은 입력한 수령 비율로 단순 추정했어요. 급여명세서의 실제 월 수령액으로 바꾸면 더 정확해져요.');
  if (p.familySupport > 0 && !p.supportConfirmed) warnings.push('아직 확정되지 않은 가족 지원금은 구매 예산에서 제외했어요.');
  if (p.parentAssets > 0) warnings.push('부모님 총자산은 참고 정보예요. 내 자산·구매 예산·공유 카드에 포함하지 않아요.');
  if (p.term > 60) warnings.push('할부가 길면 월 납입액은 줄지만 총이자는 커져요. 보유기간보다 할부가 긴지도 확인하세요.');
  const persona = getPersona(base, dream);
  return { ...base, dream, safe, stressRemainder, warnings, persona };
}

export function analyzeCar(price, base) {
  const { p, upfront, operating, income, freeCash, equityShortfall } = base;
  if (price <= 0) return { price: 0, acquisition: 0, totalPurchase: 0, down: 0, loan: 0, installment: 0, monthly: 0, totalInterest: 0, interestDuringOwnership: 0, remainingLoan: 0, residual: 0, totalOwnership: 0, economicMonthly: 0, cashNeeded: 0, ratio: 0, remainder: freeCash, affordable: false, status: 'hold' };
  const acquisition = price * p.acquisitionRate / 100 + p.registration;
  const totalPurchase = price + acquisition;
  const down = Math.min(upfront, totalPurchase);
  const loan = p.term === 0 ? 0 : Math.max(0, totalPurchase - down);
  const cashNeeded = (p.term === 0 ? Math.max(0, totalPurchase - upfront) : 0) + equityShortfall;
  const installment = payment(loan, p.apr, p.term);
  const monthly = operating + installment;
  const totalInterest = installment * p.term - loan;
  const months = Math.round(p.ownershipYears * 12);
  const remainingLoan = loanBalance(loan, p.apr, p.term, months);
  const interestDuringOwnership = Math.max(0, installment * Math.min(months, p.term) - (loan - remainingLoan));
  const residual = price * p.residualPercent / 100;
  // Depreciation + acquisition fees + interest actually accrued + operating costs.
  // Principal payments are not added again, so depreciation isn't double-counted.
  const totalOwnership = price - residual + acquisition + interestDuringOwnership + operating * months;
  const ratio = income > 0 ? monthly / income * 100 : 100;
  const remainder = freeCash - monthly;
  const affordable = cashNeeded === 0 && remainder >= 0;
  const status = cashNeeded > 0 || remainder < -1e-7 ? 'over' : monthly <= base.safeMonthly + 1e-7 && base.reserveShortfall === 0 ? 'safe' : 'tight';
  return { price, acquisition, totalPurchase, down, loan, installment, monthly, totalInterest, interestDuringOwnership,
    remainingLoan, residual, totalOwnership, economicMonthly: totalOwnership / months, cashNeeded, ratio, remainder, affordable, status };
}

export function getPersona(base, dream) {
  if (base.safePrice === 0) return { id: 'pause', label: '다음 신호를 기다리는 전략가', short: '지금은 충전 중', emoji: '🚦', message: '좋은 차보다, 좋은 타이밍을 고르는 중. 오늘의 보류도 멋진 선택이에요.' };
  if (dream.status === 'over') return { id: 'dreamer', label: '드림카는 직진, 통장은 과속방지턱', short: '꿈은 풀옵션', emoji: '🏁', message: '취향은 확실하네요. 예산이나 구매 시기를 조정하면 더 편한 드라이브가 될 거예요.' };
  if (dream.status === 'tight') return { id: 'balance', label: '설렘과 저축 사이의 균형 드라이버', short: '균형 감각 장인', emoji: '⚖️', message: '차도 좋고 미래도 중요해요. 한 단계 낮은 가격에서 여유를 찾아보세요.' };
  if (base.support > 0) return { id: 'together', label: '함께 출발하는 여유 드라이버', short: '든든한 공동 출발', emoji: '🤝', message: '확정된 지원과 내 현금흐름을 따로 확인했어요. 유지비까지 스스로 감당할 수 있는지 살펴보세요.' };
  return { id: 'cruise', label: '통장까지 편안한 크루즈 드라이버', short: '여유로운 정속 주행', emoji: '🛣️', message: '차를 산 뒤의 일상도 생각했네요. 이 여유를 오래 유지하는 쪽으로 출발해요.' };
}

export const PRESETS = {
  starter: { ...DEFAULTS, annualSalary: 3600, netMonthly: 260, cash: 1500, investments: 200, living: 85, housing: 35, saving: 50, protectedSavings: 200, dreamPrice: 2000 },
  home: { ...DEFAULTS, annualSalary: 6500, netMonthly: 450, cash: 8000, investments: 2000, living: 130, housing: 80, saving: 120, protectedSavings: 6000, dreamPrice: 3800, debtBalance: 15000, debtPayment: 40 },
  cruise: { ...DEFAULTS, annualSalary: 10000, netMonthly: 650, cash: 15000, investments: 10000, living: 150, housing: 80, saving: 150, protectedSavings: 3000, dreamPrice: 5500 }
};
