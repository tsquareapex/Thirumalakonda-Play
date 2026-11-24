/* Thirumalakonda Plywoods – demo web app (data stored in browser; Supabase schema in /supabase) */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inr = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
const SHOP = { name: 'Thirumalakonda Plywoods', owner: '9440026692' };
const KEY = 'tkp_db_v1';

/* ---------- data ---------- */
const SB_URL = 'https://yynulnhsifaefpjelcls.supabase.co', SB_KEY = 'sb_publishable_rcZ6EJcqqiEp0QUB5FZ1KQ_CPBxzsLg';
let sb = null, db = null, snap = {}, saving = null;
const blank = () => ({ seq: {}, nextBill: 1, nextRet: 1, parties: [], bills: [], returns: [], employees: [] });

/* ---------- Supabase persistence (only changed rows are written) ---------- */
const sig = (row, b) => JSON.stringify([row, b && [b.items, b.pays]]);
const rowsOf = () => {
  const r = {};
  db.parties.forEach(p => r['parties:' + p.id] = ['parties', { id: p.id, type: p.type, name: p.name, phone: p.phone, email: p.email, address: p.address, city: p.city, state: p.state, tolerance_days: p.tol, created_at: p.created }]);
  db.bills.forEach(b => r['bills:' + b.id] = ['bills', { id: b.id, party_id: b.partyId, bill_date: b.date, total: b.total, delivery: b.delivery }, b]);
  db.returns.forEach(x => r['returns:' + x.id] = ['returns', { id: x.id, party_id: x.partyId, bill_id: x.billId, item: x.item, qty: x.qty, amount: x.amount, returned_on: x.date, status: x.status }]);
  db.employees.forEach(e => r['employees:' + e.id] = ['employees', { id: e.id, name: e.name, role: e.role, phone: e.phone }]);
  Object.entries(db.seq).forEach(([k, v]) => r['code_seq:' + k] = ['code_seq', { prefix: k, last: v }]);
  return r;
};
async function flush() {
  const rows = rowsOf(), order = ['parties', 'code_seq', 'bills', 'returns', 'employees'];
  const changed = Object.entries(rows).filter(([k, [, row, b]]) => snap[k] !== sig(row, b));
  for (const t of order) {
    for (const [k, [tab, row, b]] of changed) {
      if (tab !== t) continue;
      let e = (await sb.from(tab).upsert(row)).error;
      if (!e && b) {
        await sb.from('bill_items').delete().eq('bill_id', b.id); await sb.from('payments').delete().eq('bill_id', b.id);
        if (b.items.length) e = (await sb.from('bill_items').insert(b.items.map(i => ({ bill_id: b.id, code: i.code, description: i.desc, qty: i.qty, price: i.price })))).error;
        if (!e && b.pays.length) e = (await sb.from('payments').insert(b.pays.map(p => ({ bill_id: b.id, paid_on: p.date, amount: p.amt })))).error;
      }
      if (e) { console.error(e); toast('Save failed: ' + e.message); } else snap[k] = sig(row, b);
    }
  }
}
const save = () => { saving = (saving || Promise.resolve()).then(flush); return saving; };
async function load() {
  const q = async t => { const r = await sb.from(t).select('*'); if (r.error) throw r.error; return r.data; };
  const [ps, bs, it, py, rs, em, sq] = await Promise.all(['parties', 'bills', 'bill_items', 'payments', 'returns', 'employees', 'code_seq'].map(q));
  db = blank();
  db.parties = ps.map(p => ({ id: p.id, type: p.type, name: p.name, phone: p.phone || '', email: p.email || '', address: p.address || '', city: p.city || '', state: p.state, tol: p.tolerance_days, created: (p.created_at || '').slice(0, 10) }));
  db.bills = bs.map(b => ({ id: b.id, partyId: b.party_id, date: b.bill_date, total: +b.total, delivery: b.delivery,
    items: it.filter(i => i.bill_id === b.id).map(i => ({ code: i.code, desc: i.description, qty: +i.qty, price: +i.price })),
    pays: py.filter(p => p.bill_id === b.id).map(p => ({ date: p.paid_on, amt: +p.amount })) }));
  db.returns = rs.map(r => ({ id: r.id, partyId: r.party_id, billId: r.bill_id, item: r.item, qty: +r.qty, amount: +r.amount, date: r.returned_on, status: r.status, driver: '' }));
  db.employees = em.map(e => ({ id: e.id, name: e.name, role: e.role, phone: e.phone || '' }));
  sq.forEach(s => db.seq[s.prefix] = s.last);
  const mx = a => a.reduce((m, x) => Math.max(m, parseInt(String(x.id).replace(/\D/g, '')) || 0), 0) + 1;
  db.nextBill = mx(db.bills); db.nextRet = mx(db.returns);
  snap = {}; Object.entries(rowsOf()).forEach(([k, [, row, b]]) => snap[k] = sig(row, b));
  if (!db.parties.length) { seed(); await save(); }
}
function seed() {
  db.employees.push({ id: 1, name: 'Ramesh', role: 'Driver', phone: '' });
  addParty({ type: 'customer', name: 'Thouhidh', phone: '9494409313', city: 'Dharmavaram', address: 'Main Road', tol: 5 });
}
function prefix(city, type) { return (type === 'vendor' ? 'V' : '') + townCode(city || 'XXX'); }
function addParty(o) {
  const p = prefix(o.city || 'XXX', o.type); db.seq[p] = (db.seq[p] || 0) + 1;
  const id = p + String(db.seq[p]).padStart(5, '0');
  db.parties.push({ id, type: o.type, name: o.name || 'Unnamed', phone: o.phone || '', email: o.email || '', address: o.address || '',
    city: o.city || '', state: o.state || 'Andhra Pradesh', tol: +o.tol || 5, created: today() });
  return id;
}
function addBill(partyId, date, items, paid, delivery) {
  const id = 'INV-' + String(db.nextBill++).padStart(4, '0');
  const total = items.reduce((s, i) => s + i.qty * i.price, 0);
  db.bills.push({ id, partyId, date, items, total, pays: paid > 0 ? [{ date, amt: +paid }] : [], delivery: delivery || 'Pending' });
  return id;
}

/* ---------- ledger helpers ---------- */
const P = id => db.parties.find(p => p.id === id);
const paidOf = b => b.pays.reduce((s, x) => s + x.amt, 0);
const dueOf = b => b.total - paidOf(b);
const isOver = b => { const p = P(b.partyId); return dueOf(b) > 0 && today() > addDays(b.date, p ? p.tol : 5); };
const overDays = b => Math.floor((new Date(today()) - new Date(addDays(b.date, P(b.partyId).tol))) / 864e5);
function ledger(pid) {
  const bills = db.bills.filter(b => b.partyId === pid), rets = db.returns.filter(r => r.partyId === pid);
  const total = bills.reduce((s, b) => s + b.total, 0), paid = bills.reduce((s, b) => s + paidOf(b), 0);
  const ret = rets.reduce((s, r) => s + r.amount, 0);
  const overdue = bills.filter(isOver).reduce((s, b) => s + dueOf(b), 0);
  return { bills, rets, total, paid, ret, balance: total - paid - ret, overdue, isOver: bills.some(isOver) && total - paid - ret > 0 };
}
const retDelayed = r => r.status === 'Pending Pickup' && today() > addDays(r.date, 2);

/* ---------- UI plumbing ---------- */
const NAV = [['dash', '📊 Customer Dashboard'], ['sdash', '🏭 Supplier Dashboard'], ['customers', '👥 Customers'], ['vendors', '🚛 Suppliers'],
  ['bill', '🧾 Customer Bill'], ['sbill', '🧾 Supplier Bill'], ['bills', '📚 All Bills'], ['returns', '↩️ Returns'],
  ['route', '🚚 Driver Route'], ['staff', '🧑‍🔧 Employees'], ['reports', '📈 Reports']];
let page = 'dash', sel = { customer: null, vendor: null }, filt = '', billFilter = 'all';
const go = p => { page = p; $('#side').classList.remove('open'); render(); };
function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('show'); setTimeout(() => e.classList.remove('show'), 2200); }
function modal(html) { $('#mbody').innerHTML = html; $('#modal').classList.remove('hidden'); }
const closeModal = () => $('#modal').classList.add('hidden');
const tag = (t, c) => `<span class="tag t-${c}">${esc(t)}</span>`;
const waLink = (phone, text) => `https://wa.me/91${String(phone).replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(text)}`;

function render() {
  $('#nav').innerHTML = NAV.map(([k, l]) => `<a class="${k === page ? 'on' : ''}" data-act="go" data-v="${k}">${l}</a>`).join('');
  $('#title').textContent = (NAV.find(n => n[0] === page) || [])[1]?.replace(/^\S+\s/, '') || '';
  $('#topact').innerHTML = `<span class="mut">${fmtD(today())}</span>`;
  $('#view').innerHTML = ({ dash: vDash, customers: () => vParties('customer'), vendors: () => vParties('vendor'), sdash: vSDash, bill: () => vBill('customer'), sbill: () => vBill('vendor'), bills: vBills,
    returns: vReturns, route: vRoute, staff: vStaff, reports: vReports })[page]();
  if (page === 'bill' || page === 'sbill') recalc();
}

/* ---------- Supplier dashboard ---------- */
function vSDash() {
  const vs = db.parties.filter(p => p.type === 'vendor'), L = vs.map(v => ({ v, l: ledger(v.id) }));
  const sum = k => L.reduce((t, x) => t + x.l[k], 0), od = L.filter(x => x.l.isOver);
  const pend = db.bills.filter(b => b.delivery === 'Pending' && P(b.partyId)?.type === 'vendor');
  const recent = db.bills.filter(b => P(b.partyId)?.type === 'vendor').slice(-6).reverse();
  return `
  <div class="grid g4">
    <div class="card kpi"><small>Total Purchases</small><b>${inr(sum('total'))}</b></div>
    <div class="card kpi green"><small>Paid to Suppliers</small><b>${inr(sum('paid'))}</b></div>
    <div class="card kpi red"><small>Overdue Payable</small><b>${inr(sum('overdue'))}</b><small>${od.length} supplier(s)</small></div>
    <div class="card kpi"><small>Net Payable</small><b>${inr(sum('balance'))}</b></div>
    <div class="card kpi"><small>Goods Awaiting Receipt</small><b>${pend.length}</b></div>
    <div class="card kpi"><small>Suppliers</small><b>${vs.length}</b></div>
  </div>
  <div class="grid g2" style="margin-top:14px">
    <div class="card"><h3>Suppliers — select to see full picture</h3>
      <input placeholder="🔍 Search name / code / city" value="${esc(filt)}" data-input="filt">
      <div class="plist" style="margin-top:8px">${partyList(vs, 'vendor')}</div></div>
    <div class="card" id="detail">${sel.vendor ? partyDetail(sel.vendor) : '<p class="mut">👈 Pick a supplier to see purchases, paid, overdue payable and bill history.</p>'}</div>
  </div>
  <div class="card scroll" style="margin-top:14px"><h3>Recent supplier bills</h3><table><tr><th>Bill</th><th>Date</th><th>Supplier</th><th class="r">Total</th><th class="r">Paid</th><th class="r">Due</th><th></th></tr>
  ${recent.map(b => `<tr class="${isOver(b) ? 'overdue' : ''}"><td>${b.id}</td><td>${fmtD(b.date)}</td><td>${esc(P(b.partyId)?.name)}</td><td class="r">${inr(b.total)}</td><td class="r">${inr(paidOf(b))}</td><td class="r">${inr(dueOf(b))}</td>
  <td>${dueOf(b) > 0 ? `<button class="sm" data-act="pay" data-v="${b.id}">Pay</button> ` : tag('Paid', 'green')}<button class="sm ghost" data-act="invoice" data-v="${b.id}">View</button></td></tr>`).join('') || '<tr><td colspan=7 class="mut">No supplier bills yet</td></tr>'}</table></div>`;
}

/* ---------- Customer dashboard ---------- */
function vDash() {
  const cs = db.parties.filter(p => p.type === 'customer'), L = cs.map(c => ({ c, l: ledger(c.id) }));
  const sum = k => L.reduce((s, x) => s + x.l[k], 0);
  const od = L.filter(x => x.l.isOver), pendRet = db.returns.filter(r => r.status === 'Pending Pickup');
  const pendDel = db.bills.filter(b => b.delivery === 'Pending' && P(b.partyId)?.type === 'customer');
  const vl = db.parties.filter(p => p.type === 'vendor').map(v => ledger(v.id));
  return `
  <div class="grid g4">
    <div class="card kpi"><small>Total Sales</small><b>${inr(sum('total'))}</b></div>
    <div class="card kpi green"><small>Collected</small><b>${inr(sum('paid'))}</b></div>
    <div class="card kpi red"><small>Overdue Amount</small><b>${inr(sum('overdue'))}</b><small>${od.length} customer(s)</small></div>
    <div class="card kpi"><small>Net Balance (after returns)</small><b>${inr(sum('balance'))}</b></div>
    <div class="card kpi"><small>Returns Pending Pickup</small><b>${pendRet.length}</b><small>${pendRet.filter(retDelayed).length} delayed</small></div>
    <div class="card kpi"><small>Deliveries Pending</small><b>${pendDel.length}</b></div>
    <div class="card kpi"><small>Customers</small><b>${cs.length}</b></div>
    <div class="card kpi"><small>Employees</small><b>${db.employees.length}</b></div>
  </div>
  <div class="grid g2" style="margin-top:14px">
    <div class="card"><h3>Customers — select to see full picture</h3>
      <input placeholder="🔍 Search name / code / town" value="${esc(filt)}" data-input="filt">
      <div class="plist" style="margin-top:8px">${partyList(cs, 'customer')}</div></div>
    <div class="card" id="detail">${sel.customer ? partyDetail(sel.customer) : '<p class="mut">👈 Pick a customer to see paid, overdue, total business, returns and history.</p>'}</div>
  </div>`;
}
function partyList(arr, type) {
  const f = filt.toLowerCase();
  return arr.filter(p => !f || (p.name + p.id + p.city).toLowerCase().includes(f)).map(p => {
    const l = ledger(p.id);
    return `<div class="pitem ${l.isOver ? 'od' : ''} ${sel[type] === p.id ? 'sel' : ''}" data-act="pick" data-t="${type}" data-v="${p.id}">
      <div><b>${esc(p.name)}</b><br><small class="mut">${p.id} · ${esc(p.city)}</small></div>
      <div class="r"><b class="${l.isOver ? 'red' : ''}">${inr(l.balance)}</b><br>${l.isOver ? tag('OVERDUE', 'red') : l.balance <= 0 ? tag('Clear', 'green') : ''}</div></div>`;
  }).join('') || '<p class="mut">No records.</p>';
}
function partyDetail(id) {
  const p = P(id), l = ledger(id), isC = p.type === 'customer';
  return `<div class="row" style="align-items:center"><div><h3 style="margin:0">${esc(p.name)} ${l.isOver ? tag('OVERDUE', 'red') : ''}</h3>
    <span class="mut">${p.id} · ${esc(p.address)} ${esc(p.city)}, ${esc(p.state)}<br>📞 ${esc(p.phone || '—')} ${p.email ? '· ✉ ' + esc(p.email) : ''} · Tolerance ${p.tol} days</span></div>
    <div class="r"><button class="sm" data-act="statement" data-v="${id}">Statement / Link</button> <button class="sm ghost" data-act="editParty" data-v="${id}">Edit</button></div></div>
  <div class="grid g4" style="margin:12px 0">
    <div class="card kpi"><small>${isC ? 'Total Business' : 'Total Purchases'}</small><b>${inr(l.total)}</b></div>
    <div class="card kpi green"><small>Paid</small><b>${inr(l.paid)}</b></div>
    <div class="card kpi ${l.overdue ? 'red' : ''}"><small>Overdue</small><b>${inr(l.overdue)}</b></div>
    ${isC ? `<div class="card kpi"><small>Returns credited</small><b>${inr(l.ret)}</b></div>` : `<div class="card kpi"><small>Bills</small><b>${l.bills.length}</b></div>`}
  </div>
  <p style="font-size:18px">Balance ${isC ? 'to receive' : 'to pay'}: <b class="${l.balance > 0 ? 'red' : 'green'}">${inr(l.balance)}</b></p>
  <div class="scroll"><table><tr><th>Bill</th><th>Date</th><th class="r">Total</th><th class="r">Paid</th><th class="r">Due</th><th></th></tr>
  ${l.bills.slice().reverse().map(b => `<tr class="${isOver(b) ? 'overdue' : ''}"><td>${b.id}</td><td>${fmtD(b.date)}</td><td class="r">${inr(b.total)}</td><td class="r">${inr(paidOf(b))}</td>
    <td class="r">${inr(dueOf(b))}</td><td>${dueOf(b) > 0 ? `<button class="sm" data-act="pay" data-v="${b.id}">Pay</button> ` : tag('Paid', 'green')}<button class="sm ghost" data-act="invoice" data-v="${b.id}">View</button></td></tr>`).join('') || '<tr><td colspan=6 class="mut">No bills yet</td></tr>'}</table></div>
  ${l.rets.length ? `<h3 style="margin-top:14px">Returns</h3>` + l.rets.map(r => `<div>${r.id} · ${esc(r.item)} ×${r.qty} · ${inr(r.amount)} ${tag(r.status, r.status === 'Pending Pickup' ? 'gold' : 'green')}</div>`).join('') : ''}`;
}

/* ---------- Customers / Suppliers ---------- */
function vParties(type) {
  const arr = db.parties.filter(p => p.type === type), isC = type === 'customer';
  return `<div class="grid g2"><div class="card"><h3>${isC ? 'Customers' : 'Suppliers'} (${arr.length})</h3>
    <button data-act="newParty" data-v="${type}">＋ New ${isC ? 'Customer' : 'Supplier'}</button>
    <input style="margin-top:10px" placeholder="🔍 Search" value="${esc(filt)}" data-input="filt"><div class="plist" style="margin-top:8px">${partyList(arr, type)}</div></div>
    <div class="card" id="detail">${sel[type] ? partyDetail(sel[type]) : '<p class="mut">Select from the list to see the dashboard.</p>'}</div></div>`;
}
function partyForm(type, p = {}) {
  const isC = type === 'customer';
  const loc = isC ? `<div class="f placebox"><label>City / Town / Village — Andhra Pradesh (type to search; if not listed, just type it)</label>
      <input name="city" autocomplete="off" data-input="place" data-kind="customer" value="${esc(p.city || '')}" placeholder="e.g. Dharmavaram"><div class="sug-box" id="sug"></div></div>
    <div class="f"><label>State</label><input name="state" value="Andhra Pradesh" readonly></div>`
    : `<div class="row"><div class="f"><label>State</label><select name="state">${OTHER_STATES.map(s => `<option ${s === (p.state || 'Telangana') ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
    <div class="f placebox"><label>City / Town (type to search or enter any)</label><input name="city" autocomplete="off" data-input="place" data-kind="vendor" value="${esc(p.city || '')}" placeholder="Any city or town"><div class="sug-box" id="sug"></div></div></div>`;
  return `<h3>${p.id ? 'Edit' : 'New'} ${isC ? 'Customer' : 'Supplier'} ${p.id ? '· ' + p.id : ''}</h3><form data-form="${p.id ? 'saveParty' : 'createParty'}" data-id="${p.id || ''}" data-type="${type}">
    <p class="hint">All fields are optional. The ID is generated automatically from the town.</p>
    <div class="f"><label>Name</label><input name="name" value="${esc(p.name || '')}"></div>
    <div class="f"><label>Address description</label><input name="address" value="${esc(p.address || '')}"></div>${loc}
    <div class="row"><div class="f"><label>Phone / WhatsApp</label><input name="phone" inputmode="numeric" value="${esc(p.phone || '')}"></div>
    <div class="f"><label>Email</label><input name="email" type="email" value="${esc(p.email || '')}"></div>
    <div class="f"><label>Overdue tolerance (days)</label><input name="tol" type="number" min="0" value="${p.tol ?? (isC ? 5 : 15)}"></div></div>
    <button>Save</button></form>`;
}

/* ---------- Billing ---------- */
function vBill(kind) {
  const sup = kind === 'vendor', cs = db.parties.filter(p => p.type === kind);
  const items = {}; db.bills.forEach(b => b.items.forEach(i => items[i.code] = i));
  const html = `<div class="card" style="max-width:900px"><h3>${sup ? 'Supplier Bill — goods purchased from a supplier' : 'Customer Bill — goods sold to a customer'}</h3>
   ${cs.length ? '' : `<p class="red">No ${sup ? 'suppliers' : 'customers'} yet — create one first.</p>`}<form data-form="createBill" data-kind="${kind}">
   <div class="row"><div class="f"><label>${sup ? 'Supplier' : 'Customer'}</label><select name="party" required><option value="">— select —</option>
     ${cs.map(p => `<option value="${p.id}" ${sel[kind] === p.id ? 'selected' : ''}>${esc(p.name)} (${p.id}) — ${esc(p.city)}</option>`).join('')}</select></div>
   <div class="f"><label>Bill date</label><input type="date" name="date" value="${today()}"></div></div>
   <datalist id="codes">${Object.values(items).map(i => `<option value="${esc(i.code)}">${esc(i.desc)}</option>`).join('')}</datalist>
   <table id="items"><tr><th>Item code</th><th>Description</th><th>Qty</th><th>${sup ? 'Purchase price' : 'Price'}</th><th class="r">Amount</th></tr></table>
   <p><button type="button" class="ghost sm" data-act="addRow">＋ Add item</button></p>
   <div class="row"><div class="f"><label>${sup ? 'Paid now to supplier (₹)' : 'Paid now (₹)'} — leave 0 if credit</label><input type="number" name="paid" value="0" min="0"></div>
   <div class="f"><label>${sup ? 'Goods received?' : 'Delivery'}</label><select name="delivery"><option value="Pending">${sup ? 'Not received yet' : 'Pending'}</option><option value="Delivered">${sup ? 'Received' : 'Delivered'}</option></select></div>
   <div class="f"><label>Total</label><div style="font-size:26px" class="gd" id="grand">₹0</div></div></div>
   <button>${sup ? 'Save Supplier Bill' : 'Save &amp; Generate Invoice'}</button></form></div>`;
  window.__items = items; setTimeout(addRow, 0); return html;
}
function addRow() {
  const t = $('#items'); if (!t) return; const r = t.insertRow();
  r.innerHTML = `<td><input name="code" list="codes" data-input="fill"></td><td><input name="desc"></td><td><input name="qty" type="number" min="0" value="1" data-input="calc" style="width:80px"></td>
    <td><input name="price" type="number" min="0" value="0" data-input="calc" style="width:110px"></td><td class="r amt">₹0</td>`;
}
function recalc() {
  let g = 0; document.querySelectorAll('#items tr').forEach((r, i) => { if (!i) return; const a = (+r.querySelector('[name=qty]').value || 0) * (+r.querySelector('[name=price]').value || 0); r.querySelector('.amt').textContent = inr(a); g += a; });
  const e = $('#grand'); if (e) e.textContent = inr(g);
}
function vBills() {
  const bs = db.bills.slice().reverse().filter(b => billFilter === 'all' || P(b.partyId)?.type === billFilter);
  const fb = (k, l) => `<button class="sm ${billFilter === k ? '' : 'ghost'}" data-act="billf" data-v="${k}">${l}</button> `;
  return `<div class="card scroll"><p>${fb('all', 'All bills')}${fb('customer', 'Customer bills')}${fb('vendor', 'Supplier bills')}</p>
  <table><tr><th>Bill</th><th>Date</th><th>Party</th><th class="r">Total</th><th class="r">Paid</th><th class="r">Due</th><th>Delivery / Receipt</th><th></th></tr>
  ${bs.map(b => { const p = P(b.partyId), sup = p?.type === 'vendor'; return `<tr class="${isOver(b) ? 'overdue' : ''}"><td>${b.id}</td><td>${fmtD(b.date)}</td><td>${esc(p?.name)} ${sup ? tag('Supplier', 'gold') : ''}</td>
  <td class="r">${inr(b.total)}</td><td class="r">${inr(paidOf(b))}</td><td class="r">${inr(dueOf(b))}</td><td>${tag(b.delivery === 'Delivered' ? (sup ? 'Received' : 'Delivered') : (sup ? 'Not received' : 'Pending'), b.delivery === 'Delivered' ? 'green' : 'gold')}</td>
  <td>${dueOf(b) > 0 ? `<button class="sm" data-act="pay" data-v="${b.id}">Pay</button> ` : ''}<button class="sm ghost" data-act="invoice" data-v="${b.id}">View</button>
  ${b.delivery === 'Pending' ? `<button class="sm ghost" data-act="deliver" data-v="${b.id}">${sup ? 'Received ✓' : 'Delivered ✓'}</button>` : ''}</td></tr>`; }).join('') || '<tr><td colspan=8 class="mut">No bills</td></tr>'}</table></div>`;
}
/* ---------- Documents: print layout, PDF, WhatsApp share ---------- */
const rs = n => 'Rs. ' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
function inWords(n) {
  n = Math.round(n); if (!n) return 'Zero';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const two = x => x < 20 ? a[x] : b[Math.floor(x / 10)] + (x % 10 ? ' ' + a[x % 10] : '');
  const three = x => (x > 99 ? a[Math.floor(x / 100)] + ' Hundred' + (x % 100 ? ' ' : '') : '') + (x % 100 ? two(x % 100) : '');
  let out = ''; const cr = Math.floor(n / 1e7); n %= 1e7; const lk = Math.floor(n / 1e5); n %= 1e5; const th = Math.floor(n / 1e3); n %= 1e3;
  if (cr) out += three(cr) + ' Crore '; if (lk) out += two(lk) + ' Lakh '; if (th) out += two(th) + ' Thousand '; if (n) out += three(n);
  return out.trim();
}
function printDoc(html) { $('#printarea').innerHTML = html; setTimeout(() => window.print(), 50); }
const docHead = (title, right = '') => `<div class="pd-hd"><div><div class="pd-shop">${SHOP.name}</div><div>Plywood &amp; Interior Materials</div><div>Ph: ${SHOP.owner}</div></div><div class="pd-r"><b class="pd-title">${title}</b>${right}</div></div>`;
const partyBlock = p => `<div class="pd-party"><b>${esc(p.name)}</b> (${p.id})<br>${esc(p.address)} ${esc(p.city)}, ${esc(p.state)}<br>Phone: ${esc(p.phone || '-')}</div>`;

function invoiceDoc(b) {
  const p = P(b.partyId), sup = p.type === 'vendor';
  return `<div class="pdoc">${docHead(sup ? 'PURCHASE BILL' : 'TAX INVOICE', `<div>Bill No: <b>${b.id}</b></div><div>Date: ${fmtD(b.date)}</div>`)}
  ${partyBlock(p)}
  <table class="pd-t"><thead><tr><th>#</th><th>Item code</th><th>Description</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead><tbody>
  ${b.items.map((i, n) => `<tr><td>${n + 1}</td><td>${esc(i.code)}</td><td>${esc(i.desc)}</td><td class="r">${i.qty}</td><td class="r">${inr(i.price)}</td><td class="r">${inr(i.qty * i.price)}</td></tr>`).join('')}
  </tbody><tfoot><tr><td colspan="5" class="r">Total</td><td class="r">${inr(b.total)}</td></tr><tr><td colspan="5" class="r">Paid</td><td class="r">${inr(paidOf(b))}</td></tr>
  <tr class="pd-big"><td colspan="5" class="r">Balance due</td><td class="r">${inr(dueOf(b))}</td></tr></tfoot></table>
  <p><b>Amount in words:</b> ${inWords(b.total)} Rupees Only</p>
  <p class="pd-note">Payment due within ${p.tol} days of bill date. Goods once sold will be taken back only as per return policy. Thank you for your business!</p>
  <div class="pd-sign"><div>Customer signature</div><div>For ${SHOP.name}</div></div></div>`;
}
function statementData(id) {
  const p = P(id), l = ledger(id);
  const ev = [...l.bills.map(b => ({ d: b.date, o: 0, t: 'Bill ' + b.id, a: b.total, c: 0 })), ...l.bills.flatMap(b => b.pays.map(x => ({ d: x.date, o: 1, t: 'Payment for ' + b.id, a: 0, c: x.amt }))),
    ...l.rets.map(r => ({ d: r.date, o: 2, t: 'Return ' + r.id + ' - ' + r.item, a: 0, c: r.amount }))].sort((x, y) => x.d.localeCompare(y.d) || x.o - y.o);
  let bal = 0; const rows = ev.map(e => { bal += e.a - e.c; return [fmtD(e.d), e.t, e.a || '', e.c || '', bal]; });
  return { p, l, rows, head: ['Date', 'Details', p.type === 'vendor' ? 'Purchase' : 'Sale (+)', 'Paid / Return (-)', 'Balance'] };
}
function statementDoc(id) {
  const { p, l, rows, head } = statementData(id), m = v => v === '' ? '' : inr(v);
  return `<div class="pdoc">${docHead('ACCOUNT STATEMENT', `<div>As on: ${fmtD(today())}</div>`)}${partyBlock(p)}
  <table class="pd-t pd-sum"><tr><th>${p.type === 'vendor' ? 'Total purchases' : 'Total sales'}</th><th>Paid</th><th>Returns</th><th>Balance ${p.type === 'vendor' ? 'payable' : 'due'}</th></tr>
  <tr><td>${inr(l.total)}</td><td>${inr(l.paid)}</td><td>${inr(l.ret)}</td><td><b>${inr(l.balance)}</b></td></tr></table>
  <table class="pd-t"><thead><tr>${head.map((h, i) => `<th class="${i > 1 ? 'r' : ''}">${h}</th>`).join('')}</tr></thead><tbody>
  ${rows.map(r => `<tr><td>${r[0]}</td><td>${esc(r[1])}</td><td class="r">${m(r[2])}</td><td class="r">${m(r[3])}</td><td class="r">${inr(r[4])}</td></tr>`).join('') || '<tr><td colspan="5">No transactions</td></tr>'}</tbody></table>
  ${l.overdue > 0 ? `<p class="pd-note"><b>Overdue amount: ${inr(l.overdue)}</b> - kindly arrange payment at the earliest.</p>` : ''}<p class="pd-note">This is a computer generated statement.</p></div>`;
}
function reportDoc(r) {
  const cell = (v, t) => t === 'm' ? inr(v) : esc(v ?? '');
  return `<div class="pdoc">${docHead(r.title.toUpperCase(), `<div>Generated: ${fmtD(today())}</div>`)}<p class="pd-note">${esc(r.sub)}</p>
  <table class="pd-t"><thead><tr>${r.head.map((h, i) => `<th class="${r.types[i] !== 't' ? 'r' : ''}">${h}</th>`).join('')}</tr></thead><tbody>
  ${r.rows.map(row => `<tr>${row.map((v, i) => `<td class="${r.types[i] !== 't' ? 'r' : ''}">${cell(v, r.types[i])}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${r.head.length}">No records for the selected filters</td></tr>`}</tbody>
  ${r.foot ? `<tfoot><tr>${r.foot.map((v, i) => `<td class="${r.types[i] !== 't' ? 'r' : ''}">${v === '' ? '' : cell(v, r.types[i])}</td>`).join('')}</tr></tfoot>` : ''}</table></div>`;
}

/* PDF files (jsPDF) */
function pdfBase(title, lines) {
  const doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' });
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(138, 106, 12); doc.text(SHOP.name, 40, 46);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(90); doc.text('Plywood & Interior Materials  |  Ph: ' + SHOP.owner, 40, 60);
  doc.setDrawColor(201, 162, 39); doc.setLineWidth(2); doc.line(40, 68, 555, 68);
  doc.setTextColor(0); doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.text(title, 40, 92);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); let y = 108; lines.forEach(t => { doc.text(t, 40, y); y += 14; });
  return { doc, y };
}
function pdfTable(doc, y, head, rows, foot, rightCols) {
  doc.autoTable({ startY: y + 4, head: [head], body: rows, foot: foot ? [foot] : undefined, theme: 'grid', styles: { fontSize: 9, cellPadding: 4, lineColor: [200, 180, 120] },
    headStyles: { fillColor: [201, 162, 39], textColor: [40, 30, 0] }, footStyles: { fillColor: [250, 240, 200], textColor: 0, fontStyle: 'bold' },
    columnStyles: Object.fromEntries(rightCols.map(i => [i, { halign: 'right' }])), margin: { left: 40, right: 40 } });
  return doc.lastAutoTable.finalY;
}
function invoicePdf(b) {
  const p = P(b.partyId), { doc, y } = pdfBase(p.type === 'vendor' ? 'PURCHASE BILL' : 'TAX INVOICE', [`Bill No: ${b.id}     Date: ${fmtD(b.date)}`, `${p.name} (${p.id})`, `${p.address} ${p.city}, ${p.state}   Phone: ${p.phone || '-'}`]);
  let e = pdfTable(doc, y, ['#', 'Code', 'Description', 'Qty', 'Rate', 'Amount'], b.items.map((i, n) => [n + 1, i.code, i.desc, i.qty, rs(i.price), rs(i.qty * i.price)]),
    ['', '', '', '', 'Total', rs(b.total)], [3, 4, 5]);
  doc.setFontSize(10); doc.text(`Paid: ${rs(paidOf(b))}     Balance due: ${rs(dueOf(b))}`, 40, e + 22); doc.text('Amount in words: ' + inWords(b.total) + ' Rupees Only', 40, e + 38);
  doc.setFontSize(8); doc.setTextColor(100); doc.text(`Payment due within ${p.tol} days of bill date. Thank you for your business!`, 40, e + 58);
  return doc;
}
function statementPdf(id) {
  const { p, l, rows, head } = statementData(id), { doc, y } = pdfBase('ACCOUNT STATEMENT', [`${p.name} (${p.id})`, `${p.address} ${p.city}, ${p.state}   Phone: ${p.phone || '-'}`, `As on ${fmtD(today())}`]);
  const e = pdfTable(doc, y, ['Total ' + (p.type === 'vendor' ? 'purchases' : 'sales'), 'Paid', 'Returns', 'Balance ' + (p.type === 'vendor' ? 'payable' : 'due')], [[rs(l.total), rs(l.paid), rs(l.ret), rs(l.balance)]], null, [0, 1, 2, 3]);
  const e2 = pdfTable(doc, e + 8, head, rows.map(r => [r[0], r[1], r[2] === '' ? '' : rs(r[2]), r[3] === '' ? '' : rs(r[3]), rs(r[4])]), null, [2, 3, 4]);
  if (l.overdue > 0) { doc.setTextColor(200, 30, 40); doc.setFontSize(10); doc.text(`Overdue amount: ${rs(l.overdue)} - kindly arrange payment at the earliest.`, 40, e2 + 22); }
  return doc;
}
function reportPdf(r) {
  const { doc, y } = pdfBase(r.title, [r.sub, 'Generated ' + fmtD(today())]);
  const m = (v, t) => t === 'm' ? rs(v) : (v ?? '');
  pdfTable(doc, y, r.head, r.rows.map(row => row.map((v, i) => m(v, r.types[i]))), r.foot ? r.foot.map((v, i) => v === '' ? '' : m(v, r.types[i])) : null, r.types.map((t, i) => t !== 't' ? i : -1).filter(i => i >= 0));
  return doc;
}
async function sharePdf(doc, name, text, phone) {
  const file = new File([doc.output('blob')], name, { type: 'application/pdf' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], text }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  doc.save(name); window.open(waLink(phone, text), '_blank'); toast('PDF downloaded - attach it in the WhatsApp chat that opened');
}

/* Automatic WhatsApp (server function -> WhatsApp Business Cloud API) with fallback to manual share */
async function sendWhatsApp(doc, filename, text, party, kind) {
  const digits = String(party.phone || '').replace(/\D/g, '').slice(-10);
  if (digits.length !== 10) return toast('No valid mobile number saved for ' + party.name);
  if (!confirm(`Send "${filename}" to ${party.name} on WhatsApp (${digits}) from ${SHOP.owner}?`)) return;
  toast('Sending on WhatsApp...');
  let err = '';
  try {
    const { data, error } = await sb.functions.invoke('send-whatsapp', { body: { to: '91' + digits, name: party.name, text, filename, pdf: doc.output('datauristring').split(',')[1] } });
    if (error) err = error.message || 'Function not available'; else if (!data?.ok) err = data?.error || 'Unknown error'; else {
      sb.from('message_log').insert({ party_id: party.id, kind, body: text.slice(0, 500), channel: 'whatsapp' }).then(() => {});
      return toast(`Sent to ${party.name} on WhatsApp \u2713`);
    }
  } catch (e) { err = e.message || String(e); }
  console.warn('WhatsApp auto-send failed:', err);
  toast('Auto-send not available (' + err.slice(0, 80) + ') - opening WhatsApp manually');
  setTimeout(() => sharePdf(doc, filename, text, party.phone), 1200);
}

function invoiceHtml(b) {
  const p = P(b.partyId);
  return `<div class="inv"><div class="hd"><div><h2>${SHOP.name}</h2>Plywood &amp; Interior Materials · 📞 ${SHOP.owner}</div><div style="text-align:right"><b>${p.type === 'vendor' ? 'PURCHASE BILL' : 'INVOICE'}</b><br>${b.id}<br>${fmtD(b.date)}</div></div>
  <p><b>${esc(p.name)}</b> (${p.id})<br>${esc(p.address)} ${esc(p.city)}, ${esc(p.state)} · ${esc(p.phone)}</p>
  <table><tr><th>Code</th><th>Description</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Amount</th></tr>
  ${b.items.map(i => `<tr><td>${esc(i.code)}</td><td>${esc(i.desc)}</td><td class="r">${i.qty}</td><td class="r">${inr(i.price)}</td><td class="r">${inr(i.qty * i.price)}</td></tr>`).join('')}
  <tr><td colspan=4 class="r"><b>Total</b></td><td class="r"><b>${inr(b.total)}</b></td></tr><tr><td colspan=4 class="r">Paid</td><td class="r">${inr(paidOf(b))}</td></tr>
  <tr><td colspan=4 class="r"><b>Balance due</b></td><td class="r"><b>${inr(dueOf(b))}</b></td></tr></table>
  <p style="font-size:12px;color:#555">Payment due within ${p.tol} days of bill date. Thank you for your business!</p></div>`;
}
function invoiceModal(id) {
  const b = db.bills.find(x => x.id === id), p = P(b.partyId);
  const msg = p.type === 'vendor' ? `Dear ${p.name}, ${SHOP.name} has recorded purchase bill ${b.id} dated ${fmtD(b.date)} for ${inr(b.total)}. Paid: ${inr(paidOf(b))}, Balance payable: ${inr(dueOf(b))}.`
    : `Dear ${p.name}, thank you for shopping at ${SHOP.name}. Your bill ${b.id} dated ${fmtD(b.date)} for ${inr(b.total)} is ready. Paid: ${inr(paidOf(b))}, Balance: ${inr(dueOf(b))}.`;
  modal(invoiceHtml(b) + `<p style="margin-top:12px"><button data-act="printInv" data-v="${id}">🖨 Print</button> <button class="ghost" data-act="pdfInv" data-v="${id}">⬇ Download PDF</button>
   <button class="wa" data-act="shareInv" data-v="${id}">Send on WhatsApp (PDF)</button></p><div class="msg">${esc(msg)}</div>
   <p class="hint">"Send on WhatsApp" sends the PDF automatically from ${SHOP.owner} to the customer or supplier. If automatic sending is not set up yet, it opens WhatsApp so you can attach the downloaded PDF.</p>`);
}
function payModal(id) {
  const b = db.bills.find(x => x.id === id);
  modal(`<h3>Record payment · ${b.id}</h3><p>Due: <b class="red">${inr(dueOf(b))}</b></p><form data-form="pay" data-id="${id}"><div class="row"><div class="f"><label>Amount</label><input type="number" name="amt" value="${dueOf(b)}" max="${dueOf(b)}" min="1"></div>
  <div class="f"><label>Date</label><input type="date" name="date" value="${today()}"></div></div><button>Mark Paid</button></form>`);
}
function statementModal(id) {
  const { p, l, rows, head } = statementData(id), od = l.bills.filter(isOver), link = `${location.href.split('#')[0]}#statement/${id}`;
  const msg = p.type === 'vendor' ? `Dear ${p.name}, this is ${SHOP.name}. Our records show ${inr(l.balance)} payable to you. We will arrange payment as per terms. Please find the account statement attached.`
    : od.length ? `Dear ${p.name}, greetings from ${SHOP.name}. This is a gentle reminder that ${inr(l.overdue)} is overdue (outstanding balance ${inr(l.balance)}). Kindly arrange payment at your earliest convenience. Your account statement is attached.\nThank you for your valued association.`
    : `Dear ${p.name}, thank you for your business with ${SHOP.name}. Your current balance is ${inr(l.balance)}. Your account statement is attached.`;
  const m = v => v === '' ? '' : inr(v);
  modal(`<h2 class="gold" style="margin-top:0">${SHOP.name}</h2><h3>Account Statement - ${esc(p.name)} (${p.id})</h3>
  <p style="margin:0 0 10px"><button data-act="printSt" data-v="${id}">🖨 Print</button> <button class="ghost" data-act="pdfSt" data-v="${id}">⬇ Download PDF</button> <button class="wa" data-act="shareSt" data-v="${id}">Send on WhatsApp (PDF)</button></p>
  <div class="grid g4"><div class="card kpi"><small>${p.type === 'vendor' ? 'Purchases (+)' : 'Sales (+)'}</small><b>${inr(l.total)}</b></div><div class="card kpi green"><small>Paid (-)</small><b>${inr(l.paid)}</b></div>
  <div class="card kpi"><small>Returns (-)</small><b>${inr(l.ret)}</b></div><div class="card kpi ${l.balance > 0 ? 'red' : 'green'}"><small>Balance</small><b>${inr(l.balance)}</b></div></div>
  <div class="scroll"><table style="margin-top:12px"><tr>${head.map((h, i) => `<th class="${i > 1 ? 'r' : ''}">${h}</th>`).join('')}</tr>
  ${rows.map(r => `<tr><td>${r[0]}</td><td>${esc(r[1])}</td><td class="r">${m(r[2])}</td><td class="r green">${m(r[3])}</td><td class="r"><b>${inr(r[4])}</b></td></tr>`).join('') || '<tr><td colspan=5 class="mut">No transactions yet</td></tr>'}</table></div>
  <h3 style="margin-top:14px">WhatsApp message (${p.type === 'vendor' ? 'payment update' : od.length ? 'overdue reminder' : 'statement'})</h3><div class="msg">${esc(msg)}</div>
  <p class="hint">"Send on WhatsApp" sends this statement as a PDF automatically from ${SHOP.owner}. If automatic sending is not set up yet, it opens WhatsApp so you can attach the downloaded PDF.</p>`);
  window.__stMsg = msg;
}
/* ---------- Returns ---------- */
/* returnable lines for a customer: only DELIVERED bills; remaining = billed qty - already returned */
let retCache = [];
function returnLines(pid) {
  retCache = [];
  db.bills.filter(b => b.partyId === pid && b.delivery === 'Delivered').forEach(b => b.items.forEach(i => {
    const key = i.code + ' ' + i.desc;
    const done = db.returns.filter(r => r.billId === b.id && r.item === key).reduce((t, r) => t + r.qty, 0);
    retCache.push({ b: b.id, date: b.date, key, qty: i.qty, done, rem: Math.max(i.qty - done, 0), price: i.price });
  }));
  return retCache;
}
function retTable(pid) {
  if (!pid) return '<p class="mut">Select a customer to see the items delivered to them.</p>';
  const lines = returnLines(pid), pend = db.bills.filter(b => b.partyId === pid && b.delivery !== 'Delivered').length;
  const rows = lines.map((l, n) => l.rem > 0 ? `<tr><td>${l.b}<br><small class="mut">${fmtD(l.date)}</small></td><td>${esc(l.key)}</td><td class="r">${l.qty}</td><td class="r">${l.done}</td><td class="r"><b>${l.rem}</b></td>
    <td class="r">${inr(l.price)}</td><td><input type="number" class="rq" data-input="retQty" data-i="${n}" min="0" max="${l.rem}" step="any" value="0" style="width:90px"></td><td class="r" id="rc${n}">₹0</td></tr>` : '').join('');
  return (rows ? `<div class="scroll"><table><tr><th>Bill</th><th>Item</th><th class="r">Delivered</th><th class="r">Returned</th><th class="r">Can return</th><th class="r">Price</th><th>Return qty</th><th class="r">Credit</th></tr>${rows}</table></div>
    <p style="font-size:18px">Total credit: <b class="gd" id="retTotal">₹0</b> <span class="hint">· You cannot return more than the delivered quantity.</span></p><button>Save return(s) &amp; deduct from balance</button>`
    : '<p class="mut">No returnable items — nothing delivered yet, or everything delivered has already been returned.</p>')
    + (pend ? `<p class="hint">${pend} bill(s) for this customer are not marked Delivered yet; items can be returned only after delivery.</p>` : '');
}
function vReturns() {
  const cs = db.parties.filter(p => p.type === 'customer');
  return `<div class="grid"><div class="card"><h3>Record material returned by customer (add several items at once)</h3><form data-form="createReturn">
   <div class="f" style="max-width:420px"><label>Customer</label><select name="party" data-input="retParty" required><option value="">— select —</option>${cs.map(c => `<option value="${c.id}">${esc(c.name)} (${c.id})</option>`).join('')}</select></div>
   <div id="retLines">${retTable('')}</div></form></div>
   <div class="card scroll"><h3>Return register</h3><table><tr><th>ID</th><th>Customer</th><th>Item</th><th class="r">Credit</th><th>Status</th><th></th></tr>
   ${db.returns.slice().reverse().map(r => `<tr class="${retDelayed(r) ? 'overdue' : ''}"><td>${r.id}<br><small class="mut">${fmtD(r.date)}</small></td><td>${esc(P(r.partyId)?.name)}<br><small class="mut">${esc(P(r.partyId)?.city)}</small></td>
   <td>${esc(r.item)} ×${r.qty}</td><td class="r">${inr(r.amount)}</td><td>${tag(r.status, r.status === 'Pending Pickup' ? (retDelayed(r) ? 'red' : 'gold') : 'green')}${retDelayed(r) ? '<br>' + tag('DELAYED', 'red') : ''}</td>
   <td>${r.status === 'Pending Pickup' ? `<button class="sm" data-act="picked" data-v="${r.id}">Picked ✓</button>` : ''}</td></tr>`).join('') || '<tr><td colspan=6 class="mut">No returns</td></tr>'}</table></div></div>`;
}

/* ---------- Driver route ---------- */
function vRoute() {
  const stops = {};
  const add = (city, o) => (stops[city] = stops[city] || []).push(o);
  db.bills.filter(b => b.delivery === 'Pending' && P(b.partyId)?.type === 'customer').forEach(b => add(P(b.partyId).city || 'Unknown', { k: 'Deliver', p: P(b.partyId), t: `Bill ${b.id} (${b.items.map(i => i.qty + '× ' + i.desc).join(', ')})` }));
  db.returns.filter(r => r.status === 'Pending Pickup').forEach(r => add(P(r.partyId).city || 'Unknown', { k: 'Pick up return', p: P(r.partyId), t: `${r.item} ×${r.qty}`, late: retDelayed(r) }));
  const cities = Object.keys(stops).sort();
  let text = `🚚 ${SHOP.name} – Driver list ${fmtD(today())}\n` + cities.map(c => `\n📍 ${c}\n` + stops[c].map(s => ` • ${s.k}: ${s.p.name} ${s.p.phone} – ${s.t}`).join('\n')).join('');
  return `<div class="card"><h3>Today's route — grouped by town so the driver covers each area in one trip</h3>
  ${cities.map(c => `<div class="card" style="margin-bottom:10px"><b class="gd">📍 ${esc(c)}</b> <span class="mut">(${stops[c].length} stop${stops[c].length > 1 ? 's' : ''})</span>
   ${stops[c].map(s => `<div style="padding:6px 0;border-bottom:1px solid var(--line)">${tag(s.k, s.k === 'Deliver' ? 'green' : 'gold')} <b>${esc(s.p.name)}</b> · ${esc(s.p.phone)} · ${esc(s.p.address)}<br><span class="mut">${esc(s.t)}</span> ${s.late ? tag('DELAYED', 'red') : ''}</div>`).join('')}</div>`).join('') || '<p class="mut">No pending deliveries or pickups 🎉</p>'}
  <h3>Send to driver</h3><div class="msg">${esc(text)}</div><p><a class="btn" style="text-decoration:none;display:inline-block;background:#25d366" target="_blank" href="${waLink((db.employees.find(e => e.role === 'Driver') || {}).phone || '', text)}">Send to driver on WhatsApp</a></p></div>`;
}

/* ---------- Staff ---------- */
function vStaff() {
  return `<div class="grid g2"><div class="card"><h3>Add employee / worker</h3><form data-form="createStaff"><div class="f"><label>Name</label><input name="name" required></div>
  <div class="row"><div class="f"><label>Role</label><select name="role"><option>Driver</option><option>Salesman</option><option>Carpenter</option><option>Helper</option><option>Accountant</option><option>Other</option></select></div>
  <div class="f"><label>Phone</label><input name="phone"></div></div><button>Add</button></form></div>
  <div class="card"><h3>Team (${db.employees.length})</h3><table>${db.employees.map(e => `<tr><td><b>${esc(e.name)}</b></td><td>${tag(e.role, 'gold')}</td><td>${esc(e.phone)}</td><td><button class="sm ghost" data-act="delStaff" data-v="${e.id}">✕</button></td></tr>`).join('')}</table></div></div>`;
}

/* ---------- Reports ---------- */
const rpt = { tab: 'pv', type: 'all', onlyDue: false, from: '', to: '', q: '', status: 'all' };
const RTABS = [['pv', '1. Billed vs Paid'], ['od', '2. Overdue amounts'], ['rt', '3. Returns'], ['dl', '4. Returns not picked / delayed']];
function reportData() {
  const inR = d => (!rpt.from || d >= rpt.from) && (!rpt.to || d <= rpt.to), q = rpt.q.toLowerCase();
  const parties = db.parties.filter(p => (rpt.type === 'all' || p.type === rpt.type) && (!q || (p.name + p.id + p.city).toLowerCase().includes(q)));
  const sum = (rows, i) => rows.reduce((t, r) => t + (+r[i] || 0), 0);
  const filt = [rpt.type !== 'all' ? (rpt.type === 'customer' ? 'Customers only' : 'Suppliers only') : 'Customers & suppliers', rpt.from ? 'From ' + fmtD(rpt.from) : '', rpt.to ? 'To ' + fmtD(rpt.to) : '', rpt.q ? 'Search: ' + rpt.q : ''];
  if (rpt.tab === 'pv') {
    const L = parties.map(p => { const bs = db.bills.filter(b => b.partyId === p.id && inR(b.date)), billed = bs.reduce((t, b) => t + b.total, 0), paid = bs.reduce((t, b) => t + paidOf(b), 0);
      const ret = p.type === 'customer' ? db.returns.filter(r => r.partyId === p.id && inR(r.date)).reduce((t, r) => t + r.amount, 0) : 0, due = billed - paid - ret;
      return { p, billed, paid, ret, due, od: due > 0 && bs.some(isOver) }; }).filter(x => (x.billed || x.ret) && (!rpt.onlyDue || x.due > 0.005)).sort((a, b) => b.due - a.due);
    const rows = L.map(x => [`${x.p.name} (${x.p.id})`, x.p.type === 'vendor' ? 'Supplier' : 'Customer', x.p.city, x.billed, x.paid, x.ret, x.due]);
    return { title: 'Billed vs Paid Report', sub: [...filt, rpt.onlyDue ? 'Only parties with due amount' : ''].filter(Boolean).join(' | '), head: ['Party', 'Type', 'Town / City', 'Billed', 'Paid', 'Returns', 'Due'], types: ['t', 't', 't', 'm', 'm', 'm', 'm'],
      rows, foot: ['Total', '', '', sum(rows, 3), sum(rows, 4), sum(rows, 5), sum(rows, 6)], flags: L.map(x => x.od), ids: L.map(x => x.p.id) };
  }
  if (rpt.tab === 'od') {
    const L = parties.map(p => { const ob = db.bills.filter(b => b.partyId === p.id && isOver(b) && inR(b.date)); return { p, ob, amt: ob.reduce((t, b) => t + dueOf(b), 0) }; }).filter(x => x.amt > 0).sort((a, b) => b.amt - a.amt);
    const rows = L.map(x => [`${x.p.name} (${x.p.id})`, x.p.phone, x.p.city, x.ob.length, x.amt, Math.max(...x.ob.map(overDays)), ledger(x.p.id).balance]);
    return { title: 'Overdue Amounts Report', sub: filt.filter(Boolean).join(' | '), head: ['Party', 'Phone', 'Town / City', 'Overdue bills', 'Overdue amount', 'Max days late', 'Total balance'], types: ['t', 't', 't', 'n', 'm', 'n', 'm'],
      rows, foot: ['Total', '', '', sum(rows, 3), sum(rows, 4), '', sum(rows, 6)], flags: L.map(() => true), ids: L.map(x => x.p.id) };
  }
  if (rpt.tab === 'rt') {
    const R = db.returns.filter(r => inR(r.date) && (rpt.status === 'all' || r.status === rpt.status) && (!q || ((P(r.partyId)?.name || '') + r.id + (P(r.partyId)?.city || '')).toLowerCase().includes(q)));
    const rows = R.map(r => [r.id, fmtD(r.date), P(r.partyId)?.name, P(r.partyId)?.city, r.item, r.qty, r.amount, r.status]);
    return { title: 'Return Material Report', sub: [rpt.from ? 'From ' + fmtD(rpt.from) : '', rpt.to ? 'To ' + fmtD(rpt.to) : '', rpt.status !== 'all' ? 'Status: ' + rpt.status : ''].filter(Boolean).join(' | ') || 'All returns',
      head: ['Return ID', 'Date', 'Customer', 'Town / City', 'Item', 'Qty', 'Credit', 'Status'], types: ['t', 't', 't', 't', 't', 'n', 'm', 't'], rows, foot: ['Total', '', '', '', '', sum(rows, 5), sum(rows, 6), ''], flags: R.map(retDelayed), ids: R.map(r => r.partyId) };
  }
  const D = db.returns.filter(retDelayed).filter(r => !q || ((P(r.partyId)?.name || '') + r.id + (P(r.partyId)?.city || '')).toLowerCase().includes(q));
  const rows = D.map(r => [r.id, P(r.partyId)?.name, P(r.partyId)?.city, r.item, r.qty, Math.floor((new Date(today()) - new Date(r.date)) / 864e5)]);
  return { title: 'Returns Not Picked / Delayed', sub: 'Returns waiting for pickup for more than 2 days', head: ['Return ID', 'Customer', 'Town / City', 'Item', 'Qty', 'Days waiting'], types: ['t', 't', 't', 't', 'n', 'n'], rows, foot: null, flags: D.map(() => true), ids: D.map(r => r.partyId) };
}
function vReports() {
  const r = reportData(), cell = (v, t) => t === 'm' ? inr(v) : esc(v ?? ''), show = k => rpt.tab === k;
  const f = (l, inner) => `<div class="f"><label>${l}</label>${inner}</div>`;
  return `<div class="card"><div class="rtabs">${RTABS.map(([k, l]) => `<button class="sm ${rpt.tab === k ? '' : 'ghost'}" data-act="rtab" data-v="${k}">${l}</button>`).join(' ')}</div>
  <div class="row" style="margin-top:12px">
   ${show('pv') || show('od') ? f('Show', `<select data-input="rpt" data-k="type"><option value="all" ${rpt.type === 'all' ? 'selected' : ''}>Customers &amp; suppliers</option><option value="customer" ${rpt.type === 'customer' ? 'selected' : ''}>Customers only</option><option value="vendor" ${rpt.type === 'vendor' ? 'selected' : ''}>Suppliers only</option></select>`) : ''}
   ${show('rt') ? f('Status', `<select data-input="rpt" data-k="status"><option value="all">All</option><option ${rpt.status === 'Pending Pickup' ? 'selected' : ''}>Pending Pickup</option><option ${rpt.status === 'Picked' ? 'selected' : ''}>Picked</option></select>`) : ''}
   ${show('dl') ? '' : f('From date', `<input type="date" data-input="rpt" data-k="from" value="${rpt.from}">`) + f('To date', `<input type="date" data-input="rpt" data-k="to" value="${rpt.to}">`)}
   ${f('Search', `<input data-input="rpt" data-k="q" placeholder="name / code / town" value="${esc(rpt.q)}">`)}
   ${show('pv') ? `<label class="chk"><input type="checkbox" data-input="rpt" data-k="onlyDue" ${rpt.onlyDue ? 'checked' : ''}> Only with due amount</label>` : ''}
  </div>
  <p style="margin:6px 0 0"><button data-act="rprint">🖨 Print</button> <button class="ghost" data-act="rpdf">⬇ PDF</button> <button class="ghost" data-act="rcsv">⬇ Excel / CSV</button> <span class="hint">${r.rows.length} record(s)</span></p></div>
  <div class="card scroll" style="margin-top:14px"><h3>${r.title}</h3><p class="hint">${esc(r.sub)}</p>
  <table class="rt"><thead><tr>${r.head.map((h, i) => `<th class="${r.types[i] !== 't' ? 'r' : ''}">${h}</th>`).join('')}<th></th></tr></thead><tbody>
  ${r.rows.map((row, n) => `<tr class="${r.flags[n] ? 'overdue' : ''}">${row.map((v, i) => `<td class="${r.types[i] !== 't' ? 'r' : ''}">${cell(v, r.types[i])}</td>`).join('')}
   <td>${P(r.ids[n]) ? `<button class="sm ghost" data-act="statement" data-v="${r.ids[n]}">Statement</button>` : ''}</td></tr>`).join('') || `<tr><td colspan="${r.head.length + 1}" class="mut">No records for the selected filters</td></tr>`}</tbody>
  ${r.foot ? `<tfoot><tr>${r.foot.map((v, i) => `<td class="${r.types[i] !== 't' ? 'r' : ''}">${v === '' ? '' : cell(v, r.types[i])}</td>`).join('')}<td></td></tr></tfoot>` : ''}</table></div>`;
}
function downloadCsv(r) {
  const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"', lines = [r.head.map(q).join(','), ...r.rows.map(row => row.map(q).join(',')), ...(r.foot ? [r.foot.map(q).join(',')] : [])];
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv' })); a.download = r.title.replace(/\W+/g, '-') + '.csv'; a.click();
}

/* ---------- place suggestions ---------- */
function showSug(inp) {
  const box = $('#sug'); if (!box) return;
  const q = inp.value.trim().toLowerCase(), vendor = inp.dataset.kind === 'vendor';
  if (!q) { box.innerHTML = ''; return; }
  const pool = (vendor ? VENDOR_PLACES : AP_PLACES).slice();
  const known = new Set(pool.map(x => x[0].toLowerCase()));
  db.parties.forEach(p => { if (p.city && !known.has(p.city.toLowerCase()) && (vendor === (p.type === 'vendor'))) { known.add(p.city.toLowerCase()); pool.push([p.city, 'added earlier']); } });
  const starts = pool.filter(x => x[0].toLowerCase().startsWith(q)), has = pool.filter(x => !x[0].toLowerCase().startsWith(q) && x[0].toLowerCase().includes(q));
  const list = [...starts, ...has].slice(0, 40);
  box.innerHTML = list.map(x => `<div class="sug" data-act="pickPlace" data-v="${esc(x[0])}" data-s="${esc(x[1])}">${esc(x[0])} <small>${esc(x[1])}</small></div>`).join('') +
    (known.has(q) ? '' : `<div class="sug new" data-act="pickPlace" data-v="${esc(inp.value.trim())}" data-s="">➕ Use "${esc(inp.value.trim())}" (not in list)</div>`);
}

/* ---------- events ---------- */
const ACT = {
  rtab: v => { rpt.tab = v; render(); }, rprint: () => printDoc(reportDoc(reportData())), rpdf: () => { const r = reportData(); reportPdf(r).save(r.title.replace(/\W+/g, '-') + '.pdf'); }, rcsv: () => downloadCsv(reportData()),
  printInv: v => printDoc(invoiceDoc(db.bills.find(b => b.id === v))), pdfInv: v => invoicePdf(db.bills.find(b => b.id === v)).save(v + '.pdf'),
  shareInv: v => { const b = db.bills.find(x => x.id === v), p = P(b.partyId); sendWhatsApp(invoicePdf(b), v + '.pdf', `${SHOP.name} - ${p.type === 'vendor' ? 'purchase bill' : 'invoice'} ${v} dated ${fmtD(b.date)}: total ${inr(b.total)}, balance ${inr(dueOf(b))}. PDF attached.`, p, 'invoice'); },
  printSt: v => printDoc(statementDoc(v)), pdfSt: v => statementPdf(v).save('Statement-' + v + '.pdf'),
  shareSt: v => sendWhatsApp(statementPdf(v), 'Statement-' + v + '.pdf', window.__stMsg || 'Account statement attached.', P(v), 'statement'),
  go: v => go(v), billf: v => { billFilter = v; render(); }, closeModal, print: () => window.print(), addRow,
  pick: (v, el) => { sel[el.dataset.t] = v; render(); },
  pickPlace: (v, el) => { const f = el.closest('form'); f.querySelector('[name=city]').value = v; const st = el.dataset.s, sel = f.querySelector('select[name=state]'); if (sel && st && [...sel.options].some(o => o.value === st)) sel.value = st; $('#sug').innerHTML = ''; },
  newParty: v => modal(partyForm(v)), editParty: v => modal(partyForm(P(v).type, P(v))),
  invoice: invoiceModal, pay: payModal, statement: statementModal,
  deliver: v => { db.bills.find(b => b.id === v).delivery = 'Delivered'; save(); render(); toast('Marked delivered'); },
  picked: v => { db.returns.find(r => r.id === v).status = 'Picked'; save(); render(); toast('Return picked up'); },
  delStaff: v => { db.employees = db.employees.filter(e => e.id != v); save(); render(); }
};
document.addEventListener('focusin', e => { if (e.target.dataset?.input === 'place') showSug(e.target); });
document.addEventListener('click', e => { if (!e.target.closest('.placebox')) { const sb = $('#sug'); if (sb) sb.innerHTML = ''; } const el = e.target.closest('[data-act]'); if (el && ACT[el.dataset.act]) ACT[el.dataset.act](el.dataset.v, el); });
$('#burger').onclick = () => $('#side').classList.toggle('open');
document.addEventListener('input', e => {
  const k = e.target.dataset.input; if (!k) return;
  if (k === 'filt') { filt = e.target.value; const pos = e.target.selectionStart; render(); const i = $('[data-input=filt]'); i.focus(); i.setSelectionRange(pos, pos); }
  if (k === 'rpt') { const t = e.target; rpt[t.dataset.k] = t.type === 'checkbox' ? t.checked : t.value; const pos = t.selectionStart, kk = t.dataset.k; render(); if (kk === 'q') { const i = $('[data-k=q]'); i.focus(); try { i.setSelectionRange(pos, pos); } catch (_) {} } }
  if (k === 'place') showSug(e.target);
  if (k === 'calc') recalc();
  if (k === 'fill') { const it = (window.__items || {})[e.target.value]; if (it) { const r = e.target.closest('tr'); r.querySelector('[name=desc]').value = it.desc; r.querySelector('[name=price]').value = it.price; recalc(); } }
  if (k === 'retParty') $('#retLines').innerHTML = retTable(e.target.value);
  if (k === 'retQty') {
    const l = retCache[+e.target.dataset.i]; let v = parseFloat(e.target.value);
    if (isNaN(v) || v < 0) v = 0;
    if (v > l.rem) { v = l.rem; e.target.value = v; toast(`Only ${l.rem} can be returned (delivered ${l.qty}, already returned ${l.done})`); }
    $('#rc' + e.target.dataset.i).textContent = inr(v * l.price);
    $('#retTotal').textContent = inr([...document.querySelectorAll('.rq')].reduce((t, x) => t + (parseFloat(x.value) || 0) * retCache[+x.dataset.i].price, 0));
  }
});
document.addEventListener('submit', e => {
  const f = e.target.dataset.form; if (!f) return; e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target)), id = e.target.dataset.id;
  if (f === 'createParty') { const type = e.target.dataset.type; const nid = addParty({ ...d, type }); save(); closeModal(); sel[type] = nid; render(); toast('Created ' + nid); }
  if (f === 'saveParty') { Object.assign(P(id), d, { tol: +d.tol }); save(); closeModal(); render(); toast('Saved'); }
  if (f === 'createStaff') { db.employees.push({ id: Date.now(), ...d }); save(); render(); toast('Employee added'); }
  if (f === 'pay') { db.bills.find(b => b.id === id).pays.push({ date: d.date, amt: +d.amt }); save(); closeModal(); render(); toast('Payment recorded'); }
  if (f === 'createBill') {
    const items = [...document.querySelectorAll('#items tr')].slice(1).map(r => ({ code: r.querySelector('[name=code]').value, desc: r.querySelector('[name=desc]').value, qty: +r.querySelector('[name=qty]').value, price: +r.querySelector('[name=price]').value })).filter(i => (i.code || i.desc) && i.qty > 0);
    if (!items.length) return toast('Add at least one item');
    const kind = e.target.dataset.kind; if (P(d.party)?.type !== kind) return toast('Pick a ' + (kind === 'vendor' ? 'supplier' : 'customer'));
    const tot = items.reduce((a, i) => a + i.qty * i.price, 0), bid = addBill(d.party, d.date, items, Math.min(Math.max(+d.paid || 0, 0), tot), d.delivery); save(); sel[kind] = d.party; billFilter = kind; go('bills'); invoiceModal(bid);
  }
  if (f === 'createReturn') {
    const lines = returnLines(d.party), picks = [...document.querySelectorAll('.rq')].map(x => ({ l: lines[+x.dataset.i], q: parseFloat(x.value) || 0 })).filter(x => x.q > 0);
    if (!picks.length) return toast('Enter a return quantity for at least one item');
    const bad = picks.find(x => x.q > x.l.rem); if (bad) return toast(`Cannot return ${bad.q} of ${bad.l.key} — only ${bad.l.rem} left to return`);
    picks.forEach(({ l, q }) => db.returns.push({ id: 'RET-' + String(db.nextRet++).padStart(4, '0'), partyId: d.party, billId: l.b, date: today(), item: l.key, qty: q, amount: q * l.price, status: 'Pending Pickup', driver: '' }));
    save(); render(); toast(`${picks.length} item(s) returned — balance reduced`);
  }
});
/* animated brand letters */
document.querySelectorAll('[data-bn]').forEach(el => { el.innerHTML = [...el.dataset.bn].map((ch, i) => `<span style="--i:${i}">${ch}</span>`).join(''); });

/* ---------- login / startup ---------- */
async function start() {
  $('#login').classList.add('hidden'); $('#app').classList.remove('hidden');
  try { await load(); } catch (e) { $('#app').classList.add('hidden'); $('#login').classList.remove('hidden'); $('#lerr').textContent = 'Could not load data: ' + e.message; return; }
  render();
  if (location.hash.startsWith('#statement/') && P(location.hash.split('/')[1])) statementModal(location.hash.split('/')[1]);
}
$('#lform').onsubmit = async e => {
  e.preventDefault(); $('#lerr').textContent = '';
  const { error } = await sb.auth.signInWithPassword({ email: $('#lemail').value.trim(), password: $('#lpass').value });
  if (error) $('#lerr').textContent = error.message; else start();
};
ACT.logout = async () => { await sb.auth.signOut(); location.reload(); };
(async () => {
  sb = supabase.createClient(SB_URL, SB_KEY);
  const { data } = await sb.auth.getSession();
  if (data.session) start();
})();
