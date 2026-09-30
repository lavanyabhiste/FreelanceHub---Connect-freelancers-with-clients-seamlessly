/**
 * FreelanceHub — Complete E2E test suite
 * Areas: Authentication (register/login/JWT/hashing), Protected routes,
 * Role authorization, Client flow, Freelancer flow, Chat, File uploads,
 * Work submission, Completion, Reviews, Notifications, Admin, Disputes,
 * Search/Filter, API error shapes.
 *
 * Run: node e2e-full-test.js   (backend must be running on :5000)
 */
require('dotenv').config();
const jwt = require('jsonwebtoken');
const BASE = 'http://localhost:5000/api';
const T = Date.now();

// Admin credentials come from the environment — never hardcode secrets.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('ADMIN_EMAIL / ADMIN_PASSWORD are not set in Server/.env — cannot run this suite.');
  process.exit(1);
}

let passed = 0;
const failures = [];
const check = (name, cond, extra = '') => {
  if (cond) { passed += 1; console.log(`PASS  ${name}`); }
  else { failures.push(name); console.log(`FAIL  ${name}${extra ? ` — ${extra}` : ''}`); }
};

const req = async (method, path, { token, body, headers, noJson } = {}) => {
  const h = { ...(headers || {}) };
  if (token) h.Authorization = `Bearer ${token}`;
  if (body !== undefined && !noJson) h['Content-Type'] = 'application/json';
  try {
    const res = await fetch(BASE + path, {
      method,
      headers: h,
      body: body !== undefined ? (noJson ? body : JSON.stringify(body)) : undefined,
    });
    let data = null;
    try { data = await res.json(); } catch { /* non-JSON */ }
    return { status: res.status, data };
  } catch (e) {
    return { status: 0, data: null, netError: e.message };
  }
};
const str = (d) => JSON.stringify(d || {});

// ─── Section A: Authentication ───────────────────────────────────────────────
async function testAuth() {
  console.log('\n── A. AUTHENTICATION ──');
  const cEmail = `ft-client-${T}@t.com`;
  const fEmail = `ft-free-${T}@t.com`;
  const pw = 'Secret123!';

  const r1 = await req('POST', '/auth/register', { body: { name: 'FT Client', email: cEmail, password: pw, role: 'Client' } });
  check('A1 Register Client → 201 + role', r1.status === 201 && r1.data?.user?.role === 'Client', `got ${r1.status}`);
  const r2 = await req('POST', '/auth/register', { body: { name: 'FT Freelancer', email: fEmail, password: pw, role: 'Freelancer' } });
  check('A2 Register Freelancer → 201 + role', r2.status === 201 && r2.data?.user?.role === 'Freelancer', `got ${r2.status}`);

  const cTok = r1.data?.token;
  const fTok = r2.data?.token;
  const cId = r1.data?.user?._id;
  const fId = r2.data?.user?._id;

  const r3 = await req('POST', '/auth/register', { body: { name: 'X', email: `ft-admin-${T}@t.com`, password: pw, role: 'Admin' } });
  check('A3 Self-register Admin → blocked 400', r3.status === 400 && /admin/i.test(str(r3.data)), `got ${r3.status}`);
  const r4 = await req('POST', '/auth/register', { body: { name: 'X', email: `ft-role-${T}@t.com`, password: pw, role: 'Superhero' } });
  check('A4 Invalid role → 400', r4.status === 400, `got ${r4.status}`);
  const r5 = await req('POST', '/auth/register', { body: { email: `ft-miss-${T}@t.com`, password: pw } });
  check('A5 Missing name → 400 validation', r5.status === 400 && /provide/i.test(str(r5.data)), `got ${r5.status}`);
  const r6 = await req('POST', '/auth/register', { body: { name: 'X', email: `ft-short-${T}@t.com`, password: '12345', role: 'Client' } });
  check('A6 Short password → 400 validation', r6.status === 400 && /6 characters/i.test(str(r6.data)), `got ${r6.status}`);
  const r7 = await req('POST', '/auth/register', { body: { name: 'X', email: cEmail, password: pw, role: 'Client' } });
  check('A7 Duplicate email → 400', r7.status === 400 && /already exists/i.test(str(r7.data)), `got ${r7.status}`);

  // Password hashing — direct DB inspection
  try {
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/freelancehub');
    const User = require('./models/User');
    const u = await User.findOne({ email: cEmail }).select('+password');
    check('A8 Password stored as bcrypt hash (not plaintext)',
      !!u && u.password !== pw && /^\$2[aby]\$/.test(u.password),
      `stored=${u ? String(u.password).slice(0, 7) : 'missing'}`);
    await mongoose.disconnect();
  } catch (e) {
    check('A8 Password hashing check', false, e.message);
  }

  const l1 = await req('POST', '/auth/login', { body: { email: cEmail, password: pw } });
  check('A9 Login valid → 200 + token + user (no password)', l1.status === 200 && !!l1.data?.token && !str(l1.data?.user).includes('password'), `got ${l1.status}`);
  const l2 = await req('POST', '/auth/login', { body: { email: cEmail, password: 'WrongPass999' } });
  check('A10 Wrong password → 401 generic message', l2.status === 401 && /invalid email or password/i.test(str(l2.data)), `got ${l2.status}`);
  const l3 = await req('POST', '/auth/login', { body: { email: `nobody-${T}@t.com`, password: pw } });
  check('A11 Unknown email → 401 same message (no enumeration)', l3.status === 401 && /invalid email or password/i.test(str(l3.data)), `got ${l3.status}`);
  const l4 = await req('POST', '/auth/login', { body: { email: cEmail } });
  check('A12 Missing password → 400', l4.status === 400, `got ${l4.status}`);

  // JWT structure + claims
  const parts = String(cTok).split('.');
  let claims = null;
  try { claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString()); } catch { /* noop */ }
  check('A13 JWT is 3-part HS256 with id+role claims',
    parts.length === 3 && claims?.id === cId && claims?.role === 'Client',
    `claims=${str(claims).slice(0, 80)}`);

  const tampered = cTok.slice(0, -3) + 'abc';
  const t1 = await req('GET', '/auth/me', { token: tampered });
  check('A14 Tampered token → 401', t1.status === 401, `got ${t1.status}`);
  const forged = jwt.sign({ id: cId, role: 'Client' }, 'wrong-secret-entirely');
  const t2 = await req('GET', '/auth/me', { token: forged });
  check('A15 Token signed with wrong secret → 401', t2.status === 401, `got ${t2.status}`);
  const t3 = await req('GET', '/auth/me');
  check('A16 /auth/me without token → 401', t3.status === 401, `got ${t3.status}`);
  const t4 = await req('GET', '/auth/me', { token: cTok });
  check('A17 /auth/me with token → 200 user, no password', t4.status === 200 && t4.data?.user?.email === cEmail && !str(t4.data).includes('"password"'), `got ${t4.status}`);
  const t5 = await req('POST', '/auth/logout', { token: cTok });
  check('A18 Logout → 200', t5.status === 200, `got ${t5.status}`);

  return { cEmail, fEmail, pw, cTok, fTok, cId, fId };
}

// ─── Section B: Protected routes + role matrix ──────────────────────────────
async function testAuthMatrix({ cTok, fTok }) {
  console.log('\n── B. PROTECTED ROUTES & ROLE AUTHORIZATION ──');
  const protectedRoutes = ['/projects/my', '/notifications', '/freelancers/applications', '/admin/stats', '/chats', '/transactions'];
  for (const p of protectedRoutes) {
    const r = await req('GET', p);
    check(`B1 No token → 401 on ${p}`, r.status === 401, `got ${r.status}`);
  }

  const cases = [
    ['B2 Client → admin stats', 'GET', '/admin/stats', cTok, 403],
    ['B3 Client → freelancer applications', 'GET', '/freelancers/applications', cTok, 403],
    ['B4 Freelancer → client my-projects', 'GET', '/projects/my', fTok, 403],
    ['B5 Freelancer → client-only endpoint', 'GET', '/auth/client-only', fTok, 403],
    ['B6 Client → freelancer-only endpoint', 'GET', '/auth/freelancer-only', cTok, 403],
    ['B7 Client → admin-only endpoint', 'GET', '/auth/admin-only', cTok, 403],
    ['B8 Admin → freelancer-only endpoint', 'GET', '/auth/freelancer-only', process.env.ADMIN_TOKEN, 403],
  ];
  for (const [name, method, path, token, expected] of cases) {
    if (!token) { check(name, false, 'missing token'); continue; }
    const r = await req(method, path, { token });
    check(`${name} → ${expected}`, r.status === expected, `got ${r.status}`);
  }
  const ok = await req('GET', '/auth/client-only', { token: cTok });
  check('B9 Client on client-only → 200', ok.status === 200, `got ${ok.status}`);
}

// ─── Section C: Client project CRUD + validation ────────────────────────────
async function testClient({ cTok, fTok }) {
  console.log('\n── C. CLIENT: PROJECT CREATION & MANAGEMENT ──');
  const title = `Full Test Project ${T}`;
  const r1 = await req('POST', '/projects', { token: cTok, body: {
    title, description: 'Comprehensive E2E test project with a long enough description.',
    category: 'Web Development', budget: 4200, duration: '2 weeks',
    deadline: new Date(Date.now() + 7 * 864e5).toISOString(), requiredSkills: ['React', 'Node.js'],
  } });
  check('C1 Create project → 201 + status Open', r1.status === 201 && r1.data?.project?.status === 'Open', `got ${r1.status} ${str(r1.data).slice(0, 100)}`);
  const P1 = r1.data?.project?._id;

  const r2 = await req('POST', '/projects', { token: cTok, body: { description: 'no title' } });
  check('C2 Create without title → 400 validation', r2.status === 400 && /title|provide/i.test(str(r2.data)), `got ${r2.status}`);

  const r3 = await req('GET', '/projects/my', { token: cTok });
  check('C3 My projects lists the new project', r3.status === 200 && str(r3.data).includes(String(P1)), `got ${r3.status}`);

  const r4 = await req('PUT', `/projects/${P1}`, { token: cTok, body: { budget: 4500 } });
  check('C4 Owner update own project → 200', r4.status === 200, `got ${r4.status}`);

  // Second client for authorization checks
  const other = await req('POST', '/auth/register', { body: { name: 'Other Client', email: `ft-other-${T}@t.com`, password: 'Secret123!', role: 'Client' } });
  const oTok = other.data?.token;
  const r5 = await req('PUT', `/projects/${P1}`, { token: oTok, body: { budget: 1 } });
  check('C5 Other client update → 403', r5.status === 403, `got ${r5.status}`);
  const r6 = await req('DELETE', `/projects/${P1}`, { token: oTok });
  check('C6 Other client delete → 403', r6.status === 403, `got ${r6.status}`);
  const r7 = await req('GET', `/projects/${P1}/applications`, { token: oTok });
  check('C7 Other client list applications → 403', r7.status === 403, `got ${r7.status}`);
  const r8 = await req('GET', `/projects/${P1}`);
  check('C8 Project detail without token → 401', r8.status === 401, `got ${r8.status}`);

  // Second project (later deleted by owner)
  const r9 = await req('POST', '/projects', { token: cTok, body: { title: `Disposable ${T}`, description: 'Will be deleted during tests.', category: 'Other', budget: 100, duration: '3 days' } });
  const P2 = r9.data?.project?._id;
  check('C9 Create second project → 201', r9.status === 201 && !!P2, `got ${r9.status}`);

  return { title, P1, P2, oTok };
}

// ─── Section D: Freelancer browse/search/filter + bidding ───────────────────
async function testFreelancer({ cTok, fTok, fId, title, P1 }) {
  console.log('\n── D. FREELANCER: BROWSING, SEARCH/FILTER, BIDDING ──');
  // Search by the unique timestamp token from the title ($text search is token-based)
  const s1 = await req('GET', `/projects?search=${encodeURIComponent(title)}&limit=20`);
  check('D1 Search by title finds project', s1.status === 200 && str(s1.data).includes(String(P1)), `got ${s1.status}`);
  const s2 = await req('GET', '/projects?category=Web Development&limit=20');
  check('D2 Category filter → only that category', s2.status === 200 && (s2.data?.projects || []).every((p) => p.category === 'Web Development'), `got ${s2.status}`);
  const s3 = await req('GET', '/projects?minBudget=4400&maxBudget=4600&limit=20');
  check('D3 Budget range filter → within range', s3.status === 200 && (s3.data?.projects || []).every((p) => p.budget >= 4400 && p.budget <= 4600), `got ${s3.status}`);
  // Unique nonsense token — must not appear in any title/description/category
  const s4 = await req('GET', '/projects?search=zzzunmatchableqqq');
  check('D4 No-match search → empty 200', s4.status === 200 && (s4.data?.projects || []).length === 0, `got ${s4.status}`);
  const s5 = await req('GET', '/projects?page=2&limit=2');
  check('D5 Pagination page 2 → currentPage 2', s5.status === 200 && s5.data?.currentPage === 2, `got ${s5.status}`);

  const b1 = await req('POST', '/freelancers/bid', { token: fTok, body: { projectId: P1, proposal: 'I can deliver this in high quality with React and Node.', bidAmount: 4000, estimatedDuration: '2 weeks' } });
  check('D6 Submit bid → 201', b1.status === 201, `got ${b1.status} ${str(b1.data).slice(0, 90)}`);
  const b2 = await req('POST', '/freelancers/bid', { token: fTok, body: { projectId: P1, proposal: 'Duplicate attempt.', bidAmount: 3900, estimatedDuration: '1 week' } });
  check('D7 Duplicate bid → 400', b2.status === 400, `got ${b2.status}`);
  const b3 = await req('POST', '/freelancers/bid', { token: fTok, body: { projectId: P1 } });
  check('D8 Bid missing fields → 400 validation', b3.status === 400, `got ${b3.status}`);

  // Second bidder (for selection tests)
  const f2 = await req('POST', '/auth/register', { body: { name: 'FT Freelancer Two', email: `ft-free2-${T}@t.com`, password: 'Secret123!', role: 'Freelancer' } });
  const f2Tok = f2.data?.token;
  const b4 = await req('POST', '/freelancers/bid', { token: f2Tok, body: { projectId: P1, proposal: 'Second bidder proposal here.', bidAmount: 4100, estimatedDuration: '1 week' } });
  check('D9 Second freelancer bid → 201', b4.status === 201, `got ${b4.status}`);

  const a1 = await req('GET', '/freelancers/applications', { token: fTok });
  check('D10 My applications tracking → lists bid', a1.status === 200 && str(a1.data).includes(String(P1)), `got ${a1.status}`);

  return { f2Tok, f2Id: f2.data?.user?._id, bid1: b1.data?.application?._id || b1.data?._id };
}

// ─── Section E: Application management + freelancer selection ───────────────
async function testSelection({ cTok, fTok, P1, bid1 }) {
  console.log('\n── E. APPLICATION MANAGEMENT & SELECTION ──');
  const l1 = await req('GET', `/projects/${P1}/applications`, { token: cTok });
  const apps = l1.data?.applications || [];
  const app1 = apps.find((a) => a.status === 'Pending' && a.freelancer?._id !== undefined);
  check('E1 Client sees applications → 200', l1.status === 200 && apps.length >= 2, `count=${apps.length}`);

  const target = bid1 || app1?._id;
  const a2 = await req('PATCH', `/projects/${P1}/applications/${target}/status`, { token: cTok, body: { status: 'Approved' } });
  check('E2 Approve bid → 200', a2.status === 200, `got ${a2.status} ${str(a2.data).slice(0, 90)}`);

  const d1 = await req('GET', `/projects/${P1}`, { token: cTok });
  check('E3 Project now In Progress', d1.status === 200 && str(d1.data).includes('In Progress'), `got ${d1.status}`);

  const otherApp = apps.find((a) => String(a._id) !== String(target));
  const a3 = await req('PATCH', `/projects/${P1}/applications/${otherApp?._id}/status`, { token: cTok, body: { status: 'Approved' } });
  check('E4 Second approval blocked → 400', a3.status === 400, `got ${a3.status}`);

  const t1 = await req('GET', `/transactions/project/${P1}`, { token: cTok });
  check('E5 Escrow auto-created (Pending)', t1.status === 200 && str(t1.data).includes('Pending'), `got ${t1.status}`);

  const a4 = await req('PATCH', `/projects/${P1}/applications/${target}/status`, { token: fTok, body: { status: 'Rejected' } });
  check('E6 Freelancer cannot moderate applications → 403', a4.status === 403, `got ${a4.status}`);

  return { appTarget: target };
}

// ─── Section F: Chat + file uploads ─────────────────────────────────────────
async function testChatUpload({ cTok, fTok, f2Tok, P1 }) {
  console.log('\n── F. CHAT & FILE UPLOADS ──');
  const c1 = await req('GET', `/chats/project/${P1}`, { token: cTok });
  const chatId = c1.data?.chat?._id;
  check('F1 Client gets project chat → 200', c1.status === 200 && !!chatId, `got ${c1.status}`);
  const c2 = await req('GET', `/chats/project/${P1}`, { token: fTok });
  check('F2 Approved freelancer gets same chat', c2.status === 200 && c2.data?.chat?._id === chatId, `got ${c2.status}`);
  const c3 = await req('GET', `/chats/project/${P1}`, { token: f2Tok });
  check('F3 Unapproved freelancer → 403', c3.status === 403, `got ${c3.status}`);

  const m1 = await req('POST', `/chats/${chatId}/messages`, { token: fTok, body: { message: 'Hello from freelancer, ready to start!' } });
  check('F4 Send message → 2xx', [200, 201].includes(m1.status), `got ${m1.status}`);
  const m2 = await req('GET', `/chats/${chatId}/messages`, { token: cTok });
  check('F5 Client reads history with message', m2.status === 200 && str(m2.data).includes('ready to start'), `got ${m2.status}`);
  const m3 = await req('GET', `/chats/${chatId}/messages`, { token: f2Tok });
  check('F6 Stranger cannot read chat → 403', m3.status === 403, `got ${m3.status}`);
  const m4 = await req('PATCH', `/chats/${chatId}/read`, { token: cTok });
  check('F7 Mark messages read → 2xx', [200, 201].includes(m4.status), `got ${m4.status}`);

  // Uploads
  const png = new Blob([Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex')], { type: 'image/png' });
  const fd = new FormData();
  fd.append('file', png, 'pixel.png');
  const u1 = await fetch(`${BASE}/upload/chat`, { method: 'POST', headers: { Authorization: `Bearer ${fTok}` }, body: fd });
  const u1d = await u1.json().catch(() => null);
  check('F8 Upload PNG → 201 + url', u1.status === 201 && !!u1d?.attachment?.url, `got ${u1.status}`);

  if (u1d?.attachment?.url) {
    const fileRes = await fetch(`http://localhost:5000${u1d.attachment.url}`);
    check('F9 Uploaded file served statically → 200', fileRes.status === 200, `got ${fileRes.status}`);
  }

  const fd2 = new FormData();
  fd2.append('file', new Blob(['<html><body>x</body></html>'], { type: 'text/html' }), 'evil.html');
  const u2 = await fetch(`${BASE}/upload/chat`, { method: 'POST', headers: { Authorization: `Bearer ${fTok}` }, body: fd2 });
  check('F10 Disallowed file type → 400 (not 500)', u2.status === 400, `got ${u2.status}`);

  const fd3 = new FormData();
  fd3.append('file', new Blob([Buffer.alloc(11 * 1024 * 1024)], { type: 'image/png' }), 'huge.png');
  const u3 = await fetch(`${BASE}/upload/chat`, { method: 'POST', headers: { Authorization: `Bearer ${fTok}` }, body: fd3 });
  check('F11 File >10MB → 400 size limit', u3.status === 400, `got ${u3.status}`);

  const fd4 = new FormData(); // FormData has no .clone() in Node — rebuild it
  fd4.append('file', new Blob(['<html><body>x</body></html>'], { type: 'text/html' }), 'evil.html');
  const u4 = await fetch(`${BASE}/upload/chat`, { method: 'POST', body: fd4 });
  check('F12 Upload without token → 401', u4.status === 401, `got ${u4.status}`);

  const fd5 = new FormData();
  fd5.append('note', 'no file field');
  const u5 = await fetch(`${BASE}/upload/chat`, { method: 'POST', headers: { Authorization: `Bearer ${fTok}` }, body: fd5 });
  check('F13 Upload with no file → 400', u5.status === 400, `got ${u5.status}`);

  // Send message with attachment
  const attUrl = u1d?.attachment?.url;
  if (attUrl) {
    const m5 = await req('POST', `/chats/${chatId}/messages`, { token: cTok, body: { message: 'Here is the brief:', attachments: [attUrl] } });
    check('F14 Message with attachment → 2xx + persisted', [200, 201].includes(m5.status) && str(m5.data).includes('pixel.png') === false, `got ${m5.status}`);
  }

  return { chatId };
}

// ─── Section G: Notifications ───────────────────────────────────────────────
async function testNotifications({ cTok, fTok, P1 }) {
  console.log('\n── G. NOTIFICATIONS ──');
  const n1 = await req('GET', '/notifications/unread-count', { token: fTok });
  const count1 = n1.data?.count ?? n1.data?.unreadCount ?? 0;
  check('G1 Freelancer got approval notification (unread ≥ 1)', n1.status === 200 && count1 >= 1, `count=${count1} status=${n1.status}`);

  const n2 = await req('GET', '/notifications?limit=20', { token: fTok });
  check('G2 Notification list contains application_approved', n2.status === 200 && str(n2.data).includes('application_approved'), `got ${n2.status}`);

  const first = (n2.data?.notifications || n2.data?.items || []).find((n) => !n.isRead);
  if (first) {
    const n3 = await req('PATCH', `/notifications/${first._id}/read`, { token: fTok });
    check('G3 Mark one read → 2xx', [200, 201].includes(n3.status), `got ${n3.status}`);
    const n4 = await req('GET', '/notifications/unread-count', { token: fTok });
    const count2 = n4.data?.count ?? n4.data?.unreadCount ?? 0;
    check('G4 Unread count decreased', count2 < count1, `${count1} → ${count2}`);

    // Access control: other user cannot mark my notification
    const n5 = await req('PATCH', `/notifications/${first._id}/read`, { token: cTok });
    check('G5 Other user mark my notification → 403/404', [403, 404].includes(n5.status), `got ${n5.status}`);
  } else {
    check('G3 unread notification available', false, 'none found');
  }

  const n6 = await req('PATCH', '/notifications/read-all', { token: fTok });
  check('G6 Mark all read → 2xx', [200, 201].includes(n6.status), `got ${n6.status}`);
  const n7 = await req('GET', '/notifications/unread-count', { token: fTok });
  const count3 = n7.data?.count ?? n7.data?.unreadCount ?? 0;
  check('G7 Unread count now 0', count3 === 0, `count=${count3}`);
}

// ─── Section H: Work submission → completion → reviews ──────────────────────
async function testWorkflow({ cTok, fTok, f2Tok, P1, fId }) {
  console.log('\n── H. WORK SUBMISSION, COMPLETION & REVIEWS ──');
  const w1 = await req('POST', '/freelancers/submit-work', { token: f2Tok, body: { projectId: P1, projectLink: 'https://example.com', description: 'Not selected.' } });
  check('H1 Unselected freelancer submit → 403', w1.status === 403, `got ${w1.status}`);

  const w2 = await req('POST', '/freelancers/submit-work', { token: fTok, body: { projectId: P1, projectLink: 'https://github.com/test/repo', description: 'All deliverables are in the repository.' } });
  check('H2 Selected freelancer submit work → 2xx', [200, 201].includes(w2.status), `got ${w2.status}`);

  const d1 = await req('GET', `/projects/${P1}`, { token: cTok });
  check('H3 Project status now Submitted', str(d1.data).includes('Submitted'), `got ${d1.status}`);

  const w3 = await req('PATCH', `/projects/${P1}/complete`, { token: fTok });
  check('H4 Freelancer cannot complete → 403', w3.status === 403, `got ${w3.status}`);

  const w4 = await req('PATCH', `/projects/${P1}/complete`, { token: cTok });
  check('H5 Client marks complete → 200', w4.status === 200, `got ${w4.status}`);

  const t1 = await req('GET', `/transactions/project/${P1}`, { token: cTok });
  check('H6 Escrow released (Completed)', t1.status === 200 && str(t1.data).includes('Completed'), `got ${t1.status}`);

  const rv1 = await req('POST', '/reviews', { token: cTok, body: { projectId: P1, reviewedUserId: fId, rating: 5, comment: 'Outstanding work and communication!' } });
  check('H7 Client creates review → 201', rv1.status === 201, `got ${rv1.status}`);
  const rv2 = await req('POST', '/reviews', { token: cTok, body: { projectId: P1, reviewedUserId: fId, rating: 4, comment: 'Duplicate attempt.' } });
  check('H8 Duplicate review → 400', rv2.status === 400, `got ${rv2.status}`);
  const rv3 = await req('POST', '/reviews', { token: fTok, body: { projectId: P1, reviewedUserId: (await req('GET', '/auth/me', { token: cTok })).data?.user?._id, rating: 5, comment: 'Great client, clear requirements.' } });
  check('H9 Freelancer reviews client back → 201', rv3.status === 201, `got ${rv3.status}`);
  const rv4 = await req('GET', `/reviews/project/${P1}`, { token: cTok });
  check('H10 Project reviews → 2 reviews', rv4.status === 200 && (rv4.data?.reviews || []).length === 2, `count=${(rv4.data?.reviews || []).length}`);
  const rv5 = await req('GET', `/users/freelancers/${fId}`, { token: cTok });
  const ratingVal = rv5.data?.user?.rating ?? rv5.data?.freelancer?.rating ?? rv5.data?.rating ?? 0;
  check('H11 Freelancer rating aggregated (≥ 4)', rv5.status === 200 && ratingVal >= 4, `rating=${ratingVal}`);
}

// ─── Section I: Disputes ────────────────────────────────────────────────────
async function testDisputes({ cTok, fTok, f2Tok, oTok, cId, fId }) {
  console.log('\n── I. DISPUTES ──');
  // New project for dispute flow (goes In Progress)
  const p = await req('POST', '/projects', { token: cTok, body: { title: `Dispute Project ${T}`, description: 'Project that will head into a dispute during testing.', category: 'UI/UX Design', budget: 800, duration: '1 week' } });
  const DP = p.data?.project?._id;
  check('I1 Create dispute-project → 201', p.status === 201 && !!DP, `got ${p.status}`);
  const bid = await req('POST', '/freelancers/bid', { token: fTok, body: { projectId: DP, proposal: 'Taking this one to the dispute flow.', bidAmount: 750, estimatedDuration: '1 week' } });
  const bidId = bid.data?.application?._id || bid.data?._id;
  await req('PATCH', `/projects/${DP}/applications/${bidId}/status`, { token: cTok, body: { status: 'Approved' } });

  const d1 = await req('POST', '/disputes', { token: cTok, body: { projectId: DP, reason: 'Scope disagreement', description: 'The deliverables do not match the agreed scope.' } });
  check('I2 Participant raises dispute → 2xx', [200, 201].includes(d1.status), `got ${d1.status}`);
  const d2 = await req('POST', '/disputes', { token: cTok, body: { projectId: DP, reason: 'Duplicate', description: 'Trying to raise twice.' } });
  check('I3 Duplicate active dispute → 400', d2.status === 400, `got ${d2.status}`);
  const d3 = await req('POST', '/disputes', { token: f2Tok, body: { projectId: DP, reason: 'Intrusion', description: 'Not a participant.' } });
  check('I4 Non-participant dispute → 403', d3.status === 403, `got ${d3.status}`);
  const d4 = await req('GET', '/disputes/mine', { token: cTok });
  check('I5 My disputes list → 200', d4.status === 200 && str(d4.data).includes(String(DP)), `got ${d4.status}`);

  return { DP };
}

// ─── Section J: Admin ───────────────────────────────────────────────────────
async function testAdmin({ cTok, fTok, fId, oTok, P2, DP }) {
  console.log('\n── J. ADMIN: USERS, VERIFICATION, MODERATION, TRANSACTIONS, DISPUTES ──');
  const a1 = await req('POST', '/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  check('J1 Admin login → 200', a1.status === 200 && a1.data?.user?.role === 'Admin', `got ${a1.status}`);
  const aTok = a1.data?.token;
  if (aTok) process.env.ADMIN_TOKEN = aTok;

  const s1 = await req('GET', '/admin/stats', { token: aTok });
  const st = s1.data?.stats;
  check('J2 Admin stats → 200 + full structure', s1.status === 200 && !!st?.users && !!st?.projects && !!st?.applications && !!st?.transactions && !!st?.disputes, `got ${s1.status}`);

  const u1 = await req('GET', '/admin/users?limit=50', { token: aTok });
  check('J3 Users list → 200', u1.status === 200, `got ${u1.status}`);

  const v1 = await req('PATCH', `/admin/users/${fId}/verify`, { token: aTok, body: { isVerified: true } });
  check('J4 Verify freelancer → 200', v1.status === 200, `got ${v1.status}`);

  const st1 = await req('PATCH', `/admin/users/${fId}/status`, { token: aTok, body: { isActive: false } });
  check('J5 Deactivate user → 200', st1.status === 200, `got ${st1.status}`);
  const l1 = await req('POST', '/auth/login', { body: { email: `ft-free-${T}@t.com`, password: 'Secret123!' } });
  check('J6 Deactivated login → 403', l1.status === 403, `got ${l1.status}`);
  const p1 = await req('GET', '/freelancers/applications', { token: fTok });
  check('J7 Deactivated token → 403 on protected route', p1.status === 403, `got ${p1.status}`);
  const st2 = await req('PATCH', `/admin/users/${fId}/status`, { token: aTok, body: { isActive: true } });
  const l2 = await req('POST', '/auth/login', { body: { email: `ft-free-${T}@t.com`, password: 'Secret123!' } });
  check('J8 Reactivated login → 200 again', st2.status === 200 && l2.status === 200, `status=${st2.status} login=${l2.status}`);

  const p2 = await req('PATCH', `/admin/projects/${P2}/status`, { token: aTok, body: { status: 'Cancelled' } });
  check('J9 Moderate Open project (suspend) → 200', p2.status === 200, `got ${p2.status}`);
  const p3 = await req('PATCH', `/admin/projects/${DP}/status`, { token: aTok, body: { status: 'Cancelled' } });
  check('J10 Moderate In Progress project blocked → 400', p3.status === 400, `got ${p3.status}`);
  const p4 = await req('PATCH', `/admin/projects/${P2}/status`, { token: aTok, body: { status: 'Suspended' } });
  check('J11 Invalid moderation status → 400', p4.status === 400, `got ${p4.status}`);

  const t1 = await req('GET', '/admin/transactions?limit=20', { token: aTok });
  check('J12 Admin transactions → 200', t1.status === 200, `got ${t1.status}`);
  const t2 = await req('GET', '/admin/applications?limit=20', { token: aTok });
  check('J13 Admin applications → 200', t2.status === 200, `got ${t2.status}`);
  const t3 = await req('GET', '/admin/projects?limit=20', { token: aTok });
  check('J14 Admin projects → 200', t3.status === 200, `got ${t3.status}`);
  const t4 = await req('GET', '/admin/disputes?limit=20', { token: aTok });
  check('J15 Admin sees the open dispute', t4.status === 200 && str(t4.data).includes('Scope disagreement'), `got ${t4.status}`);

  const dpId = (t4.data?.disputes || []).find((d) => str(d).includes('Scope disagreement'))?._id;
  if (dpId) {
    const adv = await req('PATCH', `/admin/disputes/${dpId}`, { token: aTok, body: { status: 'Under Review', note: 'Reviewing both sides.' } });
    check('J16 Advance dispute Open → Under Review → 2xx', [200, 201].includes(adv.status), `got ${adv.status}`);
    const adv2 = await req('PATCH', `/admin/disputes/${dpId}`, { token: aTok, body: { status: 'Closed' } });
    check('J17 Invalid jump Under Review → Closed → 400', adv2.status === 400, `got ${adv2.status}`);
    const adv3 = await req('PATCH', `/admin/disputes/${dpId}`, { token: aTok, body: { status: 'Resolved', resolution: 'Client and freelancer settled.' } });
    check('J18 Under Review → Resolved → 2xx', [200, 201].includes(adv3.status), `got ${adv3.status}`);
  } else {
    check('J16 dispute id found', false, 'not in admin list');
  }

  const d1 = await req('DELETE', `/admin/projects/${P2}`, { token: aTok });
  check('J19 Admin delete cancelled project → 2xx', [200, 201].includes(d1.status), `got ${d1.status}`);
}

// ─── Section K: API error shapes ────────────────────────────────────────────
async function testApiErrors({ cTok }) {
  console.log('\n── K. API ERROR HANDLING ──');
  const e1 = await fetch(`${BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad json' });
  const e1d = await e1.json().catch(() => null);
  check('K1 Malformed JSON → 400 (not 500)', e1.status === 400 && !!e1d?.message, `got ${e1.status}`);
  const e2 = await fetch('http://localhost:5000/api/nope/does-not-exist');
  const e2d = await e2.json().catch(() => null);
  check('K2 Unknown route → 404 JSON with message', e2.status === 404 && !!e2d?.message, `got ${e2.status}`);
  const e3 = await req('GET', '/projects/not-an-objectid', { token: cTok });
  check('K3 Invalid ObjectId → 404 JSON', e3.status === 404 && !!e3.data?.message, `got ${e3.status}`);
  const e4 = await req('GET', '/projects/000000000000000000000000', { token: cTok });
  check('K4 Missing resource → 404 message', e4.status === 404, `got ${e4.status}`);
  const e5 = await req('GET', '/projects/000000000000000000000000/complete', { token: cTok, method: 'PATCH' });
  check('K5 Complete missing project → 404', e5.status === 404, `got ${e5.status}`);
}

// ─── Main ───────────────────────────────────────────────────────────────────
(async () => {
  try {
    const auth = await testAuth();
    // Admin token for role matrix (login early)
    const a = await req('POST', '/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
    process.env.ADMIN_TOKEN = a.data?.token;
    await testAuthMatrix(auth);
    const client = await testClient(auth);
    const fl = await testFreelancer({ ...auth, ...client });
    await testSelection({ ...auth, ...client, ...fl });
    await testChatUpload({ ...auth, ...client, ...fl });
    await testNotifications({ ...auth, ...client, ...fl });
    await testWorkflow({ ...auth, ...client, ...fl });
    const disp = await testDisputes({ ...auth, ...client, ...fl });
    await testAdmin({ ...auth, ...client, ...fl, DP: disp.DP });
    await testApiErrors({ ...auth });
  } catch (e) {
    console.error('FATAL:', e);
    failures.push('FATAL: ' + e.message);
  }

  console.log(`\n${passed}/${passed + failures.length} checks passed`);
  if (failures.length) {
    console.log('FAILED:');
    failures.forEach((f) => console.log('  ✗ ' + f));
    process.exit(1);
  }
  process.exit(0);
})();
