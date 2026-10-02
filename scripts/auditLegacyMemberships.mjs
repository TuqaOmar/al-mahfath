import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Local files only. Never import application/server/Firebase modules: some seed
// or save on import. This audit only writes the explicitly requested report.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const auditDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Amman', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date());
const sources = [
  { file: 'server/db.json', primary: true },
  { file: 'server/safar_data.json', primary: true },
  { file: 'server/db.backup.json', primary: false, counterpart: 'server/db.json' },
  { file: 'server/safar_data.backup.json', primary: false, counterpart: 'server/safar_data.json' }
];
const sha = value => createHash('sha256').update(value).digest('hex');
const tag = (kind, value) => value ? `${kind}-${sha(String(value)).slice(0, 12)}` : 'غير موجود';
const array = value => Array.isArray(value) ? value : [];
const present = value => value !== undefined && value !== null && value !== '';
const hasMembership = data => data.isSafarMember === true || present(data.groupId) || present(data.teacherId);
const status = value => ['pending', 'approved', 'rejected', 'cancelled'].includes(value) ? value : 'غير محدد';
const countSchema = data => ['users', 'groups', 'teachers', 'students', 'independentUsers', 'enrollmentRequests']
  .filter(key => Array.isArray(data[key])).map(key => `${key}: ${data[key].length}`).join('، ') || 'لا قوائم عضوية معروفة';
const localMembershipCount = data => ['users', 'students', 'independentUsers'].flatMap(key => array(data[key])).filter(hasMembership).length;
const repeatedValues = values => {
  const counts = new Map();
  for (const value of values.filter(present)) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts].filter(([, count]) => count > 1).length;
};
const safeError = error => {
  if (error.code === 'ENOENT') return 'الملف غير موجود';
  const position = /position (\d+)/.exec(error.message)?.[1];
  return position ? `JSON غير صالح عند الموضع ${position}` : 'تعذر قراءة JSON صالح';
};

async function loadSource(source) {
  try {
    const bytes = await readFile(resolve(root, source.file));
    let data;
    try { data = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, '')); }
    catch (error) { return { ...source, hash: sha(bytes), bytes: bytes.length, error: safeError(error) }; }
    return { ...source, hash: sha(bytes), bytes: bytes.length, data };
  } catch (error) { return { ...source, error: safeError(error) }; }
}

function seededUids(code) {
  return new Set([...code.matchAll(/\buid:\s*['"]([^'"]+)['"]/g)].map(match => match[1]));
}

const loaded = await Promise.all(sources.map(loadSource));
const seedCode = await Promise.all(['server/safarEcosystem.js', 'server/database.js']
  .map(file => readFile(resolve(root, file), 'utf8')));
const seeds = new Set(seedCode.flatMap(code => [...seededUids(code)]));
const primary = loaded.filter(source => source.primary && source.data);
const accounts = primary.flatMap(source => ['users', 'teachers', 'students', 'independentUsers']
  .flatMap(collection => array(source.data[collection]).map((data, index) => ({ source: source.file, collection, index, data }))));
const accountKey = record => record.data.uid || `${record.source}/${record.collection}/${record.index}`;
const uniqueAccounts = new Map();
for (const record of accounts) {
  const key = accountKey(record);
  if (!uniqueAccounts.has(key)) uniqueAccounts.set(key, []);
  uniqueAccounts.get(key).push(record);
}
const groups = primary.flatMap(source => array(source.data.groups).map(data => ({ source: source.file, data })));
const groupMap = new Map(groups.map(record => [record.data.id, record]));
const teachers = new Set(accounts.filter(record => record.collection === 'teachers').map(record => record.data.uid).filter(Boolean));
const membershipRows = accounts.filter(record => ['users', 'students', 'independentUsers'].includes(record.collection) &&
  hasMembership(record.data));
const byAccount = new Map();
for (const record of membershipRows) {
  const key = accountKey(record);
  if (!byAccount.has(key)) byAccount.set(key, []);
  byAccount.get(key).push(record);
}
const conflicts = [];
for (const [key, records] of uniqueAccounts) {
  for (const field of ['groupId', 'teacherId', 'isSafarMember']) {
    const values = new Set(records.map(record => record.data[field]).filter(value => value !== undefined));
    if (values.size > 1) conflicts.push({ key, field });
  }
}
const requests = primary.flatMap(source => array(source.data.enrollmentRequests).map((data, index) => ({ source: source.file, index, data })));
const requestIdentity = request => {
  const explicitUid = request.data.submittedBy || request.data.uid || request.data.userId;
  if (explicitUid) return { uid: explicitUid, kind: 'حقل هوية محلي صريح؛ غير متحقق من Auth' };
  const email = String(request.data.email || '').trim().toLowerCase();
  const matches = email ? [...uniqueAccounts].filter(([, records]) => records.some(record =>
    String(record.data.email || '').trim().toLowerCase() === email)) : [];
  return matches.length === 1 ? { uid: matches[0][0], kind: 'مطابقة بريد محلية فقط؛ تحتاج تأكيد uid' } :
    { kind: matches.length > 1 ? 'مطابقة بريد متعارضة؛ uid مطلوب' : 'بلا uid أو مطابقة بريد محلية؛ هوية Auth مطلوبة' };
};
const requestIdentities = requests.map(requestIdentity);
const pendingByUid = new Map();
requests.forEach((request, index) => {
  const identity = requestIdentities[index];
  if (identity.uid && request.data.status === 'pending') pendingByUid.set(identity.uid, (pendingByUid.get(identity.uid) || 0) + 1);
});

const lines = [
  '# حصر العضويات والطلبات القديمة محليًا',
  '',
  `تاريخ الحصر: ${auditDate}، توقيت عمّان. أُنتج التقرير من ملفات مساحة العمل فقط بأداة \`scripts/auditLegacyMemberships.mjs\`؛ لا اتصال بـFirebase أو Auth أو Firestore، ولا تنفيذ ترحيل أو تعديل ملفات البيانات. معرفات التقرير SHA-256 مختصرة ومتسقة للمقارنة؛ لم تُعرض أسماء أو عناوين بريد أو هواتف أو مفاتيح أو كلمات مرور.`,
  '',
  '## النطاق والنسخ الاحتياطية',
  '',
  '| المصدر | التصنيف | حالة القراءة / القوائم | SHA-256 |',
  '|---|---|---|---|'
];
for (const source of loaded) {
  const counterpart = loaded.find(item => item.file === source.counterpart);
  const copyInfo = !source.primary && source.hash && counterpart?.hash ?
    (source.hash === counterpart.hash ? '؛ مطابق للأصل بايتًا' : '؛ مختلف عن الأصل بايتًا') : '';
  const memberInfo = source.data ? `؛ سجلات مؤشرات عضوية: ${localMembershipCount(source.data)}` : '';
  lines.push(`| \`${source.file}\` | ${source.primary ? 'أساسي محلي' : 'نسخة احتياطية؛ خارج الإجماليات'} | ${source.error || countSchema(source.data)}${memberInfo}${copyInfo} | ${source.hash || 'غير متاح'} |`);
}
const seededAccounts = [...uniqueAccounts.keys()].filter(uid => seeds.has(uid)).length;
const generatedLegacy = [...uniqueAccounts.keys()].filter(uid => /^(student|teacher)_\d+$/.test(uid)).length;
const firebaseUidFields = accounts.filter(record => ['firebaseUid', 'authUid', 'firebaseAuthUid'].some(field => present(record.data[field]))).length;
const missingUid = accounts.filter(record => !present(record.data.uid)).length;
lines.push('', '## إجماليات المصادر الأساسية', '',
  `- ${uniqueAccounts.size} هوية محلية مميزة من ${accounts.length} سجل حساب؛ التكرار بين db وSafar يُحسب مرة واحدة بالـuid، ولا تدخل backups في الإجمالي. الحقول ليست دليل وجود حساب Firebase Auth.`,
  `- ${groups.length} حلقات، و${teachers.size} معرفات معلم محلية، و${byAccount.size} عضوية قديمة مرشحة للمراجعة قبل أي نقل، و${requests.length} طلبات قديمة.`,
  `- ${seededAccounts} هوية تطابق literals في كود seed، و${generatedLegacy} هوية بصيغة الإنشاء المحلي student/teacher + رقم. هذه مؤشرات مصدر تجريبي/محلي، وليست إثباتًا لغيابها من Auth.`,
  `- سجلات بلا حقل uid: ${missingUid}؛ سجلات تحمل firebaseUid/authUid/firebaseAuthUid صراحة: ${firebaseUidFields}. جميع هويات Auth غير متحقق منها؛ يلزم ربط مُراجع بالـuid الفعلي قبل النقل.`,
  `- تعارضات groupId/teacherId/isSafarMember بين نسخ الحساب الأساسية: ${conflicts.length}. غياب الحقل في أحد المصدرين لا يُعامل كتعارض.`,
  `- معرفات حلقات مكررة: ${repeatedValues(groups.map(record => record.data.id))}؛ رموز دعوة مكررة بعد trim/uppercase: ${repeatedValues(groups.map(record => String(record.data.code || '').trim().toUpperCase()))}. لا تُعرض الرموز في التقرير.`,
  `- أصحاب طلبات pending محلية متعددة بعد ربط الهوية الممكن: ${[...pendingByUid.values()].filter(count => count > 1).length}. لا يثبت هذا عدم وجود تكرار عند غياب uid في الطلب.`,
  '', '## الحلقات والعدادات', '',
  '| الحلقة | المعلم | الطلاب ذوو groupId في المصادر الأساسية | membersCount القديم | الحالة قبل النقل |',
  '|---|---|---|---|---|');
for (const { data } of groups) {
  const members = [...byAccount].filter(([, records]) => records.some(record => record.data.groupId === data.id)).length;
  const notes = [];
  if (!teachers.has(data.teacherId)) notes.push('المعلم غير موجود في قائمة teachers المحلية');
  if (Number(data.membersCount) !== members) notes.push('العداد لا يطابق السجلات؛ يلزم إعادة حساب بعد مراجعة الهوية');
  if (!present(data.studentsCount)) notes.push('studentsCount الجديد غير موجود');
  const teacherRecord = accounts.find(record => record.collection === 'teachers' && record.data.uid === data.teacherId)?.data;
  const teacherMembers = [...byAccount].filter(([, records]) => records.some(record => record.data.teacherId === data.teacherId)).length;
  if (teacherRecord && Number(teacherRecord.studentsCount) !== teacherMembers) notes.push('عدّاد المعلم لا يطابق سجلات عضوياته المحلية');
  if (seeds.has(data.teacherId)) notes.push('المعلم seed محلي؛ يلزم ربط Auth');
  lines.push(`| ${tag('group', data.id)} | ${tag('uid', data.teacherId)} | ${members} | ${Number.isFinite(Number(data.membersCount)) ? Number(data.membersCount) : 'غير محدد'} | ${notes.join('؛ ') || 'لا تعارض محلي ظاهر؛ هوية Auth غير متحققة'} |`);
}
lines.push('', '## العضويات المرشحة للمراجعة', '',
  'هذه قائمة حصر، وليست قائمة معتمدة للترحيل. تُراجع هويات seed والحسابات المحلية أولًا، ثم يُحدد أي منها يمثل بيانات حقيقية. تتطلب كل عضوية مقبولة كتابة memberships وربط users وإعادة حساب عدّاد الحلقة في تنفيذ منفصل مصرح به؛ لم تُنفّذ أي كتابة هنا.',
  '', '| الحساب | مصدر السجل | الحلقة | المعلم | isSafarMember | نقاط المراجعة |', '|---|---|---|---|---|---|');
for (const [key, records] of byAccount) {
  for (const record of records) {
    const data = record.data;
    const group = groupMap.get(data.groupId)?.data;
    const notes = [];
    if (!present(data.uid)) notes.push('uid مفقود');
    if (!present(data.groupId)) notes.push('groupId مفقود');
    else if (!group) notes.push('الحلقة غير موجودة محليًا');
    if (!present(data.teacherId)) notes.push('teacherId مفقود');
    else if (!teachers.has(data.teacherId)) notes.push('المعلم غير موجود محليًا');
    if (group && group.teacherId !== data.teacherId) notes.push('معلم الحساب يخالف معلم الحلقة');
    if (data.isSafarMember !== true) notes.push('مؤشرات مجموعة مع علم عضوية غير true');
    if (seeds.has(data.uid)) notes.push('مطابق seed');
    if (/^(student|teacher)_\d+$/.test(data.uid || '')) notes.push('هوية مولّدة محليًا');
    if (conflicts.some(conflict => conflict.key === key)) notes.push('تعارض بين المصدرين');
    notes.push('uid Auth غير متحقق');
    lines.push(`| ${tag('uid', key)} | \`${record.source}:${record.collection}\` | ${tag('group', data.groupId)} | ${tag('uid', data.teacherId)} | ${data.isSafarMember === true ? 'true' : data.isSafarMember === false ? 'false' : 'غير محدد'} | ${notes.join('؛ ')} |`);
  }
}
lines.push('', '## الطلبات القديمة', '',
  '| الطلب | الحالة | الحساب المرتبط محليًا | الإجراء المطلوب قبل نقل |', '|---|---|---|---|');
requests.forEach((request, index) => {
  const identity = requestIdentities[index];
  lines.push(`| ${tag('request', request.data.id || `${request.source}/${request.index}`)} | ${status(request.data.status)} | ${tag('uid', identity.uid)} | ${identity.kind} |`);
});
if (conflicts.length) {
  lines.push('', '## تعارضات الحساب بين المصادر', '', '| الحساب | الحقل |', '|---|---|');
  for (const conflict of conflicts) lines.push(`| ${tag('uid', conflict.key)} | ${conflict.field} |`);
}
lines.push('', '## قيود التنفيذ الحالي؛ ليست متطلبات نهائية', '',
  '- `memberships/{uid}` يسمح بوثيقة عضوية نشطة واحدة لكل مستخدم. `setMembership` يستبدل العضوية عند النقل ويحذفها عند الخروج؛ لا يمثل عضويات متوازية أو سجل انتقالات. هذه خاصية المخطط الحالي فقط؛ لم يُعتمد أن المنتج يجب أن يمنع تعدد الحلقات نهائيًا.',
  '- `enrollmentRequests/{uid}` يسمح بوثيقة طلب واحدة لكل مستخدم. `submitRequest` يعيد الطلب pending السابق دون إنشاء طلب آخر أو تحديث حقوله. بعد approved، أو أي حالة غير pending، يستخدم `tx.set(ref, data)` دون merge؛ لذلك يستبدل الطلب السابق وحقول approvedBy/approvedAt/groupId/teacherId ولا يحتفظ بسجل تاريخ. هذا قيد حالي يحتاج قرار منتج وحفظ تاريخ قبل أي نقل قد يحتوي عدة طلبات للمستخدم نفسه.',
  '- قبول الطلب وتغيير العضوية في معاملة واحدة يمنع تكرار العدّاد، لكنه لا يضيف سجلًا تاريخيًا للطلبات أو العضويات. لا يُستنتج من نجاح اختبارات المعاملة قبول القيود كمتطلبات نهائية.',
  '', '## حدود الحصر وخطة مراجعة النقل', '',
  '- لم تُقرأ Firestore الإنتاج أو Auth الإنتاج. لا يمكن من هذه الملفات تحديد عدد عضويات users القديمة الموجودة فقط في Firestore، أو الوثائق التي نُقلت سابقًا، أو التعارضات مع الحالة الإنتاجية. لا يدّعي التقرير أن القائمة تشمل كل الإنتاج.',
  '- النسخ الاحتياطية غير مضافة إلى عدد العضويات أو الطلبات. النسخة غير الصالحة لا تُصلح ولا تُسترجع تلقائيًا؛ تحتاج مراجعة مستقلة قبل اعتماد أي سجل منها. اختلاف البايتات وحده لا يثبت وجود عضويات إضافية.',
  '- سكربت `scripts/migrateToFirestore.js` الحالي لا ينشئ memberships أو enrollmentRequests ولا يضبط عدّادات العضوية. لم يُشغّل حتى بوضع dry-run؛ لا يُستخدم كحل نقل للرحلة الموحدة دون تعديل ومراجعة مستقلة.',
  '- الخطوة اللاحقة عند التصريح بنقل: تحديد الحقيقي مقابل seed، تقديم خريطة مُراجعة local uid → Firebase Auth uid، حسم تعدد العضويات وتاريخ الطلبات، ثم مقارنة نسخة إنتاج مقروءة بصلاحيات مضبوطة وإنشاء خطة dry-run واضحة قبل أي كتابة. لا تتضمن هذه المتابعة تنفيذ تلك الخطوة.',
  '', '## إعادة الحصر والتحقق من عدم تعديل البيانات', '',
  '```powershell',
  'node scripts/auditLegacyMemberships.mjs',
  'node scripts/auditLegacyMemberships.mjs --output reports/legacy-memberships.md',
  '```',
  '', 'الأمر الأول يطبع تقريرًا منقحًا فقط؛ الثاني يكتب ملف التقرير داخل مساحة العمل. تُقارن SHA-256 لجميع المصادر بعد القراءة، ويُرفض النجاح إذا تغيّر أي مصدر أثناء الحصر. لا تُحمّل env أو credentials، ولا تُجرى اتصالات شبكة.', '');

for (const source of loaded) {
  if (!source.hash) continue;
  if (sha(await readFile(resolve(root, source.file))) !== source.hash) throw new Error(`Source changed during audit: ${source.file}`);
}
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--output')) throw new Error('Usage: node scripts/auditLegacyMemberships.mjs [--output reports/legacy-memberships.md]');
const report = `${lines.join('\n')}\n`;
if (args.length) {
  // A report write is allowed only within the workspace reports directory.
  const reportDir = resolve(root, 'reports');
  const output = resolve(root, args[1]);
  if (dirname(output) !== reportDir || !output.endsWith('.md')) throw new Error('Output must be a Markdown file directly inside workspace reports/.');
  await mkdir(reportDir, { recursive: true });
  await writeFile(output, report, 'utf8');
  console.log(`Audit complete: ${byAccount.size} local membership candidates, ${requests.length} requests. Report: ${args[1]}. Source hashes unchanged; no Firebase access.`);
} else process.stdout.write(report);
