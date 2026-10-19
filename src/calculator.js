import { CAR_MEDIA } from './car-media.js?v=12';
// Money is in 만원. Planning assumptions, not lending or tax rules.
export const ASSUMPTIONS = Object.freeze({
 netRate: .8, reserveMonths: 6, reserveBuildMonths: 24,
 assetUse: .35, surplusUse: .35, apr: 6, months: 60,
 feesRate: .07, registration: 30
});
export const DEFAULTS=Object.freeze({salary:5000,expenses:150,assets:3000});
export const LIMITS=Object.freeze({salary:1000000,expenses:100000,assets:100000000});
const ORIGINAL_CARS=[
 {id:'morning-used',brand:'KIA',name:'기아 모닝',trim:'가솔린 · 중고',price:800,running:22,tier:'중고 경차',official:'https://cpo.kia.com/',note:'비교용 중고차 가격이며 연식·상태에 따라 달라요.'},
 {id:'ray-used',brand:'KIA',name:'기아 레이',trim:'가솔린 · 중고',price:1100,running:24,tier:'중고 경차',official:'https://cpo.kia.com/',note:'비교용 중고차 가격이며 연식·상태에 따라 달라요.'},
 {id:'k3',brand:'KIA',name:'기아 K3',trim:'1.6 가솔린 · 중고',price:1400,running:27,tier:'첫 차',official:'https://cpo.kia.com/',note:'중고차는 연식·주행거리·사고 이력에 따라 가격이 달라져요.',pitch:'첫 차는 가볍게. 남는 돈은 저축으로.'},
 {id:'avante-used',brand:'HYUNDAI',name:'현대 아반떼',trim:'1.6 가솔린 · 중고',price:1800,running:28,tier:'첫 차',official:'https://certified.hyundai.com/',note:'사진은 대표 이미지이며 실제 중고 매물과 달라요.',pitch:'부담은 낮추고, 출퇴근은 편하게.'},
 {id:'avante',brand:'HYUNDAI',name:'현대 아반떼',trim:'1.6 가솔린 · 신차',price:2600,running:28,tier:'준중형',official:'https://www.hyundai.com/kr/ko/e/vehicles/the-all-new-avante/price',note:'연식과 트림에 따라 디자인·가격이 달라질 수 있어요.',pitch:'새 차를 타면서 저축도 이어갈 수 있는 선택.'},
 {id:'k5',brand:'KIA',name:'기아 K5',trim:'2.0 가솔린 · 신차',price:3400,running:36,tier:'중형',official:'https://www.kia.com/kr/vehicles/k5/price',pitch:'출퇴근도 주말 여행도, 넉넉한 중형 세단.'},
 {id:'grandeur',brand:'HYUNDAI',name:'현대 그랜저',trim:'2.5 가솔린 · 신차',price:4500,running:43,tier:'준대형',official:'https://www.hyundai.com/kr/ko/e/vehicles/grandeur/price',pitch:'승차감과 실내 공간을 한 단계 높일 때.'},
 {id:'g80',brand:'GENESIS',name:'제네시스 G80',trim:'2.5 터보 · 신차',price:6500,running:55,tier:'프리미엄',official:'https://www.genesis.com/kr/ko/models/g80',note:'대표 이미지는 실제 연식·트림·옵션과 다를 수 있어요.',pitch:'편안한 승차감과 고급스러운 실내가 좋다면.'},
 {id:'bmw5',brand:'BMW',name:'BMW 5시리즈',trim:'520i · 신차',price:7300,running:55,tier:'프리미엄',official:'https://www.bmw.co.kr/ko/all-models/5-series/sedan/bmw-5-series-sedan-overview.html',note:'대표 이미지의 옵션·색상은 실제 견적과 다를 수 있어요.',pitch:'운전하는 재미까지 챙기고 싶은 당신에게.'},
 {id:'macan',brand:'PORSCHE',name:'포르쉐 마칸',trim:'Electric · 신차',price:11500,running:65,tier:'포르쉐',official:'https://www.porsche.com/korea/ko/models/macan/',pitch:'포르쉐를 매일 타고 싶다면, 실용적인 SUV부터.'},
 {id:'cayenne',brand:'PORSCHE',name:'포르쉐 카이엔',trim:'기본형 · 신차',price:15000,running:90,tier:'포르쉐',official:'https://www.porsche.com/korea/ko/models/cayenne/',pitch:'가족과 함께 타는 차에도 포르쉐를 원한다면.'},
 {id:'911',brand:'PORSCHE',name:'포르쉐 911',trim:'Carrera · 신차',price:20000,running:100,tier:'드림카',official:'https://www.porsche.com/korea/ko/models/911/',note:'대표 이미지는 실제 연식·트림·옵션과 다를 수 있어요.',pitch:'이제 911을 구체적으로 알아볼 만한 조건이에요.'}
];

// Price/running amounts are explicit planning scenarios, not live dealer quotes.
// Manufacturer model directories allow users to check actual trims and quotations.
const MODEL_SOURCES = {
 HYUNDAI:'https://www.hyundai.com/kr/ko/e/all-vehicles',
 KIA:'https://www.kia.com/kr',
 GENESIS:'https://www.genesis.com/kr/ko/',
 BMW:'https://www.bmw.co.kr/ko/all-models.html',
 MERCEDES:'https://www.mercedes-benz.co.kr/passengercars/models.html',
 AUDI:'https://www.audi.co.kr/',
 TESLA:'https://www.tesla.com/ko_kr',
 PORSCHE:'https://www.porsche.com/korea/ko/models/',
 BENTLEY:'https://www.bentleymotors.com/en/models.html',
 LAMBORGHINI:'https://www.lamborghini.com/ko-en',
 FERRARI:'https://www.ferrari.com/ko-KR/auto/car-range',
 MCLAREN:'https://cars.mclaren.com/en/750s',
 ROLLSROYCE:'https://www.rolls-roycemotorcars.com/en_US/showroom.html',
 LANDROVER:'https://www.landroverkorea.co.kr/',
 CHEVROLET:'https://www.chevrolet.co.kr/'
};
// id, make, model, trim, purchase scenario, monthly running, body style
const MORE_CARS = [
 ['spark-used','CHEVROLET','쉐보레 스파크','가솔린 · 중고',550,21,'경차'],
 ['casper-used','HYUNDAI','현대 캐스퍼','가솔린 · 중고',1300,25,'경형 SUV'],
 ['morning','KIA','기아 모닝','가솔린 · 신차',1700,22,'경차'],
 ['sonata-used','HYUNDAI','현대 쏘나타','2.0 가솔린 · 중고',2200,36,'세단'],
 ['ray','KIA','기아 레이','가솔린 · 신차',2000,24,'경차'],
 ['casper','HYUNDAI','현대 캐스퍼','가솔린 · 신차',2100,25,'경형 SUV'],
 ['venue-used','HYUNDAI','현대 베뉴','가솔린 · 중고',1600,29,'소형 SUV'],
 ['seltos','KIA','기아 셀토스','가솔린 · 신차',3000,33,'소형 SUV'],
 ['kona','HYUNDAI','현대 코나','가솔린 · 신차',3100,32,'소형 SUV'],
 ['tucson','HYUNDAI','현대 투싼','가솔린 · 신차',3500,38,'SUV'],
 ['sportage','KIA','기아 스포티지','가솔린 · 신차',3600,38,'SUV'],
 ['sonata','HYUNDAI','현대 쏘나타','2.0 가솔린 · 신차',3600,36,'세단'],
 ['niro','KIA','기아 니로','하이브리드 · 신차',3700,28,'하이브리드 SUV'],
 ['ev3','KIA','기아 EV3','전기 · 신차',4500,27,'전기 SUV'],
 ['santafe','HYUNDAI','현대 싼타페','가솔린 · 신차',4500,45,'SUV'],
 ['sorento','KIA','기아 쏘렌토','하이브리드 · 신차',4800,37,'하이브리드 SUV'],
 ['k8','KIA','기아 K8','2.5 가솔린 · 신차',4800,44,'세단'],
 ['carnival','KIA','기아 카니발','하이브리드 · 신차',4900,43,'미니밴'],
 ['palisade','HYUNDAI','현대 팰리세이드','가솔린 · 신차',5800,58,'대형 SUV'],
 ['ioniq5','HYUNDAI','현대 아이오닉 5','전기 · 신차',5800,32,'전기 SUV'],
 ['ev6','KIA','기아 EV6','전기 · 신차',6000,33,'전기 SUV'],
 ['model3','TESLA','테슬라 모델 3','Long Range · 신차',6000,33,'전기 세단'],
 ['modely','TESLA','테슬라 모델 Y','Long Range · 신차',6500,35,'전기 SUV'],
 ['bmw3','BMW','BMW 3시리즈','320i · 신차',6500,50,'스포츠 세단'],
 ['g70','GENESIS','제네시스 G70','2.5 터보 · 신차',6000,50,'스포츠 세단'],
 ['gv70','GENESIS','제네시스 GV70','2.5 터보 · 신차',6800,58,'SUV'],
 ['a6','AUDI','아우디 A6','가솔린 · 신차',7800,58,'세단'],
 ['bmwx3','BMW','BMW X3','가솔린 · 신차',7400,58,'SUV'],
 ['benzc','MERCEDES','벤츠 C클래스','C 200 · 신차',7400,55,'세단'],
 ['bmwx5','BMW','BMW X5','xDrive40i · 신차',12500,85,'SUV'],
 ['benze','MERCEDES','벤츠 E클래스','E 300 · 신차',9500,65,'세단'],
 ['gv80','GENESIS','제네시스 GV80','2.5 터보 · 신차',9500,73,'대형 SUV'],
 ['g90','GENESIS','제네시스 G90','3.5 터보 · 신차',12000,85,'대형 세단'],
 ['bmw7','BMW','BMW 7시리즈','740i · 신차',17500,110,'대형 세단'],
 ['bmwi7','BMW','BMW i7','M70 xDrive · 신차',24000,95,'전기 세단'],
 ['bmwx7','BMW','BMW X7','xDrive40i · 신차',16500,105,'대형 SUV'],
 ['benzs','MERCEDES','벤츠 S클래스','S 450 · 신차',17500,110,'대형 세단'],
 ['amggt','MERCEDES','벤츠 AMG GT','GT 63 · 신차',26000,160,'스포츠카'],
 ['g63','MERCEDES','벤츠 G클래스','AMG G 63 · 신차',25000,140,'대형 SUV'],
 ['panamera','PORSCHE','포르쉐 파나메라','기본형 · 신차',18000,105,'스포츠 세단'],
 ['taycan','PORSCHE','포르쉐 타이칸','Turbo S · 신차',23000,95,'전기 세단'],
 ['rangerover','LANDROVER','레인지로버','가솔린 · 신차',22000,130,'대형 SUV'],
 ['maybach','MERCEDES','벤츠 마이바흐 S클래스','S 580 · 신차',32000,150,'럭셔리 세단'],
 ['bentayga','BENTLEY','벤틀리 벤테이가','V8 · 신차',36000,220,'럭셔리 SUV'],
 ['flyingspur','BENTLEY','벤틀리 플라잉스퍼','Speed · 신차',39000,230,'럭셔리 세단'],
 ['continental','BENTLEY','벤틀리 컨티넨탈 GT','Speed · 신차',43000,240,'GT 쿠페'],
 ['urus','LAMBORGHINI','람보르기니 우루스','SE · 신차',40000,230,'고성능 SUV'],
 ['296speciale','FERRARI','페라리 296 스페치알레','쿠페 · 주문 사양',68000,320,'슈퍼카'],
 ['750s','MCLAREN','맥라렌 750S','쿠페 · 신차',52000,320,'슈퍼카'],
 ['purosangue','FERRARI','페라리 푸로산게','V12 · 주문 사양',65000,350,'고성능 SUV'],
 ['12cilindri','FERRARI','페라리 12칠린드리','V12 쿠페 · 주문 사양',70000,350,'슈퍼카'],
 ['ghost','ROLLSROYCE','롤스로이스 고스트','주문 사양',56000,280,'럭셔리 세단'],
 ['spectre','ROLLSROYCE','롤스로이스 스펙터','전기 · 주문 사양',65000,200,'럭셔리 쿠페'],
 ['cullinan','ROLLSROYCE','롤스로이스 컬리넌','주문 사양',80000,340,'럭셔리 SUV'],
 ['revuelto','LAMBORGHINI','람보르기니 레부엘토','V12 하이브리드 · 주문 사양',85000,400,'슈퍼카'],
 ['phantom','ROLLSROYCE','롤스로이스 팬텀','Extended · 주문 사양',110000,420,'럭셔리 세단']
];
const MODEL_OVERRIDES = {
 phantom:{official:'https://www.rolls-roycemotorcars.com/en_US/showroom/phantom-extended.html'},
 revuelto:{official:'https://www.lamborghini.com/en-en/models/revuelto'},
 '12cilindri':{official:'https://www.ferrari.com/ko-KR/auto/ferrari-12cilindri'},
 bmwi7:{official:'https://www.bmw.co.kr/ko/all-models/i-series/i7/bmw-i7-limousine.html'}
};
const BODY = {'morning-used':'경차','ray-used':'경차',macan:'전기 SUV',cayenne:'SUV','911':'스포츠카'};
export const CARS = [
 ...ORIGINAL_CARS.map(car=>({...car,body:BODY[car.id]||'세단'})),
 ...MORE_CARS.map(([id,brand,name,trim,price,running,body])=>({
  id,brand,name,trim,price,running,body,tier:body,
  official:trim.includes('중고')&&brand==='HYUNDAI'?'https://certified.hyundai.com/':MODEL_SOURCES[brand],
  note:'대표 이미지·연식·옵션은 실제 판매 사양과 다를 수 있어요.',
  ...MODEL_OVERRIDES[id]
 }))
].map(car=>{
 const media=CAR_MEDIA[car.id];
 if(!media?.image||!media.source)throw new Error(`Missing model image: ${car.id}`);
 return {...car,...media};
}).sort((a,b)=>a.price-b.price||a.id.localeCompare(b.id));
export const CATALOGUE_SIZE = new Set(CARS.map(car=>car.name)).size;

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

export function recommend(input = DEFAULTS) {
 const p = normalize(input), a = ASSUMPTIONS;
 const income = p.salary / 12 * a.netRate;
 const surplus = Math.max(0, income - p.expenses);
 const reserve = p.expenses * a.reserveMonths;
 // Ring-fence living expenses before spending assets on a car. If income is
 // below expenses, cover that shortfall for the same 60-month planning horizon.
 const livingDrawdown = Math.max(0, p.expenses - income);
 const livingReserve = livingDrawdown * a.months;
 const protectedNeed = reserve + livingReserve;
 const ownCash = Math.max(0, p.assets - protectedNeed) * a.assetUse;
 const upfront = ownCash;
 const reserveHeld = Math.min(reserve, p.assets);
 const reserveGap = Math.max(0, reserve - p.assets);
 // A shortfall reduces the budget gradually through monthly saving; there is
 // deliberately NO reserveGap===0 gate that invalidates the entire catalogue.
 const reserveTopup = reserveGap / a.reserveBuildMonths;
 const monthlyLimit = Math.max(0, surplus - reserveTopup) * a.surplusUse;
 const c = {
  input: p, income, surplus, reserve, reserveHeld, reserveGap, reserveTopup,
  livingDrawdown, livingReserve, ownCash, upfront, monthlyLimit
 };
 const assessed = CARS.map(car => assessCar(car, c));
 const eligible = assessed.filter(car => car.affordable);
 const recommendations = selectRecommendations(assessed);
 const best = recommendations.find(car=>car.affordable) || null;
 const alternatives = recommendations.filter(car=>car.affordable && car.id!==best?.id);
 const next = assessed.find(car=>!car.affordable) || null;
 return { ...c, best, alternatives, next, assessed, recommendations, eligibleCount: eligible.length };

}

// Compare three different model families, never new/used versions of one model.
// Within the upper budget band, prefer different makes and body styles.
export function selectRecommendations(assessed) {
 const bodyGroup = car => /SUV/.test(car.body)?'SUV':/세단/.test(car.body)?'세단':/쿠페|스포츠카|슈퍼카/.test(car.body)?'스포츠카':car.body;
 const eligible = assessed.filter(car=>car.affordable).sort((a,b)=>b.price-a.price||a.monthly-b.monthly||a.id.localeCompare(b.id));
 const selected = [];
 if(eligible.length) selected.push(eligible[0]);
 while(selected.length<3) {
  const remaining = eligible.filter(car=>!selected.some(chosen=>chosen.name===car.name));
  if(!remaining.length)break;
  const near = remaining.filter(car=>car.price>=selected[0].price*.6);
  const pool = near.length ? near : remaining;
  const newMake = pool.filter(car=>!selected.some(chosen=>chosen.brand===car.brand));
  const diverse = newMake.length ? newMake : pool;
  const newBody = diverse.find(car=>car.price>=diverse[0].price*.8&&!selected.some(chosen=>bodyGroup(chosen)===bodyGroup(car)));
  selected.push(newBody||diverse[0]);
 }
 // When fewer than 3 models fit, the remaining comparison slots are explicitly
 // unaffordable targets, ordered by the additional funding needed. Never label
 // these as affordable recommendations or include them in the public share card.
 const targets = assessed.filter(car=>!car.affordable).sort((a,b)=>a.fundingGap-b.fundingGap||a.price-b.price);
 for(const car of targets) {
  if(selected.length===3)break;
  if(!selected.some(chosen=>chosen.name===car.name))selected.push(car);
 }
 return selected;
}

export const EXAMPLES = [
 {id:'first',title:'아반떼·K3부터',salary:5000,expenses:150,assets:3000},
 {id:'premium',title:'제네시스·BMW까지',salary:10000,expenses:250,assets:10000},
 {id:'dream',title:'포르쉐도 가능할까?',salary:20000,expenses:350,assets:50000}
];
