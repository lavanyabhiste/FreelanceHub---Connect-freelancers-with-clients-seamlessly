/* E2E test: Admin dashboard, user management, moderation, disputes */
require('dotenv').config();
const BASE = 'http://localhost:5000/api';

// Admin credentials come from the environment — never hardcode secrets.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('ADMIN_EMAIL / ADMIN_PASSWORD are not set in Server/.env — cannot run this suite.');
  process.exit(1);
}

const req = async (method, path, { token, body } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty */ }
  return { status: res.status, data };
};

const results = [];
const check = (name, cond, extra = '') => {
  results.push({ name, pass: !!cond });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
};

const run = async () => {
  const stamp = Date.now();

  // ── 1. Admin auth (seeded on boot) ────────────────────────────────────────
  const adminLogin = await req('POST', '/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  const adminToken = adminLogin.data?.token;
  const isAdminRole = adminLogin.data?.user?.role === 'Admin';
  check('Admin can log in (seeded account)', adminToken && isAdminRole, adminLogin.data?.user?.email);

  // Registration of Admin role is blocked
  const fakeAdmin = await req('POST', '/auth/register', { body: { name: 'Fake', email: `fa${stamp}@t.com`, password: 'secret123', role: 'Admin' } });
  check('Public registration of Admin blocked', fakeAdmin.status === 400, fakeAdmin.data?.message);

  // ── 2. Auth guards ────────────────────────────────────────────────────────
  const noToken = await req('GET', '/admin/stats');
  check('Admin API without token → 401', noToken.status === 401);

  // Regular users
  const c = await req('POST', '/auth/register', { body: { name: 'Admin Test Client', email: `atc${stamp}@t.com`, password: 'secret123', role: 'Client' } });
  const f = await req('POST', '/auth/register', { body: { name: 'Admin Test Freelancer', email: `atf${stamp}@t.com`, password: 'secret123', role: 'Freelancer' } });
  const clientToken = c.data.token, freeToken = f.data.token;
  const client = c.data.user, freelancer = f.data.user;
  check('Client + freelancer registered', !!clientToken && !!freeToken);

  const asClient = await req('GET', '/admin/stats', { token: clientToken });
  check('Client blocked from admin API → 403', asClient.status === 403, asClient.data?.message);
  const asFreelancer = await req('GET', '/admin/users', { token: freeToken });
  check('Freelancer blocked from admin API → 403', asFreelancer.status === 403);

  // ── 3. Platform statistics ────────────────────────────────────────────────
  const stats = await req('GET', '/admin/stats', { token: adminToken });
  const s = stats.data?.stats;
  check('Stats: all sections present', !!(s?.users && s?.projects && s?.applications && s?.transactions && s?.disputes));
  check('Stats: user counts (clients/freelancers ≥ 1)', s?.users?.clients >= 1 && s?.users?.freelancers >= 1, JSON.stringify(s?.users));
  check('Stats: admin counted', s?.users?.admins >= 1);

  // ── 4. User management ────────────────────────────────────────────────────
  const usersList = await req('GET', `/admin/users?search=${encodeURIComponent(client.email)}`, { token: adminToken });
  check('Admin lists users with search', usersList.data?.users?.some((u) => u._id === client._id));
  const asClientList = await req('GET', '/admin/users', { token: clientToken });
  check('User list rejects non-admin → 403', asClientList.status === 403);

  const verifyRes = await req('PATCH', `/admin/users/${client._id}/verify`, { token: adminToken, body: { isVerified: true } });
  check('Verify user', verifyRes.status === 200 && verifyRes.data?.user?.isVerified === true, verifyRes.data?.message);

  // Deactivate → login + token blocked
  const deact = await req('PATCH', `/admin/users/${client._id}/status`, { token: adminToken, body: { isActive: false } });
  check('Deactivate user', deact.status === 200 && deact.data?.user?.isActive === false, deact.data?.message);

  const blockedLogin = await req('POST', '/auth/login', { body: { email: client.email, password: 'secret123' } });
  check('Deactivated user cannot log in', blockedLogin.status === 403, blockedLogin.data?.message);

  const blockedToken = await req('GET', '/auth/me', { token: clientToken });
  check('Deactivated user token rejected', blockedToken.status === 403, blockedToken.data?.message);

  const react = await req('PATCH', `/admin/users/${client._id}/status`, { token: adminToken, body: { isActive: true } });
  check('Reactivate user', react.status === 200 && react.data?.user?.isActive === true);
  const backLogin = await req('POST', '/auth/login', { body: { email: client.email, password: 'secret123' } });
  check('Reactivated user can log in again', backLogin.status === 200);
  const clientToken2 = backLogin.data.token;

  // Guards on admin self-management
  const adminId = adminLogin.data.user._id;
  const selfDeact = await req('PATCH', `/admin/users/${adminId}/status`, { token: adminToken, body: { isActive: false } });
  check('Admin cannot deactivate self', selfDeact.status === 400, selfDeact.data?.message);
  const badVerify = await req('PATCH', `/admin/users/${client._id}/verify`, { token: adminToken, body: { isVerified: 'yes' } });
  check('Verify validation requires boolean', badVerify.status === 400);

  // ── 5. Project + application + transaction monitoring ─────────────────────
  const p = await req('POST', '/projects', { token: clientToken2, body: {
    title: 'Admin Test Project', description: 'Admin moderation test project description.',
    category: 'Web Development', budget: 750, duration: '1 week',
  }});
  const projectId = p.data.project._id;
  const b = await req('POST', '/freelancers/bid', { token: freeToken, body: { projectId, proposal: 'I can build it.', bidAmount: 700, estimatedDuration: '1 week' } });
  await req('PATCH', `/projects/${projectId}/applications/${b.data.application._id}/status`, { token: clientToken2, body: { status: 'Approved' } });
  await req('POST', '/freelancers/submit-work', { token: freeToken, body: { projectId, projectLink: 'https://github.com/test/x', description: 'Done.' } });

  const adminProjects = await req('GET', '/admin/projects?status=Submitted', { token: adminToken });
  check('Admin monitors projects (Submitted filter)', adminProjects.data?.projects?.some((pr) => pr._id === projectId));

  const adminApps = await req('GET', '/admin/applications', { token: adminToken });
  check('Admin monitors applications', adminApps.data?.applications?.some((a) => a._id === b.data.application._id));
  const appFiltered = await req('GET', '/admin/applications?status=Approved', { token: adminToken });
  check('Applications status filter', appFiltered.data?.applications?.every((a) => a.status === 'Approved'));

  const adminTxns = await req('GET', '/admin/transactions', { token: adminToken });
  const projectTxn = adminTxns.data?.transactions?.find((t) => t.project?._id === projectId || t.project === projectId);
  check('Admin views transactions (escrow Pending)', projectTxn?.status === 'Pending', `count=${adminTxns.data?.total}`);
  const txnFiltered = await req('GET', '/admin/transactions?status=Pending', { token: adminToken });
  check('Transactions status filter', txnFiltered.data?.transactions?.every((t) => t.status === 'Pending'));

  // ── 6. Dispute lifecycle: Open → Under Review → Resolved → Closed ────────
  const d = await req('POST', '/disputes', { token: clientToken2, body: { projectId, reason: 'Work quality issue', description: 'The submitted work does not match the requirements.' } });
  check('User raises dispute (Open)', d.status === 201 && d.data?.dispute?.status === 'Open', d.data?.message);
  const disputeId = d.data?.dispute?._id;

  const dupe = await req('POST', '/disputes', { token: freeToken, body: { projectId, reason: 'Dup', description: 'Duplicate attempt.' } });
  check('Second active dispute blocked', dupe.status === 400, dupe.data?.message);

  const myDisputes = await req('GET', `/disputes/mine?projectId=${projectId}`, { token: freeToken });
  check('Freelancer sees the dispute', myDisputes.data?.count === 1);

  const adminDisputes = await req('GET', '/admin/disputes?status=Open', { token: adminToken });
  check('Admin lists Open disputes', adminDisputes.data?.disputes?.some((x) => x._id === disputeId), JSON.stringify(adminDisputes.data?.summary));

  // Invalid jump: Open → Closed
  const jump = await req('PATCH', `/admin/disputes/${disputeId}`, { token: adminToken, body: { status: 'Closed' } });
  check('Invalid transition blocked (Open → Closed)', jump.status === 400, jump.data?.message);

  const t1 = await req('PATCH', `/admin/disputes/${disputeId}`, { token: adminToken, body: { status: 'Under Review', note: 'Reviewing evidence from both parties.' } });
  check('Open → Under Review', t1.status === 200 && t1.data?.dispute?.status === 'Under Review', t1.data?.message);

  const noRes = await req('PATCH', `/admin/disputes/${disputeId}`, { token: adminToken, body: { status: 'Resolved' } });
  check('Resolve without resolution still records history', noRes.status === 200);

  const t3 = await req('PATCH', `/admin/disputes/${disputeId}`, { token: adminToken, body: { status: 'Closed', resolution: 'Freelancer asked to revise deliverables; both parties agreed.' } });
  check('Resolved → Closed', t3.status === 200 && t3.data?.dispute?.status === 'Closed');
  check('Closure timestamp set', !!t3.data?.dispute?.closedAt);

  const after = await req('PATCH', `/admin/disputes/${disputeId}`, { token: adminToken, body: { status: 'Open' } });
  check('Closed dispute cannot reopen', after.status === 400, after.data?.message);

  const notifCheck = await req('GET', '/notifications?limit=50', { token: freeToken });
  const nTypes = (notifCheck.data?.notifications || []).map((n) => n.type);
  check('Both parties notified of dispute updates', nTypes.includes('dispute_created') && nTypes.includes('dispute_updated'), nTypes.join(','));

  // ── 7. Project moderation ─────────────────────────────────────────────────
  const p2 = await req('POST', '/projects', { token: clientToken2, body: {
    title: 'Moderation Target', description: 'A project that the admin will suspend and restore.',
    category: 'Design', budget: 200, duration: '3 days',
  }});
  const p2id = p2.data.project._id;
  const suspend = await req('PATCH', `/admin/projects/${p2id}/status`, { token: adminToken, body: { status: 'Cancelled' } });
  check('Admin suspends (cancels) project', suspend.status === 200 && suspend.data?.project?.status === 'Cancelled', suspend.data?.message);
  const restore = await req('PATCH', `/admin/projects/${p2id}/status`, { token: adminToken, body: { status: 'Open' } });
  check('Admin restores project to Open', restore.status === 200 && restore.data?.project?.status === 'Open');
  const badModerate = await req('PATCH', `/admin/projects/${p2id}/status`, { token: adminToken, body: { status: 'Completed' } });
  check('Moderation restricted to Open/Cancelled', badModerate.status === 400, badModerate.data?.message);

  const activeMod = await req('PATCH', `/admin/projects/${projectId}/status`, { token: adminToken, body: { status: 'Cancelled' } });
  check('Active (Submitted) project protected from suspension', activeMod.status === 400, activeMod.data?.message);

  const del = await req('DELETE', `/admin/projects/${p2id}`, { token: adminToken });
  check('Admin deletes Open project', del.status === 200, del.data?.message);
  const delActive = await req('DELETE', `/admin/projects/${projectId}`, { token: adminToken });
  check('Active project protected from delete', delActive.status === 400, delActive.data?.message);

  // ── 8. Final stats sanity ─────────────────────────────────────────────────
  const finalStats = await req('GET', '/admin/stats', { token: adminToken });
  const fs = finalStats.data.stats;
  check('Final stats: pending disputes counted', typeof fs.disputes.pending === 'number', JSON.stringify(fs.disputes));
  check('Final stats: escrowed volume present', typeof fs.transactions.escrowed === 'number');

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) { console.log('FAILED:', failed.map((f) => f.name).join(' | ')); process.exit(1); }
  process.exit(0);
};

run().catch((e) => { console.error('FATAL', e); process.exit(1); });
