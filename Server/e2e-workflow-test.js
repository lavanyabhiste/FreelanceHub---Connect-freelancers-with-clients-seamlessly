/* E2E smoke test: workflow + reviews + transactions */
const BASE = 'http://localhost:5000/api';

const req = async (method, path, { token, body } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty */ }
  return { status: res.status, data };
};

const results = [];
const check = (name, cond, extra = '') => {
  results.push({ name, pass: !!cond, extra });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
};

const run = async () => {
  const stamp = Date.now();
  const clientEmail = `client${stamp}@test.com`;
  const freeEmail = `freelancer${stamp}@test.com`;

  // 1. Register both users
  const c = await req('POST', '/auth/register', { body: { name: 'Test Client', email: clientEmail, password: 'secret123', role: 'Client' } });
  const f = await req('POST', '/auth/register', { body: { name: 'Test Freelancer', email: freeEmail, password: 'secret123', role: 'Freelancer' } });
  const clientToken = c.data?.token;
  const freeToken = f.data?.token;
  check('Register client + freelancer', clientToken && freeToken);
  const client = c.data?.user, freelancer = f.data?.user;

  // 2. Client creates a project
  const p = await req('POST', '/projects', { token: clientToken, body: {
    title: 'E2E Test Project', description: 'A project for automated testing of the full workflow.',
    category: 'Web Development', requiredSkills: ['React'], budget: 1000, duration: '2 weeks',
  }});
  check('Create project (status Open)', p.data?.project?.status === 'Open', p.data?.project?.status);
  const projectId = p.data?.project?._id;

  // 3. Freelancer submits a bid
  const bid = await req('POST', `/freelancers/bid`, { token: freeToken, body: {
    projectId, proposal: 'I can do this quickly.', bidAmount: 800, estimatedDuration: '1 week',
  }});
  check('Submit bid (new application notification)', bid.status === 201 || bid.status === 200, `status ${bid.status}`);
  const appId = bid.data?.application?._id;

  // 4. Client approves → escrow Pending
  const appr = await req('PATCH', `/projects/${projectId}/applications/${appId}/status`, { token: clientToken, body: { status: 'Approved' } });
  check('Approve application → In Progress', appr.data?.project?.status === 'In Progress' || appr.status === 200, appr.data?.message);

  let txn = await req('GET', `/transactions/project/${projectId}`, { token: clientToken });
  check('Escrow created (Pending)', txn.data?.transaction?.status === 'Pending', `status=${txn.data?.transaction?.status} amount=${txn.data?.transaction?.amount}`);
  const txnId = txn.data?.transaction?._id;

  // 5. Client views transaction list
  const list = await req('GET', '/transactions', { token: clientToken });
  check('Client transaction list + summary', Array.isArray(list.data?.transactions) && list.data?.summary?.pending >= 1);

  // 6. Freelancer submits work → Submitted
  const work = await req('POST', '/freelancers/submit-work', { token: freeToken, body: {
    projectId, projectLink: 'https://github.com/test/repo', description: 'Done! Here is the work.',
  }});
  check('Submit work → Submitted', work.data?.project?.status === 'Submitted', work.data?.message);

  // 7. Client requests revision → back to In Progress + revision recorded
  const rev = await req('PATCH', `/projects/${projectId}/revision`, { token: clientToken, body: { note: 'Please change the header color.' } });
  const revOk = rev.data?.project?.status === 'In Progress' && (rev.data?.project?.revisions?.length === 1);
  check('Request revision → In Progress + history', revOk, `revisions=${rev.data?.project?.revisions?.length}`);

  // 8. Review before completion → should fail
  const earlyReview = await req('POST', '/reviews', { token: freeToken, body: { projectId, reviewedUserId: client._id, rating: 5, comment: 'early' } });
  check('Review blocked before completion', earlyReview.status === 400, earlyReview.data?.message);

  // 9. Freelancer resubmits → Submitted + revision responded
  const resub = await req('POST', '/freelancers/submit-work', { token: freeToken, body: {
    projectId, projectLink: 'https://github.com/test/repo-v2', description: 'Updated version.',
  }});
  const lastRev = resub.data?.project?.revisions?.slice(-1)[0];
  check('Resubmit after revision → responded', resub.data?.project?.status === 'Submitted' && !!lastRev?.respondedAt);

  // 10. Client marks completed → transaction Released (Completed)
  const done = await req('PATCH', `/projects/${projectId}/complete`, { token: clientToken });
  check('Mark completed → Completed', done.data?.project?.status === 'Completed', done.data?.message);
  txn = await req('GET', `/transactions/project/${projectId}`, { token: clientToken });
  check('Escrow auto-released (Completed)', txn.data?.transaction?.status === 'Completed' && !!txn.data?.transaction?.releasedAt, `status=${txn.data?.transaction?.status}`);

  // 11. Both sides review
  const r1 = await req('POST', '/reviews', { token: clientToken, body: { projectId, reviewedUserId: freelancer._id, rating: 5, comment: 'Excellent work!' } });
  check('Client reviews freelancer', r1.status === 201, r1.data?.message);
  const r1dup = await req('POST', '/reviews', { token: clientToken, body: { projectId, reviewedUserId: freelancer._id, rating: 1, comment: 'dup' } });
  check('Duplicate review blocked', r1dup.status === 400, r1dup.data?.message);
  const r2 = await req('POST', '/reviews', { token: freeToken, body: { projectId, reviewedUserId: client._id, rating: 4, comment: 'Great communication.' } });
  check('Freelancer reviews client', r2.status === 201, r2.data?.message);

  // 12. Ratings updated
  const me = await req('GET', '/auth/me', { token: freeToken });
  check('Freelancer rating updated (5)', me.data?.user?.rating === 5 && me.data?.user?.totalReviews === 1, `rating=${me.data?.user?.rating} reviews=${me.data?.user?.totalReviews}`);
  const cme = await req('GET', '/auth/me', { token: clientToken });
  check('Client rating updated (4)', cme.data?.user?.rating === 4, `rating=${cme.data?.user?.rating}`);

  // 13. Project reviews endpoint (participants only, hasReviewed flags)
  const pr = await req('GET', `/reviews/project/${projectId}`, { token: clientToken });
  check('Project reviews + hasReviewed', pr.data?.count === 2 && pr.data?.hasReviewed === true, `count=${pr.data?.count}`);

  // 14. Refund/fail guards on a Completed transaction
  const ref = await req('POST', `/transactions/${txnId}/refund`, { token: clientToken });
  check('Refund blocked on Completed txn', ref.status === 400, ref.data?.message);

  // 15. Notifications were created for key events
  const notifs = await req('GET', '/notifications?limit=50', { token: freeToken });
  const types = (notifs.data?.notifications || []).map((n) => n.type);
  check('Freelancer got approval + completion + review notifications',
    types.includes('application_approved') && types.includes('project_completed') && types.includes('new_review'),
    types.join(','));

  // Summary
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) { console.log('FAILED:', failed.map((f) => f.name).join(' | ')); process.exit(1); }
  process.exit(0);
};

run().catch((e) => { console.error('FATAL', e); process.exit(1); });
