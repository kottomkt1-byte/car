import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, PRESETS, normalize, calculate, analyzeCar, payment, presentValue, loanBalance } from '../src/calculator.js';
import { publicShare } from '../src/share.js';
import { PRODUCTS, validAffiliateUrl, recommendProducts } from '../src/affiliates.js';

const close = (actual, expected, tolerance = 1e-7) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} differs from ${expected}`);

test('zero-interest installment and one-month interest are correct', () => {
  close(payment(1200, 0, 12), 100);
  close(payment(1000, 12, 1), 1010);
  close(payment(0, 5, 36), 0);
  close(payment(1000, 5, 0), 0);
});

test('loan current value reverses its installment across rates and terms', () => {
  for (const apr of [0, 0.1, 5.5, 20, 40]) for (const months of [1, 24, 48, 84, 120]) {
    close(presentValue(payment(3500, apr, months), apr, months), 3500);
  }
});

test('remaining debt matches a separately iterated amortization schedule', () => {
  const principal = 4100; const apr = 6.5; const term = 84; const paid = 60;
  let outstanding = principal;
  for (let month = 0; month < paid; month++) outstanding = outstanding * (1 + apr / 1200) - payment(principal, apr, term);
  close(loanBalance(principal, apr, term, paid), outstanding);
  close(loanBalance(principal, apr, term, term), 0);
  close(loanBalance(principal, 0, term, 42), principal / 2);
});

test('monthly disposable income subtracts every recurring commitment exactly once', () => {
  const r = calculate({ netMonthly: 400, otherIncome: 50, living: 100, housing: 60, debtPayment: 30, familyExpense: 20, saving: 80 });
  close(r.income, 450); close(r.essentials, 210); close(r.freeCash, 160);
  close(r.safeMonthly, 90);
});

test('salary estimation uses the explicit rate; direct income ignores gross salary', () => {
  close(calculate({ incomeMode: 'gross', annualSalary: 6000, netRate: 80 }).income, 400);
  close(calculate({ incomeMode: 'net', annualSalary: 100000, netMonthly: 370 }).income, 370);
});

test('protected cash is not put into a car', () => {
  const r = calculate({ cash: 5000, investments: 1000, investmentUse: 40, protectedSavings: 1000, living: 100, housing: 50, debtPayment: 0, familyExpense: 0, reserveMonths: 6, assetUse: 50 });
  close(r.liquidAssets, 5400); close(r.reserve, 1900); close(r.selfCash, 1750);
});

test('parent assets and unconfirmed support cannot increase affordability', () => {
  const base = calculate();
  const parents = calculate({ parentAssets: 100000, familySupport: 10000, supportConfirmed: false });
  close(parents.safePrice, base.safePrice); close(parents.netWorth, base.netWorth); close(parents.support, 0);
});

test('confirmed support increases upfront funds without pretending to be monthly income', () => {
  const base = calculate(); const supported = calculate({ familySupport: 1000, supportConfirmed: true });
  close(supported.upfront - base.upfront, 1000);
  close(supported.safePrice - base.safePrice, 1000 / 1.07);
  close(supported.income, base.income); close(supported.independentPrice, base.safePrice);
});

test('illiquid property changes net worth but cannot inflate purchase cash', () => {
  const base = calculate(); const property = calculate({ realEstate: 50000 });
  close(property.safePrice, base.safePrice); close(property.netWorth - base.netWorth, 50000);
});

test('trade-in only contributes equity after the existing vehicle loan is repaid', () => {
  const base = calculate(); const r = calculate({ tradeIn: 1500, tradeInLoan: 900 });
  close(r.tradeEquity, 600); close(r.upfront - base.upfront, 600); close(r.netWorth - base.netWorth, 600);
});

test('unfunded negative vehicle equity blocks the recommended purchase', () => {
  const r = calculate({ tradeIn: 200, tradeInLoan: 10000 });
  assert.ok(r.equityShortfall > 0); close(r.safePrice, 0); assert.equal(r.dream.status, 'over');
});

test('reserve deficits cannot be presented as a safe budget', () => {
  const r = calculate({ cash: 0, investments: 0, protectedSavings: 1000 });
  assert.ok(r.reserveShortfall > 0); close(r.safePrice, 0);
});

test('insufficient recurring income means no safe vehicle budget even with assets', () => {
  const r = calculate({ netMonthly: 100, cash: 100000 });
  close(r.safePrice, 0); assert.ok(r.freeCash < 0); assert.equal(r.persona.id, 'pause');
});

test('safe budget respects both upfront funds and the monthly payment cap', () => {
  const r = calculate(); const car = analyzeCar(r.safePrice, r);
  close(car.monthly, r.safeMonthly); close(car.down, r.upfront);
  assert.ok(car.remainder >= 0); assert.ok(r.stretchPrice >= r.safePrice);
});

test('cash-only purchases expose funding deficits rather than inventing a loan', () => {
  const r = calculate({ term: 0, dreamPrice: 10000 });
  close(r.dream.loan, 0); close(r.dream.installment, 0);
  assert.ok(r.dream.cashNeeded > 0); assert.equal(r.dream.status, 'over');
  close(r.safePrice, (r.upfront - r.p.registration) / 1.07);
});

test('electricity uses km per kWh and won per kWh with the right monetary unit', () => {
  const r = calculate({ power: 'electric', annualKm: 12000, efficiency: 5, energyPrice: 300 });
  close(r.energy, 6);
});

test('ownership cost balances purchase cash, payments, sale and remaining debt', () => {
  const r = calculate({ term: 84, ownershipYears: 5, dreamPrice: 6000 });
  const d = r.dream; const months = 60;
  const cashFlowTotal = d.down + d.installment * months + d.remainingLoan - d.residual + r.operating * months;
  close(d.totalOwnership, cashFlowTotal);
  assert.ok(d.remainingLoan > 0); assert.ok(d.interestDuringOwnership < d.totalInterest);
});

test('ownership cost after the loan ends does not add phantom installments', () => {
  const r = calculate({ term: 24, ownershipYears: 5 }); const d = r.dream;
  close(d.totalOwnership, d.down + d.installment * 24 - d.residual + r.operating * 60);
  close(d.remainingLoan, 0); close(d.interestDuringOwnership, d.totalInterest);
});

test('zero vehicle price means no vehicle costs or fees', () => {
  const r = calculate({ dreamPrice: 0 });
  close(r.dream.totalPurchase, 0); close(r.dream.monthly, 0); close(r.dream.totalOwnership, 0);
  close(r.stressRemainder, r.income * 0.8 - r.essentials - r.p.saving);
});

test('lower operating expense and higher income cannot lower a safe budget', () => {
  const base = calculate();
  assert.ok(calculate({ parking: 0 }).safePrice >= base.safePrice);
  assert.ok(calculate({ netMonthly: 500 }).safePrice >= base.safePrice);
  assert.ok(calculate({ saving: 100 }).safePrice <= base.safePrice);
});

test('boundary and malformed numbers remain finite and within accepted bounds', () => {
  const p = normalize({ annualKm: -1, efficiency: 0, apr: Infinity, cash: NaN, netMonthly: 'bad', parentAssets: 1e300 });
  close(p.annualKm, 0); close(p.efficiency, 0.1); close(p.apr, DEFAULTS.apr);
  close(p.parentAssets, 100000000);
  for (const result of [calculate(p), ...Object.values(PRESETS).map(calculate)]) {
    for (const [key, value] of Object.entries(result)) if (typeof value === 'number') assert.ok(Number.isFinite(value), key);
  }
});

test('sharing strips query/hash and never contains financial or family details', () => {
  const result = calculate({ annualSalary: 8765, cash: 45678, parentAssets: 987654, familySupport: 12345 });
  const share = publicShare(result, 'https://example.com/car/?salary=8765&parentAssets=987654#cash=45678');
  assert.equal(share.url, 'https://example.com/car/');
  for (const privateValue of ['8765', '45678', '987654', '12345']) assert.ok(!JSON.stringify(share).includes(privateValue));
  assert.deepEqual(Object.keys(share), ['title', 'text', 'url']);
});

test('affiliate URLs reject executable, spoofed, credentialed and insecure destinations', () => {
  for (const url of ['', 'javascript:alert(1)', 'http://link.coupang.com/a/abc', 'https://link.coupang.com.evil.test/a/abc', 'https://user:pass@link.coupang.com/a/abc']) assert.equal(validAffiliateUrl(url), false);
  assert.equal(validAffiliateUrl('https://link.coupang.com/a/real-link'), true);
  assert.equal(validAffiliateUrl('https://coupa.ng/real-link'), true);
  assert.ok(PRODUCTS.every(product => !validAffiliateUrl(product.url)), 'No simulated monetization URLs shipped');
});

test('local previews never share local file paths or localhost URLs', () => {
  for (const url of ['file:///Users/owner/private/car.html', 'http://localhost:4173', 'http://127.0.0.1:4173']) {
    assert.equal(publicShare(calculate(), url).url, undefined);
  }
});

test('lifestyle selects relevant categories without taking financial data', () => {
  const products = recommendProducts({ hasChildren: true, outdoor: true, power: 'electric' });
  assert.deepEqual(products.map(product => product.id), ['organizer', 'outdoor', 'electric']);
  assert.equal(recommendProducts({}).length, 3);
});
