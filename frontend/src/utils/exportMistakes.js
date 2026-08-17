// 错题导出：生成打印用 HTML 并调起浏览器打印（可另存为 PDF）。
// 选浏览器打印而非后端生成：零新增依赖、中文渲染无字体问题、格式迭代只改 HTML/CSS。

// record_tags 中的系统保留种类（与 MistakesPage 一致），导出标签时剔除
const RESERVED_KINDS = ['mistake', 'knowledge', 'reflection'];

const MASTERY_LABELS = { 0: '未掌握', 1: '基本熟悉', 2: '已掌握' };

// 导出项默认值
export const DEFAULT_EXPORT_OPTS = {
  question: true,    // 原题（说明文字 + 原题图片）
  blank: false,      // 空白题（空白题目图片）
  solution: true,    // 解答过程（解答过程图片）
  tags: true,        // 标签
  knowledge: true,   // 知识点（梳理文字 + 知识点整理图片）
  reflection: true,  // 反思（文字 + 反思备注图片）
  blankSpace: false, // 预留作答空白区
};

const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

function parseAttachments(raw) {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((a) => a && a.url) : [];
  } catch {
    return [];
  }
}

// 旧版纯图片列（question_images 等）：元素可能是 {key,url,name} 或纯 URL 字符串
function parseImages(raw) {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((item) => (typeof item === 'string' ? { url: item } : item))
      .filter((item) => item && item.url);
  } catch {
    return [];
  }
}

// 统一取附件：优先新 attachments 字段，空则回退旧版三个图片列（与 MistakesPage 的 legacyToAttachments 一致）
function attachmentsOf(rec) {
  const atts = parseAttachments(rec.attachments);
  if (atts.length) return atts;
  const out = [];
  const push = (raw, type) => parseImages(raw).forEach((img) => out.push({ ...img, type }));
  push(rec.question_images, '原题');
  push(rec.knowledge_images, '知识点整理');
  push(rec.reflection_images, '反思备注');
  return out;
}

const imagesHtml = (atts, type) =>
  atts
    .filter((a) => a.type === type)
    .map((a) => `<img class="q-img" src="${escapeHtml(a.url)}" alt="${escapeHtml(a.note || a.name || type)}" />`)
    .join('');

const section = (title, inner) =>
  inner ? `<div class="sec"><div class="sec-title">${title}</div>${inner}</div>` : '';

function recordHtml(rec, idx, opts) {
  const atts = attachmentsOf(rec);
  const tags = (rec.record_tags || '')
    .split(',').map((s) => s.trim())
    .filter((s) => s && !RESERVED_KINDS.includes(s));

  const meta = [
    rec.record_date,
    MASTERY_LABELS[rec.mastery_level] || '',
  ].filter(Boolean).join(' · ');

  let body = '';
  if (opts.question) {
    body += section('原题',
      (rec.question_text ? `<p class="q-text">${escapeHtml(rec.question_text)}</p>` : '')
      + imagesHtml(atts, '原题'));
  }
  if (opts.blank) {
    body += section('空白题', imagesHtml(atts, '空白题目'));
  }
  if (opts.solution) {
    body += section('解答过程', imagesHtml(atts, '解答过程'));
  }
  if (opts.tags && tags.length) {
    body += section('标签', `<p class="tags">${tags.map((t) => `<span class="tag">#${escapeHtml(t)}</span>`).join('')}</p>`);
  }
  if (opts.knowledge) {
    body += section('知识点',
      (rec.knowledge_note ? `<p class="q-text">${escapeHtml(rec.knowledge_note)}</p>` : '')
      + imagesHtml(atts, '知识点整理'));
  }
  if (opts.reflection) {
    body += section('反思',
      (rec.reflection_text ? `<p class="q-text">${escapeHtml(rec.reflection_text)}</p>` : '')
      + imagesHtml(atts, '反思备注'));
  }
  if (opts.blankSpace) {
    body += '<div class="blank-space"></div>';
  }

  return `<div class="record">
    <div class="rec-head"><span class="rec-no">第 ${idx + 1} 题</span><span class="rec-meta">${escapeHtml(meta)}</span></div>
    ${body}
  </div>`;
}

const PAGE_CSS = `
  @page { size: A4; margin: 18mm; }
  * { box-sizing: border-box; }
  body { font-family: "Songti SC", "SimSun", "Noto Serif CJK SC", serif; color: #1a1a1a; font-size: 12pt; line-height: 1.7; max-width: 180mm; margin: 0 auto; padding: 24px; }
  .doc-title { font-size: 16pt; font-weight: 700; margin: 0 0 4pt; }
  .doc-sub { font-size: 9pt; color: #666; margin: 0 0 14pt; }
  .record { margin-bottom: 18pt; }
  .record + .record { border-top: 1px solid #ccc; padding-top: 14pt; page-break-before: auto; }
  /* 小节标题与其内容尽量不跨页断开；整条题允许跨页，避免首条超高把第 1 页挤空 */
  .sec { page-break-inside: avoid; }
  .q-img { page-break-inside: avoid; }
  .rec-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8pt; }
  .rec-no { font-size: 13pt; font-weight: 700; }
  .rec-meta { font-size: 9pt; color: #666; }
  .sec { margin-bottom: 10pt; }
  .sec-title { font-size: 13pt; font-weight: 700; color: #222; border-left: 4px solid #222; padding-left: 7pt; margin-bottom: 5pt; }
  .q-text { margin: 0; white-space: pre-wrap; }
  .q-img { display: block; max-width: 100%; max-height: 120mm; margin: 6pt 0; }
  .tags { margin: 0; }
  .tag { display: inline-block; border: 1px solid #999; border-radius: 3pt; padding: 0 5pt; margin: 0 4pt 2pt 0; font-size: 9pt; color: #333; }
  .blank-space { height: 60mm; border: 1px dashed #999; margin-top: 6pt; }
`;

/** 在新窗口展示/打印所选错题。records 为原始记录数组，opts 见 DEFAULT_EXPORT_OPTS。
 *  autoPrint=true 时加载完成后自动调起打印（导出 PDF 用）；false 仅展示网页（查看详情用）。 */
export function openMistakesPrintWindow(records, opts, { autoPrint = true, title = '错题导出' } = {}) {
  const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8" />
<title>${escapeHtml(title)}</title><style>${PAGE_CSS}</style></head><body>
<p class="doc-title">${escapeHtml(title)}</p>
<p class="doc-sub">共 ${records.length} 题 · 导出时间 ${new Date().toLocaleString('zh-CN')}</p>
${records.map((r, i) => recordHtml(r, i, opts)).join('')}
</body></html>`;

  const w = window.open('', '_blank');
  if (!w) return false; // 被浏览器拦截弹窗
  w.document.write(html);
  w.document.close();
  // 等图片等资源加载完再调起打印
  if (autoPrint) {
    w.addEventListener('load', () => setTimeout(() => { w.focus(); w.print(); }, 100));
  }
  return true;
}
