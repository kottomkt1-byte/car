// Owner-supplied destination. The illustration intentionally does not depict its contents.
export const MYSTERY_TEASER = Object.freeze({
  url: 'https://link.coupang.com/a/hYcGD9vu6C',
  image: './public/mystery-box.webp',
  disclosure: '이 링크는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.'
});

// Optional future product cards; only add links for the exact products described.
export const PRODUCTS = [
  { id: 'holder', title: '운전에 집중하는 거치대', category: '첫 차 기본템', description: '시야를 가리지 않는 위치와 내 휴대폰 크기부터 확인하세요.', icon: 'phone', tags: ['all'], url: '' },
  { id: 'care', title: '작게 시작하는 세차 키트', category: '셀프 관리', description: '큰 세트보다 극세사 타월과 기본 세정제부터.', icon: 'spark', tags: ['all'], url: '' },
  { id: 'emergency', title: '트렁크 속 비상용품', category: '출발 전 체크', description: '비상용품의 인증과 사용법, 보관기한을 확인하세요.', icon: 'shield', tags: ['all'], url: '' },
  { id: 'organizer', title: '가족 외출용 수납 정리', category: '패밀리 드라이브', description: '급정거 때 움직이지 않도록 고정 가능한 제품을 살펴보세요.', icon: 'box', tags: ['family'], url: '' },
  { id: 'outdoor', title: '주말을 위한 트렁크 매트', category: '주말 아웃도어', description: '차종별 크기와 소재, 세척 방법을 비교하세요.', icon: 'mountain', tags: ['outdoor'], url: '' },
  { id: 'electric', title: '충전 케이블 수납 가방', category: '전기차 생활', description: '보유 중인 케이블 규격과 수납 크기를 먼저 확인하세요.', icon: 'bolt', tags: ['electric'], url: '' }
];

export function validAffiliateUrl(value) {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && !u.username && !u.password &&
      (u.hostname === 'link.coupang.com' || u.hostname === 'coupa.ng');
  } catch { return false; }
}

export function recommendProducts(p, products = PRODUCTS) {
  const matches = products.filter(product => product.tags.includes('family') && p.hasChildren ||
    product.tags.includes('outdoor') && p.outdoor || product.tags.includes('electric') && p.power === 'electric');
  return [...matches, ...products.filter(product => product.tags.includes('all'))].slice(0, 3);
}
