import test from 'node:test';
import assert from 'node:assert/strict';
import {ASSUMPTIONS, DEFAULTS, EXAMPLES, CARS, recommend, installment, loanCapacity, normalize} from '../src/calculator.js';
import {publicShare} from '../src/share.js';
import {validAffiliateUrl, recommendProducts} from '../src/affiliates.js';
const near=(actual,expected,eps=1e-7)=>assert.ok(Math.abs(actual-expected)<eps,`${actual} != ${expected}`);
const rank=r=>r.best?CARS.findIndex(c=>c.id===r.best.id):-1;

test('regression: spending 300 → 301 does not invalidate every car at the emergency fund boundary',()=>{
 const input={salary:10000,assets:1800,parents:400000};
 for(const family of [false,true]){
  const before=recommend({...input,expenses:300},family);
  const after=recommend({...input,expenses:301},family);
  assert.ok(before.best);assert.ok(after.best);assert.equal(before.best.id,after.best.id);
  assert.ok(before.monthlyLimit-after.monthlyLimit<.5);
  assert.ok(Math.abs(before.upfront-after.upfront)<=6);
 }
});
test('a tiny emergency shortfall is saved gradually, not an all-or-nothing rejection',()=>{
 const r=recommend({salary:10000,expenses:301,assets:1800,parents:0});
 assert.ok(r.best);near(r.reserveGap,6);near(r.reserveTopup,.25);
 assert.equal(r.reserveHeld,1800);assert.notEqual(r.reserveHeld,r.reserve);
});
test('spending changes the budget in the former flat income-cap region',()=>{
 const results=[80,150,200,300].map(expenses=>recommend({salary:10000,expenses,assets:10000,parents:0}));
 for(let i=1;i<results.length;i++)assert.ok(results[i].monthlyLimit<results[i-1].monthlyLimit);
 assert.ok(rank(results[0])>rank(results.at(-1)));
 near(results[0].monthlyLimit-results[1].monthlyLimit,(150-80)*ASSUMPTIONS.surplusUse);
});
test('recommended examples span used compact, premium sedan and sports car',()=>{
 assert.equal(recommend(EXAMPLES[0]).best.id,'avante-used');
 assert.equal(recommend(EXAMPLES[1]).best.id,'g80');
 assert.equal(recommend({...EXAMPLES[1],salary:12000}).best.id,'bmw5');
 assert.equal(recommend(EXAMPLES[2]).best.id,'911');
});
test('parents assets never change independent results; a gift remains explicit and bounded',()=>{
 const p={...DEFAULTS,parents:100000};
 assert.deepEqual(recommend(p).best,recommend({...p,parents:100000000}).best);
 assert.equal(recommend(p).familySupport,0);assert.equal(recommend(p,true).familySupport,2000);
 assert.equal(recommend({...p,parents:100000000},true).familySupport,10000);
 assert.ok(rank(recommend(p,true))>rank(recommend(p)));
 assert.equal(recommend(DEFAULTS,true).familySupport,0);
});
test('hypothetical support fills living/emergency shortfalls before vehicle spending',()=>{
 const r=recommend({salary:10000,expenses:301,assets:1800,parents:400000},true);
 near(r.supportForProtection,6);near(r.supportForCar,7994);near(r.reserveHeld,1806);
 const noIncome=recommend({salary:0,expenses:300,assets:0,parents:100000000},true);
 assert.equal(noIncome.best,null);assert.equal(noIncome.upfront,0);
});
test('liquid assets can fund a car without salary after 5 years of living and running costs',()=>{
 const r=recommend({salary:0,expenses:300,assets:50000,parents:0}),car=r.best;
 assert.ok(car);near(r.livingReserve,18000);near(r.reserve,1800);
 near(car.payment,0);near(car.fromIncome,0);near(car.operatingReserve,car.running*60);
 assert.ok(car.down+car.operatingReserve<=r.upfront);
 assert.ok(r.reserve+r.livingReserve+car.down+car.operatingReserve<=r.input.assets);
});
test('car buying is unavailable only when the catalogue cannot be funded',()=>{
 for(const p of [{salary:0,expenses:100,assets:0,parents:0},{salary:1200,expenses:90,assets:100,parents:0}]){
  const r=recommend(p);assert.equal(r.best,null);assert.ok(r.next.fundingGap>0);assert.equal(r.next.id,'morning-used');
 }
});
test('monthly income funds the loan and running costs; asset-funded maintenance is not double-counted',()=>{
 for(const p of [DEFAULTS,...EXAMPLES,{salary:0,expenses:300,assets:50000,parents:0},{salary:1200,expenses:150,assets:100000,parents:0}]){
  const r=recommend(p);
  for(const car of [r.best,...r.alternatives].filter(Boolean)){
   near(car.total,car.down+car.loan);near(car.monthly,car.payment+car.running);
   near(car.monthly,car.fromIncome+car.fromAssets);
   assert.ok(car.fromIncome<=r.monthlyLimit+1e-7);
   assert.ok(car.down+car.operatingReserve<=r.upfront+1e-7);
   let loan=car.loan,cash=car.operatingReserve;
   for(let month=0;month<60;month++){loan=loan*(1+ASSUMPTIONS.apr/1200)-car.payment;cash-=car.fromAssets;}
   near(loan,0);near(cash,0);assert.ok(car.left>=-1e-7);
  }
 }
});
test('greater spending cannot raise a recommendation; more income/assets cannot lower it',()=>{
 for(const family of [false,true])for(const key of ['salary','assets','parents','expenses']){
  let previous=null;
  for(let value=0;value<=30000;value+=100){
   const r=recommend({...DEFAULTS,parents:100000,[key]:value},family);
   if(previous!==null)assert.ok(key==='expenses'?rank(r)<=previous:rank(r)>=previous,`${key}=${value}, family=${family}`);
   previous=rank(r);
  }
 }
});
test('spending in 1만원 steps never skips multiple price tiers, including no-car thresholds',()=>{
 let checked=0;
 for(const salary of [0,2400,5000,10000,20000,50000])for(const assets of [0,900,1800,10000,50000])for(const family of [false,true]){
  let prior=null;
  for(let expenses=0;expenses<=700;expenses++){
   const r=recommend({salary,expenses,assets,parents:400000},family);
   if(prior){assert.ok(rank(prior)-rank(r)<=1,`Skipped tiers at ${JSON.stringify({salary,assets,family,expenses})}`);assert.ok(r.monthlyLimit<=prior.monthlyLimit+1e-7);}
   prior=r;checked++;
  }
 }
 assert.equal(checked,42060);
});
test('funding headroom is continuous on both sides of reserve, surplus, and gift-allocation boundaries',()=>{
 for(const family of [false,true])for(const assets of [0,1800,50000]){
  const base={salary:10000,assets,parents:400000};
  const gift=family?8000:0;
  for(const point of [assets/6,(assets+gift)/6,10000*.8/12]){
   if(point<=0)continue;
   const lo=recommend({...base,expenses:point-.00001},family),hi=recommend({...base,expenses:point+.00001},family);
   for(let i=0;i<CARS.length;i++)assert.ok(Math.abs(lo.assessed[i].headroom-hi.assessed[i].headroom)<.01);
  }
 }
});
test('candidate order agrees with affordability and lower-price alternatives',()=>{
 for(let salary=0;salary<=30000;salary+=100){
  const r=recommend({salary,expenses:180,assets:12000,parents:0});
  if(r.next)assert.equal(r.next.affordable,false);
  for(const car of r.alternatives){assert.ok(car.affordable);assert.ok(car.price<r.best.price);assert.ok(car.monthly<=r.best.monthly+1e-7);}
 }
});
test('amortization and its inverse reconcile at zero and nonzero interest',()=>{
 assert.equal(installment(6000,0,60),100);assert.equal(installment(0),0);
 for(const principal of [100,6000,20000])near(loanCapacity(installment(principal)),principal);
});
test('invalid and extreme values remain finite and nonnegative',()=>{
 const p=normalize({salary:Infinity,assets:-500,parents:1e15,expenses:NaN});
 assert.equal(p.assets,0);assert.equal(p.parents,100000000);
 for(const input of [p,{salary:1000000,expenses:100000,assets:100000000,parents:100000000}]){
  const r=recommend(input,true);for(const car of r.assessed)for(const key of ['total','down','loan','monthly','fundingGap'])assert.ok(Number.isFinite(car[key])&&car[key]>=0);
 }
});
test('share data contains only the model and scenario, not financial inputs or URL query/hash',()=>{
 const r=recommend({salary:19876,expenses:321,assets:54321,parents:987654},true);
 const s=publicShare(r,'https://cars.example/car/?salary=19876&parents=987654#private');
 assert.equal(s.url,'https://cars.example/car/');assert.match(s.text,/부모님 지원 가정/);assert.match(s.title,new RegExp(r.best.name));
 for(const secret of ['19876','321','54321','987654','19,876','987,654'])assert.ok(!JSON.stringify(s).includes(secret));
 assert.equal(publicShare(r,'http://localhost:4173/').url,undefined);
});
test('affiliate URLs require known HTTPS Partners hosts',()=>{
 for(const url of ['', 'javascript:alert(1)','http://coupa.ng/x','https://link.coupang.com.evil.test/x','https://user:pass@link.coupang.com/a'])assert.equal(validAffiliateUrl(url),false);
 assert.equal(validAffiliateUrl('https://link.coupang.com/a/example'),true);
 assert.equal(validAffiliateUrl('https://coupa.ng/example'),true);
 assert.ok(recommendProducts({}).every(p=>!p.url));
});
