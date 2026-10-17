import test from 'node:test';
import assert from 'node:assert/strict';
import { ASSUMPTIONS, DEFAULTS, EXAMPLES, CARS, recommend, installment, normalize } from '../src/calculator.js';
import { publicShare } from '../src/share.js';
import { validAffiliateUrl, recommendProducts } from '../src/affiliates.js';

test('four-input examples produce recognisable cars at different budgets',()=>{
 assert.equal(recommend(EXAMPLES[0]).best.id,'k3');
 assert.equal(recommend(DEFAULTS).best.id,'avante');
 assert.equal(recommend({salary:8500,expenses:250,assets:10000,parents:0}).best.id,'g80');
 assert.equal(recommend(EXAMPLES[1]).best.id,'bmw5');
 assert.equal(recommend(EXAMPLES[2]).best.id,'911');
});
test('spending and own assets each affect the recommendation',()=>{
 const baseline=recommend(EXAMPLES[1]);
 assert.ok(recommend({...EXAMPLES[1],expenses:450}).best.price<baseline.best.price);
 assert.ok(recommend({...EXAMPLES[1],assets:2000}).best.price<baseline.best.price);
});
test('parents wealth only affects the explicit hypothetical mode, capped at 1억원',()=>{
 const low={...DEFAULTS,parents:0},high={...DEFAULTS,parents:10000000};
 assert.deepEqual(recommend(low).best,recommend(high).best);
 assert.equal(recommend(high).familySupport,0);
 assert.equal(recommend(high,true).familySupport,10000);
 assert.equal(recommend({...DEFAULTS,parents:100000},true).familySupport,2000);
 assert.ok(recommend(DEFAULTS,true).best.price>recommend(DEFAULTS).best.price);
 assert.deepEqual(recommend(low,true).best,recommend(low).best);
});
test('no car is forced when income, monthly surplus or emergency savings are insufficient',()=>{
 for(const input of [{...DEFAULTS,salary:0},{...DEFAULTS,expenses:400},{...DEFAULTS,assets:800},{salary:1200,expenses:0,assets:10000,parents:0}])assert.equal(recommend(input).best,null);
});
test('recommended car and alternatives fit monthly spending cap; the next car does not',()=>{
 for(let salary=1000;salary<=25000;salary+=500){
  const result=recommend({salary,expenses:180,assets:12000,parents:0});
  if(result.best){for(const car of [result.best,...result.alternatives]){assert.ok(car.monthly<=result.monthlyLimit+1e-7);assert.ok(car.left>=0);assert.ok(car.affordable);}assert.ok(result.alternatives.every(c=>c.price<result.best.price));}
  if(result.next)assert.equal(result.next.affordable,false);
 }
});
test('increasing salary or liquid assets cannot lower a recommendation',()=>{
 for(const key of ['salary','assets']){let last=-1;for(let value=0;value<=30000;value+=500){const result=recommend({...DEFAULTS,[key]:value});const index=result.best?CARS.findIndex(car=>car.id===result.best.id):-1;assert.ok(index>=last);last=index;}}
});
test('purchase cash and financing reconcile including fees',()=>{
 const r=recommend(EXAMPLES[1]),car=r.best;
 assert.equal(r.reserve,1500);assert.equal(r.ownCash,2975);
 assert.ok(Math.abs(car.down+car.loan-(car.price*1.07+30))<1e-8);
 assert.ok(Math.abs(car.monthly-car.payment-car.running)<1e-8);
 const paidCash=recommend({...EXAMPLES[2],assets:1000000}).best;
 assert.equal(paidCash.loan,0);assert.equal(paidCash.payment,0);assert.equal(paidCash.monthly,paidCash.running);
});
test('loan repayment works for zero interest and standard APR',()=>{
 assert.equal(installment(6000,0,60),100);assert.equal(installment(0),0);
 const payment=installment(6000);let balance=6000;
 for(let i=0;i<ASSUMPTIONS.months;i++)balance=balance*(1+ASSUMPTIONS.apr/1200)-payment;
 assert.ok(Math.abs(balance)<1e-7);
});
test('invalid values are bounded and calculation stays finite',()=>{
 const p=normalize({salary:Infinity,assets:-500,parents:1e15,expenses:NaN});
 assert.equal(p.assets,0);assert.equal(p.parents,100000000);
 const r=recommend(p,true);for(const car of r.assessed)for(const key of ['total','down','loan','monthly','left'])assert.ok(Number.isFinite(car[key]));
});
test('share data contains model and scenario, never entered financial values or query/hash',()=>{
 const r=recommend({salary:19876,expenses:321,assets:54321,parents:987654},true);
 const s=publicShare(r,'https://cars.example/car/?salary=19876&parents=987654#private');
 assert.equal(s.url,'https://cars.example/car/');assert.match(s.text,/부모님 지원 가정/);assert.match(s.title,new RegExp(r.best.name));
 for(const secret of ['19876','321','54321','987654','19,876','987,654'])assert.ok(!JSON.stringify(s).includes(secret));
 assert.equal(publicShare(r,'http://localhost:4173/').url,undefined);
 assert.equal(publicShare(r,'file:///tmp/preview.html').url,undefined);
});
test('affiliate links require known HTTPS Partners hosts',()=>{
 for(const url of ['', 'javascript:alert(1)','http://coupa.ng/x','https://link.coupang.com.evil.test/x','https://user:pass@link.coupang.com/a'])assert.equal(validAffiliateUrl(url),false);
 assert.equal(validAffiliateUrl('https://link.coupang.com/a/example'),true);
 assert.equal(validAffiliateUrl('https://coupa.ng/example'),true);
 assert.ok(recommendProducts({}).every(product=>!product.url));
});
