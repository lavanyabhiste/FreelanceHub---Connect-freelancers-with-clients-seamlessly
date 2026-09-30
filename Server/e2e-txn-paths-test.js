/* Tests for refund + failure transaction paths (Pending escrow) */
const BASE = 'http://localhost:5000/api';
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
const check = (name, cond, extra = '') => console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);

const run = async () => {
  const stamp = Date.now();

  // Setup: client + freelancer + project + bid + approval (creates escrow Pending)
  const c = await req('POST', '/auth/register', { body: { name: 'Refund Client', email: `rc${stamp}@t.com`, password: 'secret123', role: 'Client' } });
  const f = await req('POST', '/auth/register', { body: { name: 'Refund Freelancer', email: `rf${stamp}@t.com`, password: 'secret123', role: 'Freelancer' } });
  const ct = c.data.token, ft = f.data.token;
  const p = await req('POST', '/projects', { token: ct, body: { title: 'Refund Test', description: 'Testing refund flow end to end.', category: 'Web', budget: 500, duration: '1 week' } });
  const pid = p.data.project._id;
  const b = await req('POST', '/freelancers/bid', { token: ft, body: { projectId: pid, proposal: 'test', bidAmount: 400, estimatedDuration: '1 week' } });
  await req('PATCH', `/projects/${pid}/applications/${b.data.application._id}/status`, { token: ct, body: { status: 'Approved' } });
  let txn = await req('GET', `/transactions/project/${pid}`, { token: ct });
  const txnId = txn.data.transaction._id;
  check('Setup: escrow Pending', txn.data.transaction.status === 'Pending');

  // Refund from client → Refunded
  const ref = await req('POST', `/transactions/${txnId}/refund`, { token: ct });
  check('Refund Pending → Refunded', ref.status === 200 && ref.data.transaction.status === 'Refunded', ref.data.message);
  txn = await req('GET', `/transactions/project/${pid}`, { token: ct });
  check('Refund persisted + refundedAt set', txn.data.transaction.status === 'Refunded' && !!txn.data.transaction.refundedAt);

  // Freelancer cannot refund
  const fref = await req('POST', `/transactions/${txnId}/refund`, { token: ft });
  check('Freelancer blocked from refunding', fref.status === 403, fref.data.message);

  // Cannot double-refund
  const again = await req('POST', `/transactions/${txnId}/refund`, { token: ct });
  check('Double-refund blocked', again.status === 400, again.data.message);

  // Setup 2: second project for failure path
  const p2 = await req('POST', '/projects', { token: ct, body: { title: 'Fail Test', description: 'Testing the simulated gateway failure path.', category: 'Web', budget: 300, duration: '3 days' } });
  const pid2 = p2.data.project._id;
  const b2 = await req('POST', '/freelancers/bid', { token: ft, body: { projectId: pid2, proposal: 'test2', bidAmount: 250, estimatedDuration: '3 days' } });
  await req('PATCH', `/projects/${pid2}/applications/${b2.data.application._id}/status`, { token: ct, body: { status: 'Approved' } });
  const txn2 = await req('GET', `/transactions/project/${pid2}`, { token: ct });
  const txn2Id = txn2.data?.transaction?._id;
  check('Setup 2: escrow Pending', txn2.data?.transaction?.status === 'Pending', `id=${txn2Id}`);

  // Simulate failure
  const fail = await req('POST', `/transactions/${txn2Id}/fail`, { token: ct });
  check('Simulate gateway failure → Failed', fail.status === 200 && fail.data.transaction.status === 'Failed', fail.data.transaction.failureReason);
  const rel = await req('POST', `/transactions/${txn2Id}/release`, { token: ct });
  check('Release blocked on Failed', rel.status === 400, rel.data.message);

  // Release guard: project not completed yet
  const p2done = await req('PATCH', `/projects/${pid2}/complete`, { token: ct });
  check('Cannot complete before work submitted', p2done.status === 400, p2done.data.message);

  // Non-participant access blocked
  const intruder = await req('POST', '/auth/register', { body: { name: 'Intruder', email: `i${stamp}@t.com`, password: 'secret123', role: 'Freelancer' } });
  const it = intruder.data.token;
  const peek = await req('GET', `/transactions/project/${pid}`, { token: it });
  check('Non-participant blocked from viewing txn', peek.status === 403, peek.data.message);

  // List summaries include all statuses for this client
  const list = await req('GET', '/transactions', { token: ct });
  const s = list.data.summary;
  check('Summary counts Refunded + Failed', s.refunded >= 1 && s.failed >= 1, JSON.stringify(s));

  process.exit(0);
};
run().catch((e) => { console.error('FATAL', e); process.exit(1); });
