import React, { useMemo, useState, useEffect } from "react";

// Food Safety MBTI (FS‑MBTI) — MVP v1.1 (single-file React)
// Additions in v1.1:
// - 24문항(축당 6문항)로 신뢰도 강화
// - 시작 화면(동의/가명 입력) + 진행 저장
// - 브랜드 컬러/로고 슬롯, 다크모드 토글
// - 결과 섹션: 16유형 기본 설명 템플릿 + 코칭 액션 3가지 자동 생성
// - CSV 내보내기(개인 로컬만), 프린트 친화 스타일

// ===================== 설정(브랜딩/i18n) =====================
const BRAND = {
  nameKo: "식품안전 MBTI",
  nameEn: "Food Safety MBTI",
  primary: "#0F172A", // slate-900
  logoText: "FS‑MBTI",
};

const LOCALE = {
  ko: {
    title: "식품안전 행동/사고 성향 자가진단",
    disclaimer: "※ 본 도구는 교육·코칭 목적의 참고 자료이며, 공식 MBTI 검사가 아닙니다.",
    consent: "목적과 이용에 동의하며 비식별 데이터로 로컬 저장됨을 이해합니다.",
    start: "시작하기",
    nickname: "가명(선택)",
    continue: "계속",
    progress: "진행도",
    reset: "초기화",
    seeResult: "결과 보기",
    backToItems: "문항 다시 보기",
    newStart: "새로 시작",
    copyResult: "결과 문구 복사",
    copied: "복사됨!",
    exportJson: "JSON 내보내기",
    exportCsv: "CSV 내보내기",
    print: "인쇄하기",
  },
};

// ===================== 축 정의 =====================
const AXES = [
  { key: "PR", left: "P", right: "R", title: "Risk Orientation", leftLabel: "Proactive", rightLabel: "Reactive" },
  { key: "DB", left: "D", right: "B", title: "Attention Style", leftLabel: "Detail", rightLabel: "Big-picture" },
  { key: "CE", left: "C", right: "E", title: "Focus Driver", leftLabel: "Compliance/Process", rightLabel: "Engagement/People" },
  { key: "JA", left: "J", right: "A", title: "Work Style", leftLabel: "Structured", rightLabel: "Adaptive" },
];

// ===================== 문항(24문항) =====================
const ITEMS = [
  // PR (P/R)
  { id: 1, axis: "PR", dir: "P", text: "이상 징후를 발견하면 공식 절차 전이라도 즉시 임시조치를 취한다." },
  { id: 2, axis: "PR", dir: "R", text: "증거와 영향이 확실해질 때까지 관망하는 편이다." },
  { id: 3, axis: "PR", dir: "P", text: "가벼운 편차도 재발 방지 대책을 먼저 고민한다." },
  { id: 4, axis: "PR", dir: "R", text: "감사/점검에서 지적될 때 우선순위를 높인다." },
  { id: 5, axis: "PR", dir: "P", text: "리스크 예측 회의를 주기적으로 제안/주도한다." },
  { id: 6, axis: "PR", dir: "R", text: "생산 차질이 우려되면 조치보다 지속운영을 우선한다." },

  // DB (D/B)
  { id: 7, axis: "DB", dir: "D", text: "기록지의 날짜/서명/단위 등 사소한 누락도 바로잡는다." },
  { id: 8, axis: "DB", dir: "B", text: "세부 항목보다 전체 공정 흐름의 병목을 먼저 본다." },
  { id: 9, axis: "DB", dir: "D", text: "온도/시간 기준의 허용오차를 수치로 확인한다." },
  { id: 10, axis: "DB", dir: "B", text: "부서 간 핸드오프 설계를 우선적으로 개선한다." },
  { id: 11, axis: "DB", dir: "D", text: "원재료 라벨·로트·유통기한을 습관적으로 재확인한다." },
  { id: 12, axis: "DB", dir: "B", text: "개별 오류보다 가치사슬 최적화를 우선한다." },

  // CE (C/E)
  { id: 13, axis: "CE", dir: "C", text: "표준서(SOP) 준수가 최우선이며 예외는 최소화해야 한다." },
  { id: 14, axis: "CE", dir: "E", text: "현장 참여와 동기부여가 지켜지면 규정 준수는 자연히 따른다." },
  { id: 15, axis: "CE", dir: "C", text: "내/외부 인증 요구사항을 체크리스트로 운영한다." },
  { id: 16, axis: "CE", dir: "E", text: "습관 변화를 위해 피드백/코칭 일정을 따로 잡는다." },
  { id: 17, axis: "CE", dir: "C", text: "변경관리(MOC)에서 승인 단계 누락을 용납하지 않는다." },
  { id: 18, axis: "CE", dir: "E", text: "칭찬/피드백 루프를 통해 자발적 준수를 끌어낸다." },

  // JA (J/A)
  { id: 19, axis: "JA", dir: "J", text: "5S/청결점검을 캘린더에 고정 운영한다." },
  { id: 20, axis: "JA", dir: "A", text: "예기치 못한 생산변동 시 점검 순서를 유연 조정한다." },
  { id: 21, axis: "JA", dir: "J", text: "문서/기록 수정은 두줄 긋고 서명 등 표준대로 처리한다." },
  { id: 22, axis: "JA", dir: "A", text: "고객 이슈 발생 시 일부 절차를 간소화해 신속 대응한다." },
  { id: 23, axis: "JA", dir: "J", text: "교차오염 방지를 위한 구역/표지/색구분을 엄격 적용한다." },
  { id: 24, axis: "JA", dir: "A", text: "상황에 따라 검사 빈도/순서를 탄력적으로 바꾼다." },
];

const SCALE = [
  { value: 1, label: "전혀 아니다" },
  { value: 2, label: "아니다" },
  { value: 3, label: "보통" },
  { value: 4, label: "그렇다" },
  { value: 5, label: "매우 그렇다" },
];

const STORAGE_KEY = "fsmbti_answers_v1_1";

function classNames(...a) { return a.filter(Boolean).join(" "); }

// ===================== 헤더/브랜딩 =====================
function Header({ dark, setDark }) {
  return (
    <header className="max-w-3xl mx-auto text-center mt-8 mb-6 print:hidden">
      <div className="flex items-center justify-center gap-3">
        <div className="rounded-2xl px-3 py-1 font-bold" style={{ background: BRAND.primary, color: "white" }}>{BRAND.logoText}</div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{BRAND.nameKo} (FS‑MBTI)</h1>
      </div>
      <p className="text-sm md:text-base opacity-70 mt-2">{LOCALE.ko.title}</p>
      <div className="flex justify-center mt-3 gap-3">
        <button className="px-3 py-1 rounded-lg border" onClick={() => setDark(!dark)}>{dark ? "라이트모드" : "다크모드"}</button>
        <span className="text-xs opacity-60 self-center">v1.1</span>
      </div>
    </header>
  );
}

function Progress({ answered, total }) {
  const pct = Math.round((answered / total) * 100);
  return (
    <div className="max-w-3xl mx-auto mb-6 print:hidden">
      <div className="flex justify-between text-sm opacity-80 mb-1">
        <span>{LOCALE.ko.progress}</span>
        <span>{answered}/{total} ({pct}%)</span>
      </div>
      <div className="w-full bg-gray-200/60 h-2 rounded-full overflow-hidden">
        <div className="h-2" style={{ width: `${pct}%`, background: BRAND.primary }} />
      </div>
    </div>
  );
}

function Question({ item, value, onChange }) {
  return (
    <div className="rounded-2xl shadow p-4 md:p-5 bg-white/90 border border-gray-100">
      <p className="font-medium mb-3 leading-relaxed">{item.id}. {item.text}</p>
      <div className="grid grid-cols-5 gap-2">
        {SCALE.map(s => (
          <button
            key={s.value}
            onClick={() => onChange(item.id, s.value)}
            className={classNames(
              "py-3 px-2 rounded-xl border text-sm md:text-base",
              value === s.value ? "text-white border-transparent" : "bg-gray-50 hover:bg-gray-100 border-gray-200"
            )}
            style={value === s.value ? { background: BRAND.primary } : {}}
            aria-pressed={value === s.value}
          >
            {s.value}. {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// =============== 점수 계산 & 결과 코드 ===============
function computeScores(answers) {
  const axisScores = { PR: 0, DB: 0, CE: 0, JA: 0 };
  const axisCounts = { PR: 0, DB: 0, CE: 0, JA: 0 };
  ITEMS.forEach(it => {
    const a = answers[it.id];
    if (!a) return;
    const centered = a - 3; // -2..+2
    const leftKey = AXES.find(ax => ax.key === it.axis)?.left;
    const signed = it.dir === leftKey ? centered : -centered;
    axisScores[it.axis] += signed;
    axisCounts[it.axis] += 1;
  });
  const letters = AXES.map(ax => (axisScores[ax.key] >= 0 ? ax.left : ax.right));
  const normalized = AXES.reduce((acc, ax) => {
    const maxAbs = axisCounts[ax.key] * 2;
    const val = axisScores[ax.key];
    acc[ax.key] = maxAbs === 0 ? 0.5 : (val + maxAbs) / (2 * maxAbs);
    return acc;
  }, {});
  return { axisScores, axisCounts, letters, normalized };
}

function Bars({ normalized }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {AXES.map(ax => (
        <div key={ax.key} className="p-4 rounded-2xl border bg-white">
          <div className="flex justify-between text-sm opacity-80 mb-2">
            <span>{ax.leftLabel}</span>
            <span className="font-semibold">{ax.title}</span>
            <span>{ax.rightLabel}</span>
          </div>
          <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
            <div className="h-3" style={{ width: `${Math.round((normalized[ax.key] ?? 0.5) * 100)}%`, background: BRAND.primary }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// =============== 유형 설명 템플릿 ===============
const TYPE_TEMPLATES = (code) => {
  const nameMap = {
    PDCJ: "감사관형(표준 선도 Pro)",
    PDBA: "혁신 코디네이터",
    PDEJ: "정밀 운영리더",
    PDCA: "예방 중심 퍼실리테이터",
  };
  const title = nameMap[code] || `${code} 유형`;
  const generic = [
    "강점과 리스크는 축별 막대그래프를 참고하세요.",
    "상보형(반대축) 파트너와 페어링을 고려하세요.",
    "월 1회 행동 리뷰(표준·현장·사람 균형)를 추천합니다.",
  ];
  return { title, bullets: generic };
};

function genCoachingActions(letters) {
  const actions = [];
  if (letters[0] === "R") actions.push("이상징후 To‑Do(15분)와 임시조치 권한 구체화");
  else actions.push("주간 선제 점검 항목 3개 설정 및 실행 리뷰");
  if (letters[1] === "B") actions.push("라인별 병목지도 작성 → 개선 1건 시범 적용");
  else actions.push("기록지 누락 Top3 체크리스트 제작 및 현장 배포");
  if (letters[2] === "E") actions.push("칭찬/피드백 루프(주1회) 운영");
  else actions.push("규격·감사 기준 10분 미니학습 운영");
  return actions.slice(0, 3);
}

function ResultCard({ letters, normalized, nickname }) {
  const code = letters.join("");
  const desc = TYPE_TEMPLATES(code);
  const actions = genCoachingActions(letters);
  return (
    <div className="rounded-2xl border bg-white p-6 space-y-4">
      <h2 className="text-2xl font-bold">{nickname ? `${nickname}님의 결과: ` : "결과: "}{desc.title} — {code}</h2>
      <Bars normalized={normalized} />
      <ul className="list-disc pl-5 opacity-90">
        {desc.bullets.map((b, i) => <li key={i}>{b}</li>)}
      </ul>
      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="font-semibold mb-2">코칭 액션(다음 30일)</h3>
        <ol className="list-decimal pl-5 space-y-1">
          {actions.map((a, i) => <li key={i}>{a}</li>)}
        </ol>
      </div>
      <p className="text-sm opacity-60">{LOCALE.ko.disclaimer}</p>
    </div>
  );
}

function Share({ code }) {
  const [copied, setCopied] = useState(false);
  const shareText = `내 FS‑MBTI 결과는 ${code} 입니다.`;
  const doCopy = async () => {
    try { await navigator.clipboard.writeText(shareText); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };
  return (
    <button className="px-3 py-2 rounded-lg border" onClick={doCopy}>
      {copied ? LOCALE.ko.copied : LOCALE.ko.copyResult}
    </button>
  );
}

function ExportJSON({ answers, code, nickname }) {
  const onExport = () => {
    const payload = { code, answers, nickname, timestamp: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `fs-mbti-${code}.json`; a.click(); URL.revokeObjectURL(url);
  };
  return <button className="px-3 py-2 rounded-lg border" onClick={onExport}>{LOCALE.ko.exportJson}</button>;
}

function ExportCSV({ answers, code, nickname }) {
  const onExport = () => {
    const headers = ["id","axis","dir","score","label"];
    const rows = ITEMS.map(it => [it.id, it.axis, it.dir, answers[it.id] ?? "", (SCALE.find(s=>s.value===answers[it.id])?.label ?? "")]);
    const csv = [headers.join(","), ...rows.map(r=>r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `fs-mbti-${code}.csv`; a.click(); URL.revokeObjectURL(url);
  };
  return <button className="px-3 py-2 rounded-lg border" onClick={onExport}>{LOCALE.ko.exportCsv}</button>;
}

function ShareLinkQR() {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const copy = async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(()=>setCopied(false),1200);} catch {} };
  const qrSrc = url ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}` : '';
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl border">
      <div className="hidden sm:block">
        {qrSrc ? <img src={qrSrc} alt="QR code" className="w-24 h-24"/> : <div className="w-24 h-24 grid place-items-center text-xs opacity-60">배포 후 QR 표시</div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm opacity-80 truncate">{url || '배포 후 링크가 표시됩니다.'}</p>
        <div className="mt-2 flex gap-2">
          <button className="px-3 py-1 rounded-lg border" onClick={copy}>{copied ? '링크 복사됨!' : '링크 복사'}</button>
          {qrSrc && <a className="px-3 py-1 rounded-lg border" href={qrSrc} download>QR 다운로드</a>}
        </div>
      </div>
    </div>
  );
}

function StartScreen({ onStart, nickname, setNickname, consent, setConsent }) {
  return (
    <div className="max-w-xl mx-auto rounded-2xl border bg-white p-6 space-y-4">
      <p className="opacity-80">{LOCALE.ko.title}</p>
      <p className="text-sm opacity-60">{LOCALE.ko.disclaimer}</p>
      <label className="block mt-2 text-sm">
        {LOCALE.ko.nickname}
        <input className="mt-1 w-full rounded-xl border p-2" value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="예: 현장리더A" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} />
        <span>{LOCALE.ko.consent}</span>
      </label>
      <button
        className="px-4 py-2 rounded-xl text-white disabled:opacity-50"
        style={{ background: BRAND.primary }}
        onClick={onStart}
        disabled={!consent}
      >{LOCALE.ko.start}</button>
    </div>
  );
}

export default function App() {
  const [dark, setDark] = useState(false);
  const [answers, setAnswers] = useState(() => { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : {}; } catch { return {}; } });
  const [showResult, setShowResult] = useState(false);
  const [started, setStarted] = useState(() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY+"_started")||"false"); } catch { return false; } });
  const [nickname, setNickname] = useState(() => { try { return localStorage.getItem(STORAGE_KEY+"_nick") || ""; } catch { return ""; } });
  const [consent, setConsent] = useState(() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY+"_consent")||"false"); } catch { return false; } });

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(answers)); }, [answers]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY+"_started", JSON.stringify(started)); }, [started]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY+"_nick", nickname); }, [nickname]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY+"_consent", JSON.stringify(consent)); }, [consent]);

  const { letters, normalized } = useMemo(() => computeScores(answers), [answers]);
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  const reset = () => { setAnswers({}); setShowResult(false); setStarted(false); setNickname(""); setConsent(false); };

  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);

  return (
    <div className={classNames("min-h-screen pb-16", dark ? "bg-[#0b1020] text-white" : "bg-gray-50 text-gray-900")}>      
      <Header dark={dark} setDark={setDark} />
      <main className="max-w-3xl mx-auto px-4 space-y-6">
        {!started && (
          <StartScreen onStart={() => setStarted(true)} nickname={nickname} setNickname={setNickname} consent={consent} setConsent={setConsent} />
        )}

        {started && <Progress answered={answeredCount} total={ITEMS.length} />}

        {started && !showResult ? (
          <div className="space-y-4">
            {ITEMS.map(item => (
              <Question key={item.id} item={item} value={answers[item.id]} onChange={(id, val) => setAnswers(prev => ({ ...prev, [id]: val }))} />
            ))}
            <div className="flex gap-3 justify-end pt-2 print:hidden">
              <button className="px-4 py-2 rounded-xl border bg-white/80 hover:bg-white" onClick={reset}>{LOCALE.ko.reset}</button>
              <button className="px-4 py-2 rounded-xl text-white disabled:opacity-50" style={{ background: BRAND.primary }} onClick={() => setShowResult(true)} disabled={answeredCount < ITEMS.length}>{LOCALE.ko.seeResult}</button>
            </div>
          </div>
        ) : null}

        {started && showResult && (
          <div className="space-y-6">
            <ResultCard letters={letters} normalized={normalized} nickname={nickname} />
            <div className="rounded-2xl border bg-white/90 p-4 flex flex-wrap gap-2 print:hidden">
              <button className="px-3 py-2 rounded-lg border" onClick={() => setShowResult(false)}>{LOCALE.ko.backToItems}</button>
              <button className="px-3 py-2 rounded-lg border" onClick={reset}>{LOCALE.ko.newStart}</button>
              <Share code={letters.join("")} />
              <ExportJSON answers={answers} code={letters.join("")} nickname={nickname} />
              <ExportCSV answers={answers} code={letters.join("")} nickname={nickname} />
              <ShareLinkQR />
              <button className="px-3 py-2 rounded-lg border" onClick={() => window.print()}>{LOCALE.ko.print}</button>
            </div>
          </div>
        )}
      </main>

      <style>{`@media print { .print\\:hidden{display:none} header{display:none} main{max-width:100%} body{background:white} }`}</style>
    </div>
  );
}
