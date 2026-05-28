// Prepd — editorial PDF report generator
// Pure-JS, no dependencies. Matches the cream/emerald/gold brand.

import type { Report, QuestionSet, User, Case } from '@/types';

// ─── Page geometry ────────────────────────────────────────────────────────────
const W     = 612;
const H     = 792;
const ML    = 54;          // left margin
const MR    = 54;          // right margin
const MT    = 54;          // top margin (below header)
const MB    = 54;          // bottom margin
const CW    = W - ML - MR; // content width = 504
const LH    = 15;          // body line height
const HEADER_H = 72;       // emerald header band height

// ─── Colors (PDF RGB 0–1) ─────────────────────────────────────────────────────
const C = {
  emerald:    '0.024 0.306 0.231',
  emeraldSoft:'0.051 0.478 0.373',
  gold:       '0.788 0.659 0.298',
  cream:      '0.961 0.941 0.878',
  card:       '0.980 0.965 0.918',
  white:      '1 1 1',
  muted:      '0.380 0.380 0.380',
  riskHigh:   '0.725 0.110 0.110',
  riskMed:    '0.788 0.659 0.298',
  riskLow:    '0.051 0.478 0.373',
};

// ─── Fonts ────────────────────────────────────────────────────────────────────
// F1 = Helvetica, F2 = Helvetica-Bold, F3 = Helvetica-Oblique, F4 = Helvetica-BoldOblique
const F = { body: 'F1', bold: 'F2', italic: 'F3', display: 'F4' };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function esc(s: string): string {
  return s
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapText(text: string, charsPerLine: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > charsPerLine && cur) { lines.push(cur); cur = w; }
    else cur = next;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

// ─── Page builder ─────────────────────────────────────────────────────────────
class PageBuilder {
  ops: string[] = [];
  y: number;

  constructor() {
    this.y = H - HEADER_H - MT - 10;
  }

  // raw graphics op
  g(op: string) { this.ops.push(op); }

  // filled rect
  rect(x: number, y: number, w: number, h: number, color: string) {
    this.g(`q ${color} rg ${x} ${y} ${w} ${h} re f Q`);
  }

  // horizontal rule
  rule(x: number, y: number, w: number, thickness: number, color: string) {
    this.rect(x, y, w, thickness, color);
  }

  // single line of text — returns ops string
  text(
    s: string,
    x: number,
    y: number,
    font: string,
    size: number,
    color: string,
  ) {
    this.g(`BT /${font} ${size} Tf ${color} rg ${x} ${y} Td (${esc(s)}) Tj ET`);
  }

  // wrapped body paragraph — advances this.y, returns false if page overflow
  para(
    content: string,
    font: string,
    size: number,
    color: string,
    indent = 0,
    afterSpacing = 6,
  ): boolean {
    const chars = Math.floor((CW - indent) / (size * 0.52));
    const lines = wrapText(content, chars);
    for (const line of lines) {
      if (this.y < MB + LH) return false;
      this.text(line, ML + indent, this.y, font, size, color);
      this.y -= LH;
    }
    this.y -= afterSpacing;
    return true;
  }

  // section eyebrow label
  eyebrow(label: string) {
    if (this.y < MB + LH + 20) return;
    this.rule(ML, this.y - 2, CW, 0.5, C.emerald + ' 0.15 mul 0.06 0.231 add'); // approximate
    // gold rule
    this.rule(ML, this.y + 6, 28, 1.5, C.gold);
    this.y -= 2;
    this.text(label.toUpperCase(), ML, this.y, F.bold, 7.5, `${C.emerald} rg`);
    this.y -= 14;
  }

  stream(): string { return this.ops.join('\n'); }
}

// ─── Header band (drawn once on each page) ────────────────────────────────────
function buildHeader(
  clientName: string,
  caseName: string,
  sessionType: string,
  date: string,
  score: number,
): string {
  const ops: string[] = [];

  // Emerald band
  ops.push(`q ${C.emerald} rg 0 ${H - HEADER_H} ${W} ${HEADER_H} re f Q`);
  // Gold accent rule below band
  ops.push(`q ${C.gold} rg 0 ${H - HEADER_H - 2} ${W} 2 re f Q`);

  // "Prepd" wordmark (white, display font)
  ops.push(`BT /${F.display} 22 Tf ${C.white} rg ${ML} ${H - HEADER_H + 26} Td (Prepd) Tj ET`);
  // "Session Report" label
  ops.push(`BT /${F.body} 7.5 Tf ${C.cream} rg ${ML} ${H - HEADER_H + 13} Td (SESSION REPORT) Tj ET`);

  // Client name (right-aligned area)
  const nameX = W - MR - 180;
  ops.push(`BT /${F.bold} 7 Tf ${C.cream} rg ${nameX} ${H - HEADER_H + 42} Td (CLIENT) Tj ET`);
  ops.push(`BT /${F.italic} 14 Tf ${C.white} rg ${nameX} ${H - HEADER_H + 26} Td (${esc(clientName)}) Tj ET`);
  ops.push(`BT /${F.body} 8 Tf ${C.cream} rg ${nameX} ${H - HEADER_H + 13} Td (${esc(caseName)}) Tj ET`);

  // Score box (top-right corner)
  const sbX = W - MR - 52;
  const sbY = H - HEADER_H + 10;
  ops.push(`q ${C.gold} rg ${C.gold} RG ${sbX} ${sbY} 50 50 re f Q`);
  ops.push(`BT /${F.display} 22 Tf ${C.emerald} rg ${sbX + 6} ${sbY + 14} Td (${score.toFixed(1)}) Tj ET`);
  ops.push(`BT /${F.bold} 6 Tf ${C.emerald} rg ${sbX + 8} ${sbY + 6} Td (/10) Tj ET`);

  // Metadata row below header
  const metaY = H - HEADER_H - 22;
  ops.push(`BT /${F.body} 7.5 Tf ${C.muted} rg ${ML} ${metaY} Td (${esc(sessionType)}  ·  ${esc(date)}) Tj ET`);

  return ops.join('\n');
}

// ─── Build all report lines as page content streams ───────────────────────────
function buildPages(
  report: Report,
  questionSet: QuestionSet,
  client: User,
  case_: Case,
): string[] {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const header = buildHeader(
    client.full_name,
    case_.name,
    questionSet.set_type,
    date,
    report.consistency_score,
  );

  const pages: string[] = [];
  const pb = new PageBuilder();

  const flush = () => {
    pages.push(header + '\n' + pb.stream());
  };

  // ── Overall Assessment ──────────────────────────────────────────────
  pb.rule(ML, pb.y + 4, CW, 0.5, C.emerald);
  pb.y -= 8;
  pb.text('OVERALL ASSESSMENT', ML, pb.y, F.bold, 8, C.emerald);
  pb.rule(ML, pb.y - 3, 36, 1.5, C.gold);
  pb.y -= 16;

  // Trim to first 2 sentences
  const sentences = report.overall_assessment.match(/[^.!?]+[.!?]+/g) ?? [report.overall_assessment];
  const assessment = sentences.slice(0, 2).join(' ').trim();
  pb.para(assessment, F.italic, 10, C.emerald, 0, 10);

  // ── Consistency breakdown ───────────────────────────────────────────
  const scoreLabel =
    report.consistency_score >= 7 ? 'Strong' :
    report.consistency_score >= 5 ? 'Moderate' : 'Needs Work';
  pb.text(`Consistency Score: ${report.consistency_score.toFixed(1)} / 10  —  ${scoreLabel}`, ML, pb.y, F.bold, 9, C.emerald);
  // Score bar
  pb.y -= 10;
  pb.rect(ML, pb.y, CW, 4, C.emerald);
  pb.rect(ML, pb.y, CW * (report.consistency_score / 10), 4, C.gold);
  pb.y -= 18;

  // ── Red Flags / High Risk ───────────────────────────────────────────
  const highRisk = report.weak_points.filter(w => w.risk_level === 'High').slice(0, 2);
  const totalFlags = highRisk.length + Math.min(report.contradictions.length, 1) + Math.min(report.document_conflicts.length, 1);
  if (totalFlags > 0) {
    pb.text('HIGH PRIORITY FLAGS', ML, pb.y, F.bold, 8, C.riskHigh);
    pb.rule(ML, pb.y - 3, 36, 1.5, C.gold);
    pb.y -= 16;
    highRisk.forEach(wp => {
      pb.rect(ML, pb.y - 2, 3, LH - 2, C.riskHigh);
      pb.para(wp.finding, F.body, 9.5, C.emerald, 8, 4);
    });
    pb.y -= 6;
  }

  // ── Weak Points ─────────────────────────────────────────────────────
  const weakToShow = report.weak_points.slice(0, 3);
  if (weakToShow.length > 0) {
    pb.text('RISK ASSESSMENT', ML, pb.y, F.bold, 8, C.emerald);
    pb.rule(ML, pb.y - 3, 36, 1.5, C.gold);
    pb.y -= 16;
    weakToShow.forEach(wp => {
      const riskColor = wp.risk_level === 'High' ? C.riskHigh : wp.risk_level === 'Medium' ? C.riskMed : C.riskLow;
      pb.text(`[${wp.risk_level.toUpperCase()}]`, ML, pb.y, F.bold, 8, riskColor);
      pb.para(wp.finding, F.body, 9.5, C.emerald, 36, 4);
    });
    pb.y -= 6;
  }

  // ── Strong Points ───────────────────────────────────────────────────
  const strongToShow = report.strong_points.slice(0, 2);
  if (strongToShow.length > 0) {
    pb.text('STRONG POINTS', ML, pb.y, F.bold, 8, C.emerald);
    pb.rule(ML, pb.y - 3, 36, 1.5, C.gold);
    pb.y -= 16;
    strongToShow.forEach(sp => {
      pb.text('·', ML, pb.y, F.display, 12, C.gold);
      pb.para(sp, F.body, 9.5, C.emerald, 14, 4);
    });
    pb.y -= 6;
  }

  // ── Contradictions ──────────────────────────────────────────────────
  const contraToShow = report.contradictions.slice(0, 2);
  if (contraToShow.length > 0) {
    pb.text('CONTRADICTIONS', ML, pb.y, F.bold, 8, C.emerald);
    pb.rule(ML, pb.y - 3, 36, 1.5, C.gold);
    pb.y -= 16;
    contraToShow.forEach(c => {
      pb.para(c.description, F.italic, 9.5, C.emerald, 0, 3);
      const half = Math.floor(CW / 2) - 6;
      // left quote
      pb.text(esc(`"${c.answer_a.slice(0, 60)}${c.answer_a.length > 60 ? '…' : ''}"`), ML, pb.y, F.italic, 8.5, C.muted);
      // right quote
      pb.text(esc(`"${c.answer_b.slice(0, 60)}${c.answer_b.length > 60 ? '…' : ''}"`), ML + half + 12, pb.y, F.italic, 8.5, C.emeraldSoft);
      pb.y -= LH + 6;
    });
    pb.y -= 4;
  }

  // ── Document Conflicts ──────────────────────────────────────────────
  const docToShow = report.document_conflicts.slice(0, 2);
  if (docToShow.length > 0) {
    pb.text('DOCUMENT CONFLICTS', ML, pb.y, F.bold, 8, C.emerald);
    pb.rule(ML, pb.y - 3, 36, 1.5, C.gold);
    pb.y -= 16;
    docToShow.forEach(dc => {
      pb.para(dc.description, F.italic, 9.5, C.emerald, 0, 3);
      pb.para(`Client: "${dc.client_answer.slice(0, 80)}${dc.client_answer.length > 80 ? '…' : ''}"`, F.body, 8.5, C.muted, 8, 2);
      pb.para(`Document: "${dc.document_excerpt.slice(0, 80)}${dc.document_excerpt.length > 80 ? '…' : ''}"`, F.body, 8.5, C.emeraldSoft, 8, 6);
    });
  }

  // ── Volunteered Information ─────────────────────────────────────────
  const volToShow = report.volunteered_information.slice(0, 2);
  if (volToShow.length > 0) {
    pb.text('VOLUNTEERED INFORMATION', ML, pb.y, F.bold, 8, C.emerald);
    pb.rule(ML, pb.y - 3, 36, 1.5, C.gold);
    pb.y -= 16;
    volToShow.forEach(v => {
      pb.rect(ML, pb.y + 2, 2, LH - 4, C.gold);
      pb.para(v, F.body, 9.5, C.emerald, 8, 4);
    });
    pb.y -= 4;
  }

  // ── Recommended Next ────────────────────────────────────────────────
  if (report.recommended_next_set) {
    pb.text('RECOMMENDED NEXT SESSION', ML, pb.y, F.bold, 8, C.emerald);
    pb.rule(ML, pb.y - 3, 36, 1.5, C.gold);
    pb.y -= 16;
    pb.text(report.recommended_next_set, ML, pb.y, F.display, 13, C.emerald);
    pb.y -= 22;
  }

  // ── Footer line ─────────────────────────────────────────────────────
  pb.rule(ML, MB + 16, CW, 0.5, C.emerald);
  pb.text('PREPD LEGAL TECHNOLOGIES  ·  CONFIDENTIAL  ·  COUNSEL ONLY', ML, MB + 6, F.body, 6.5, C.muted);

  flush();
  return pages;
}

// ─── Assemble PDF objects ─────────────────────────────────────────────────────
export function buildReportPdfBlob(
  report: Report,
  questionSet: QuestionSet,
  client: User,
  case_: Case,
): Blob {
  const pageStreams = buildPages(report, questionSet, client, case_);
  const objects: string[] = [];

  // 1: Catalog, 2: Pages (placeholder), 3-6: Fonts
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push(''); // Pages — filled below
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>');
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-BoldOblique >>');

  const fontDict = '<< /F1 3 0 R /F2 4 0 R /F3 5 0 R /F4 6 0 R >>';
  const pageObjectNums: number[] = [];

  pageStreams.forEach((stream) => {
    const contentNum = objects.length + 1;
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    const pageNum = objects.length + 1;
    pageObjectNums.push(pageNum);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font ${fontDict} >> /Contents ${contentNum} 0 R >>`,
    );
  });

  objects[1] = `<< /Type /Pages /Kids [${pageObjectNums.map(n => `${n} 0 R`).join(' ')}] /Count ${pageObjectNums.length} >>`;

  const bodyObjs = objects.map((o, i) => `${i + 1} 0 obj\n${o}\nendobj\n`);
  const header = '%PDF-1.4\n';
  let offset = header.length;
  const offsets: number[] = [];
  for (const o of bodyObjs) { offsets.push(offset); offset += o.length; }

  const body = bodyObjs.join('');
  const xrefOffset = header.length + body.length;
  const xref = [
    'xref',
    `0 ${objects.length + 1}`,
    '0000000000 65535 f ',
    ...offsets.map(o => `${String(o).padStart(10, '0')} 00000 n `),
    'trailer',
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    'startxref',
    String(xrefOffset),
    '%%EOF',
  ].join('\n');

  return new Blob([header, body, xref], { type: 'application/pdf' });
}
