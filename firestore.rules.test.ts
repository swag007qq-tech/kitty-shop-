/**
 * Adversarial payload regression specification for firestore.rules.
 * Documents the 12 "Dirty Dozen" invariants enforced by Firestore rules.
 */
export const DIRTY_DOZEN_PAYLOADS = [
  {
    name: 'Unauthenticated create on /products/cow-1',
    path: 'products/cow-1',
    auth: null,
    expected: 'PERMISSION_DENIED',
  },
  {
    name: 'Non-admin authenticated create on /products/cow-1',
    path: 'products/cow-1',
    auth: {uid: 'user-2', email: 'visitor@example.com', email_verified: true},
    expected: 'PERMISSION_DENIED',
  },
  {
    name: 'Unverified admin email spoof on /products/cow-1',
    path: 'products/cow-1',
    auth: {uid: 'spoof', email: 'kseniya.polishchuk33@gmail.com', email_verified: false},
    expected: 'PERMISSION_DENIED',
  },
  {
    name: 'Shadow field injection (isFeatured: true)',
    path: 'products/cow-1',
    payload: {id: 'cow-1', game: 'adopt-me', title: 'Cow', isFeatured: true},
    expected: 'PERMISSION_DENIED',
  },
  {
    name: 'Client-forged createdAt timestamp on create',
    path: 'products/cow-1',
    payload: {id: 'cow-1', createdAt: '2020-01-01T00:00:00Z'},
    expected: 'PERMISSION_DENIED',
  },
  {
    name: 'Mutating immutable createdAt during update',
    path: 'products/cow-1',
    payload: {createdAt: '2020-01-01T00:00:00Z'},
    expected: 'PERMISSION_DENIED',
  },
  {
    name: 'Negative stock value (-5)',
    path: 'products/cow-1',
    payload: {stock: -5},
    expected: 'PERMISSION_DENIED',
  },
  {
    name: 'Empty prices map or unsupported currency RUB',
    path: 'products/cow-1',
    payload: {prices: {RUB: 100}},
    expected: 'PERMISSION_DENIED',
  },
  {
    name: 'Oversized title (> 140 chars)',
    path: 'products/cow-1',
    payload: {title: 'A'.repeat(141)},
    expected: 'PERMISSION_DENIED',
  },
  {
    name: 'Adopt Me product with empty rarities array',
    path: 'products/cow-1',
    payload: {game: 'adopt-me', rarities: []},
    expected: 'PERMISSION_DENIED',
  },
  {
    name: 'Non-admin delete on /products/cow-1',
    path: 'products/cow-1',
    auth: {uid: 'user-2', email: 'visitor@example.com', email_verified: true},
    expected: 'PERMISSION_DENIED',
  },
  {
    name: 'Privilege escalation into /admins/{uid}',
    path: 'admins/user-2',
    auth: {uid: 'user-2', email: 'visitor@example.com', email_verified: true},
    expected: 'PERMISSION_DENIED',
  },
];
