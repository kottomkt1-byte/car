// Money is in 만원. Planning assumptions, not lending or tax rules.
export const ASSUMPTIONS = Object.freeze({
 netRate: .8, reserveMonths: 6, reserveBuildMonths: 24,
 assetUse: .35, surplusUse: .35, apr: 6, months: 60,
 feesRate: .07, registration: 30, familyRate: .02, familyLimit: 10000
});
export const DEFAULTS=Object.freeze({salary:5000,expenses:150,assets:3000,parents:0});
export const LIMITS=Object.freeze({salary:1000000,expenses:100000,assets:100000000,parents:100000000});
export const CARS=[
 {id:'morning-used',brand:'KIA',name:'기아 모닝',trim:'가솔린 · 중고',price:800,running:22,tier:'중고 경차',image:null,official:'https://cpo.kia.com/',note:'비교용 중고차 가격이며 연식·상태에 따라 달라요.'},
 {id:'ray-used',brand:'KIA',name:'기아 레이',trim:'가솔린 · 중고',price:1100,running:24,tier:'중고 경차',image:null,official:'https://cpo.kia.com/',note:'비교용 중고차 가격이며 연식·상태에 따라 달라요.'},
 {id:'k3',brand:'KIA',name:'기아 K3',trim:'1.6 가솔린 · 중고',price:1400,running:27,tier:'첫 차',image:'https://cdn.cartvnews.com/news/photo/202010/608180_367858_1555.jpg',source:'https://www.cartvnews.com/news/articleView.html?idxno=608180',official:'https://cpo.kia.com/',note:'중고차는 연식·주행거리·사고 이력에 따라 가격이 달라져요.',pitch:'첫 차는 가볍게. 남는 돈은 저축으로.'},
 {id:'avante-used',brand:'HYUNDAI',name:'현대 아반떼',trim:'1.6 가솔린 · 중고',price:1800,running:28,tier:'첫 차',image:'https://wimg.mk.co.kr/news/cms/202511/07/news-p.v1.20251107.2ad89b517cdd4b188e49aa22cdf02d69_P1.jpg',source:'https://www.mk.co.kr/en/business/11462667',official:'https://certified.hyundai.com/',note:'사진은 대표 이미지이며 실제 중고 매물과 달라요.',pitch:'부담은 낮추고, 출퇴근은 편하게.'},
 {id:'avante',brand:'HYUNDAI',name:'현대 아반떼',trim:'1.6 가솔린 · 신차',price:2600,running:28,tier:'준중형',image:'https://wimg.mk.co.kr/news/cms/202511/07/news-p.v1.20251107.2ad89b517cdd4b188e49aa22cdf02d69_P1.jpg',source:'https://www.mk.co.kr/en/business/11462667',official:'https://www.hyundai.com/kr/ko/e/vehicles/the-all-new-avante/price',note:'연식과 트림에 따라 디자인·가격이 달라질 수 있어요.',pitch:'새 차를 타면서 저축도 이어갈 수 있는 선택.'},
 {id:'k5',brand:'KIA',name:'기아 K5',trim:'2.0 가솔린 · 신차',price:3400,running:36,tier:'중형',image:null,official:'https://www.kia.com/kr/vehicles/k5/price',pitch:'출퇴근도 주말 여행도, 넉넉한 중형 세단.'},
 {id:'grandeur',brand:'HYUNDAI',name:'현대 그랜저',trim:'2.5 가솔린 · 신차',price:4500,running:43,tier:'준대형',image:null,official:'https://www.hyundai.com/kr/ko/e/vehicles/grandeur/price',pitch:'승차감과 실내 공간을 한 단계 높일 때.'},
 {id:'g80',brand:'GENESIS',name:'제네시스 G80',trim:'2.5 터보 · 신차',price:6500,running:55,tier:'프리미엄',image:'https://dams.hyundai-autoever.com/cdn-cgi/image/width%3D1440%2Cheight%3D720%2Cfit%3Dcover%2Cquality%3D85%2Cformat%3Dauto/v1/openapi/hmg-presigned-url/50534b313031303030303030303030303039313334/genesis-g80-2027-black-exterior-detail-front-large.png',source:'https://www.genesis.com/kr/ko/models/g80',official:'https://www.genesis.com/kr/ko/models/g80',note:'대표 이미지는 G80 블랙이며 추천 트림과 외관이 다를 수 있어요.',pitch:'편안한 승차감과 고급스러운 실내가 좋다면.'},
 {id:'bmw5',brand:'BMW',name:'BMW 5시리즈',trim:'520i · 신차',price:7300,running:55,tier:'프리미엄',image:'https://bmw.scene7.com/is/image/BMW/g60_ice_stage_ext-loop-alternative_dsk_sl_de?fmt=webp&qlt=80&wid=1024',source:'https://www.bmw.co.kr/ko/all-models/5-series/sedan/bmw-5-series-sedan-overview.html',official:'https://www.bmw.co.kr/ko/all-models/5-series/sedan/bmw-5-series-sedan-overview.html',note:'대표 이미지의 옵션·색상은 실제 견적과 다를 수 있어요.',pitch:'운전하는 재미까지 챙기고 싶은 당신에게.'},
 {id:'macan',brand:'PORSCHE',name:'포르쉐 마칸',trim:'Electric · 신차',price:11500,running:65,tier:'포르쉐',image:null,official:'https://www.porsche.com/korea/ko/models/macan/',pitch:'포르쉐를 매일 타고 싶다면, 실용적인 SUV부터.'},
 {id:'cayenne',brand:'PORSCHE',name:'포르쉐 카이엔',trim:'기본형 · 신차',price:15000,running:90,tier:'포르쉐',image:null,official:'https://www.porsche.com/korea/ko/models/cayenne/',pitch:'가족과 함께 타는 차에도 포르쉐를 원한다면.'},
 {id:'911',brand:'PORSCHE',name:'포르쉐 911',trim:'Carrera · 신차',price:20000,running:100,tier:'드림카',image:'./public/showroom.png',official:'https://www.porsche.com/korea/ko/models/911/',note:'AI로 제작한 참고 이미지이며 실제 사양과 다를 수 있어요.',pitch:'이제 911을 구체적으로 알아볼 만한 조건이에요.'}
];

export function normalize(input = {}) {
 const p = {};
 for (const [key, limit] of Object.entries(LIMITS)) {
  const n = Number(input[key] ?? DEFAULTS[key]);
  p[key] = Number.isFinite(n) ? Math.max(0, Math.min(limit, n)) : DEFAULTS[key];
 }
 return p;
}

export function installment(principal, apr = ASSUMPTIONS.apr, months = ASSUMPTIONS.months) {
 if (principal <= 0 || months <= 0) return 0;
 const rate = apr / 1200;
 return rate === 0 ? principal / months : principal * rate / (1 - (1 + rate) ** -months);
}

// A fixed monthly repayment can finance this much principal.
export function loanCapacity(monthly) {
 return Math.max(0, monthly) / installment(1);
}

export function assessCar(car, c) {
 const total = car.price * (1 + ASSUMPTIONS.feesRate) + ASSUMPTIONS.registration;
 // If salary cannot cover running costs, set aside all 60 months in cash first.
 // This also supports people with liquid assets but little earned income.
 const operatingReserve = Math.max(0, car.running - c.monthlyLimit) * ASSUMPTIONS.months;
 const purchaseCash = Math.max(0, c.upfront - operatingReserve);
 const down = Math.min(purchaseCash, total);
 const loan = Math.max(0, total - down);
 const payment = installment(loan);
 const monthly = payment + car.running;
 const maxLoan = loanCapacity(c.monthlyLimit - car.running);
 const fundingGap = Math.max(0, total + operatingReserve - c.upfront - maxLoan);
 const affordable = fundingGap < 1e-7;
 const fromAssets = operatingReserve / ASSUMPTIONS.months;
 const fromIncome = monthly - fromAssets;
 return {
  ...car, total, down, loan, payment, monthly, operatingReserve, fromAssets,
  fromIncome, fundingGap, affordable,
  left: c.surplus - fromIncome - c.reserveTopup,
  overBy: Math.max(0, fromIncome - c.monthlyLimit),
  // Continuous headroom: crossing zero changes one candidate, never all candidates.
  headroom: c.upfront + maxLoan - operatingReserve - total
 };
}

export function recommend(input = DEFAULTS, family = false) {
 const p = normalize(input), a = ASSUMPTIONS;
 const income = p.salary / 12 * a.netRate;
 const surplus = Math.max(0, income - p.expenses);
 const reserve = p.expenses * a.reserveMonths;
 const familySupport = family ? Math.min(p.parents * a.familyRate, a.familyLimit) : 0;
 // Ring-fence living expenses before spending assets on a car. If income is
 // below expenses, cover that shortfall for the same 60-month planning horizon.
 const livingDrawdown = Math.max(0, p.expenses - income);
 const livingReserve = livingDrawdown * a.months;
 const protectedNeed = reserve + livingReserve;
 const supportForProtection = Math.min(familySupport, Math.max(0, protectedNeed - p.assets));
 const ownCash = Math.max(0, p.assets - protectedNeed) * a.assetUse;
 const supportForCar = familySupport - supportForProtection;
 const upfront = ownCash + supportForCar;
 const reserveHeld = Math.min(reserve, p.assets + familySupport);
 const reserveGap = Math.max(0, reserve - p.assets - familySupport);
 // A shortfall reduces the budget gradually through monthly saving; there is
 // deliberately NO reserveGap===0 gate that invalidates the entire catalogue.
 const reserveTopup = reserveGap / a.reserveBuildMonths;
 const monthlyLimit = Math.max(0, surplus - reserveTopup) * a.surplusUse;
 const c = {
  input: p, income, surplus, reserve, reserveHeld, reserveGap, reserveTopup,
  livingDrawdown, livingReserve, ownCash, familySupport, supportForProtection,
  supportForCar, upfront, monthlyLimit, family
 };
 const assessed = CARS.map(car => assessCar(car, c));
 const eligible = assessed.filter(car => car.affordable);
 const best = eligible.at(-1) || null;
 const alternatives = eligible.slice(-3, -1).reverse();
 const next = best ? assessed[assessed.findIndex(car => car.id === best.id) + 1] || null : assessed[0];
 return { ...c, best, alternatives, next, assessed };
}

export const EXAMPLES = [
 {id:'first',title:'아반떼·K3부터',salary:5000,expenses:150,assets:3000,parents:0},
 {id:'premium',title:'G80·5시리즈까지',salary:10000,expenses:250,assets:10000,parents:0},
 {id:'dream',title:'포르쉐도 가능할까?',salary:20000,expenses:350,assets:50000,parents:0}
];
