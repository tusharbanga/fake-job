import React, { useState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  UploadCloud,
  FileText,
  ChevronDown,
  ChevronRight,
  Highlighter,
  Loader2,
  ScanEye,
  Coins,
  Settings,
  LogIn,
  LogOut,
  ExternalLink,
  X,
} from "lucide-react";
import { analyzeJob, getCurrentUser, openGoogleLogin, uploadResume } from "./frontend/jobLensApi";

/* ---------------------------------------------------------------------
   RESUME STORAGE
   - Standalone browser: localStorage remains the fallback.
   - Chrome extension popup/iframe: talk to the opener/content script via
     postMessage and let the content script write to chrome.storage.local.
   We explicitly detect extension-backed windows instead of relying on
   window.self !== window.top, because the extension opens the panel as a
   separate popup window.
--------------------------------------------------------------------- */
const isExtensionBridge = typeof window !== "undefined" && (window.parent !== window || Boolean(window.opener));

function postToHost(type, payload) {
  return new Promise((resolve) => {
    const requestId = Math.random().toString(36).slice(2);
    const ackType = { JOBLENS_SAVE_RESUME: "JOBLENS_SAVE_RESUME_ACK", JOBLENS_GET_RESUME: "JOBLENS_RESUME_DATA", JOBLENS_REMOVE_RESUME: "JOBLENS_REMOVE_RESUME_ACK" }[type];
    const targetWindow = (window.parent !== window) ? window.parent : (window.opener || null);

    if (!targetWindow) {
      console.warn("postToHost: no target window available for", type);
      resolve(null);
      return;
    }

    const timeout = setTimeout(() => {
      window.removeEventListener("message", listener);
      console.warn("postToHost timeout for", type);
      resolve(null);
    }, 5000);

    function listener(event) {
      if (event.data?.type !== ackType || event.data?.requestId !== requestId) return;
      clearTimeout(timeout);
      window.removeEventListener("message", listener);
      resolve(event.data);
    }

    window.addEventListener("message", listener);
    targetWindow.postMessage({ type, payload, requestId }, "*");
  });
}

async function saveResume(record) {
  if (isExtensionBridge) {
    const ack = await postToHost("JOBLENS_SAVE_RESUME", record);
    if (ack?.ok) return true;
    console.warn("saveResume: extension bridge rejected the resume save", ack);
    return false;
  }

  try {
    localStorage.setItem("joblens.resume", JSON.stringify(record));
    return true;
  } catch (err) {
    console.warn("Could not persist resume:", err);
    return false;
  }
}

async function loadResume() {
  if (isExtensionBridge) {
    const res = await postToHost("JOBLENS_GET_RESUME");
    if (res?.payload) {
      console.log("loadResume: got payload from host", res.payload);
      return res.payload;
    }
    console.warn("loadResume: host relay returned no result");
    return null;
  }

  try {
    const saved = localStorage.getItem("joblens.resume");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

async function clearResume() {
  if (isExtensionBridge) {
    await postToHost("JOBLENS_REMOVE_RESUME");
    return;
  }
  localStorage.removeItem("joblens.resume");
}

/* ---------------------------------------------------------------------
   THEME TOKENS — Apple-style: crisp neutrals, restrained accent, soft depth
--------------------------------------------------------------------- */
const THEMES = {
  light: {
    pageBg: "#FFFFFF",
    bg: "#FFFFFF",
    mesh: "none",
    surface: "#FFFFFF",
    surfaceAlt: "#F8F8F8",
    border: "rgba(20,20,20,0.08)",
    borderStrong: "rgba(20,20,20,0.13)",
    textPrimary: "#181818",
    textSecondary: "#6B6B70",
    textMuted: "#9C9CA1",
    accent: "#0A6CFF",
    accentSoft: "rgba(10,108,255,0.10)",
    shadowTight: "0 1px 2px rgba(20,20,20,0.05)",
    shadowWide: "0 10px 24px -8px rgba(20,20,20,0.10)",
    shadowTightHero: "0 2px 4px rgba(20,20,20,0.07)",
    shadowWideHero: "0 18px 40px -12px rgba(20,20,20,0.14)",
    highlightTop: "inset 0 1px 0 rgba(255,255,255,0.7)",
    inset: "inset 0 1px 3px rgba(20,20,20,0.08)",
    blurBg: "rgba(255,255,255,0.92)",
    navBlur: "rgba(255,255,255,0.96)",
    green: { text: "#1C6B45", bg: "#EAF6EF", border: "#CBE9D8", dot: "#2E9463" },
    red: { text: "#AE3A2C", bg: "#FBEDEA", border: "#F0D2CB", dot: "#C24A3A" },
    amber: { text: "#8F620B", bg: "#FBF2DF", border: "#EEDCAF", dot: "#C99418" },
    weak: { text: "#8A5A52", bg: "#F6EEEC", border: "#E5D4CF", dot: "#B47A6E" },
  },
  dark: {
    pageBg: "#08090A",
    bg: "#141517",
    mesh:
      "radial-gradient(circle at 15% 0%, rgba(95,211,148,0.06), transparent 40%), radial-gradient(circle at 90% 20%, rgba(241,137,124,0.05), transparent 35%)",
    surface: "#1B1C1F",
    surfaceAlt: "#212226",
    border: "rgba(255,255,255,0.07)",
    borderStrong: "rgba(255,255,255,0.13)",
    textPrimary: "#F1F1F2",
    textSecondary: "#A2A2A8",
    textMuted: "#6B6B70",
    accent: "#409CFF",
    accentSoft: "rgba(64,156,255,0.14)",
    shadowTight: "0 1px 2px rgba(0,0,0,0.5)",
    shadowWide: "0 10px 28px -8px rgba(0,0,0,0.55)",
    shadowTightHero: "0 2px 6px rgba(0,0,0,0.55)",
    shadowWideHero: "0 20px 46px -12px rgba(0,0,0,0.65)",
    highlightTop: "inset 0 1px 0 rgba(255,255,255,0.05)",
    inset: "inset 0 1px 3px rgba(0,0,0,0.45)",
    blurBg: "rgba(20,21,23,0.78)",
    navBlur: "rgba(20,21,23,0.85)",
    green: { text: "#5FD394", bg: "rgba(52,199,120,0.12)", border: "rgba(52,199,120,0.28)", dot: "#5FD394" },
    red: { text: "#F1897C", bg: "rgba(239,90,72,0.14)", border: "rgba(239,90,72,0.3)", dot: "#F1897C" },
    amber: { text: "#F0C15C", bg: "rgba(240,180,50,0.14)", border: "rgba(240,180,50,0.3)", dot: "#F0C15C" },
    weak: { text: "#D69C90", bg: "rgba(214,124,105,0.13)", border: "rgba(214,124,105,0.28)", dot: "#D69C90" },
  },
};

const FONT_STACK =
  "'SF Pro Display', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

/* ---------------------------------------------------------------------
   DEMO DATA
--------------------------------------------------------------------- */
const VERDICTS = {
  genuine: {
    status: "genuine",
    confidence: 94,
    explanation: "No major suspicious patterns detected.",
    reasons: [
      "Consistent company information",
      "Realistic compensation for role & location",
      "Clear job requirements",
      "Normal application process",
    ],
  },
  fake: {
    status: "fake",
    confidence: 92,
    explanation:
      "This posting contains multiple patterns commonly associated with fraudulent job listings.",
    reasons: [
      "Unrealistic salary for the role",
      "Generic, unverifiable company information",
      "Suspicious contact instructions (personal email/WhatsApp)",
      "No verifiable company registration found",
    ],
  },
  uncertain: {
    status: "uncertain",
    confidence: 61,
    explanation:
      "The available signals aren't strong enough to classify this posting confidently.",
    reasons: [
      "Limited company footprint online",
      "Salary range unusually wide",
      "Job description partially generic",
      "No red flags, but insufficient verification",
    ],
  },
};

const JOB = {
  title: "Software Engineer",
  company: "Example Technologies",
  location: "Gurugram",
  workMode: "Hybrid",
  employmentType: "Full-time",
  experience: "2–4 years",
  salary: "₹8–15 LPA",
  skills: ["C++", "Java", "AWS", "SQL", "Spring Boot", "Kafka"],
  summary:
    "A hybrid Software Engineer role at Example Technologies in Gurugram, best suited for someone with 2–4 years of backend experience. The team works primarily in Java and Spring Boot, with AWS exposure valued. Compensation is competitive for the experience band, and the listing reads as a standard mid-level backend hire.",
};

const DEFAULT_SELECTION =
  "We are looking for a Software Engineer to join our fast-growing team. 2-4 years experience, strong in Java/Spring Boot, AWS exposure preferred. Immediate joiners...";

function isPlaceholderJobValue(value) {
  if (value == null) return true;
  const text = String(value).trim();
  if (!text) return true;
  const normalized = text.toLowerCase().replace(/[\s\-:;,.()\[\]{}'\"]+/g, " ").trim();
  return [
    "not listed",
    "company not identified",
    "location not listed",
    "work mode not listed",
    "employment type not listed",
    "experience not listed",
    "salary not listed",
    "job title not listed",
    "application",
    "job",
    "opening",
    "opportunity",
    "career",
    "unknown",
  ].includes(normalized) || /^download\b/.test(normalized) || /^install\b/.test(normalized) || /^apply\b/.test(normalized);
}

function analyzeDemoText(text) {
  const normalizedText = text.toLowerCase();
  const suspiciousSignals = ["whatsapp", "telegram", "pay fee", "registration fee", "guaranteed income", "crypto", "gift card", "send money"];
  const suspiciousMatches = suspiciousSignals.filter((signal) => normalizedText.includes(signal));

  if (suspiciousMatches.length > 0) {
    return {
      classification: "negative",
      score: Math.min(98, 78 + suspiciousMatches.length * 6),
      groq: { summary: "This posting contains signals commonly associated with fraudulent job listings." },
      reasons: suspiciousMatches.map((signal) => `Suspicious phrase detected: ${signal}`),
      ml: { available: false },
    };
  }

  if (text.trim().length < 60) {
    return {
      classification: "uncertain",
      score: 55,
      groq: { summary: "There is not enough job detail to classify this posting confidently." },
      reasons: ["Limited job description", "Company and compensation details are missing"],
      ml: { available: false },
    };
  }

  return {
    classification: "positive",
    score: 86,
    groq: { summary: "The posting includes normal role details without obvious suspicious signals." },
    reasons: ["Clear role requirements", "Specific job details provided", "No common scam phrases detected"],
    ml: { available: false },
  };
}

function buildDemoJob(text, aiSummary) {
  const normalizedText = text.toLowerCase();
  const applyingTitleMatch = text.match(/applying to\s+(.+?)\s+internship/i);
  const titleMatch = applyingTitleMatch || text.match(/(?:strategic account executive[^\n.]*)/i) || text.match(/(?:account executive[^\n.]*)/i);
  const headingMatch = text.match(/^\s*#{1,6}\s*([^\n]+)/);
  const explicitRoleMatch = text.match(/\b(?:Software Developer|Product Technical Analyst|Software Engineer|Data Analyst|Business Analyst|Product Manager)\b/i) ||
    text.match(/(?:roles?\s+(?:for|as)?\s*)([A-Z][A-Za-z0-9 &./+()-]*?(?:Developer|Engineer|Analyst|Manager|Lead|Architect|Scientist|Consultant))/i);
  const companyMatch = text.match(/(?:for|at|with)\s+([A-Z][A-Za-z0-9&.'()\/ -]*?(?:\s+(?:Group|Labs|Inc|Limited|Private|Pvt|LLP|Corporation|Technologies|Systems|Solutions)))/i)
    || text.match(/corporate_fare\*([^*]+)\*place/i)
    || text.match(/(?:company|organization|organisation|employer)\s*[:\-]?\s*([A-Z][A-Za-z0-9&.'()\/ -]+)/i);
  const locationHeaderMatch = text.match(/place\*([^\n*]+)/i);
  const workdayLocationMatch = text.match(/locations(.+?)(?:time type|posted on)/is);
  const locationMatch = text.match(/\b(Gurgaon|Gurugram|Bengaluru|Bangalore|Mumbai|Delhi|Hyderabad|Pune|Noida|San Jose|Bangkok)(?:,\s*[A-Za-z ]+){0,2}/i);
  const workModeMatch = text.match(/\b(work from home|on-site|hybrid|remote)\b/i);
  const employmentMatch = text.match(/\b(full-time|part-time|contract)\b/i);
  const experienceMatch = text.match(/\b\d+\s*[-–]\s*\d+\+?\s+years?\b/i) || text.match(/\b\d+\+?\s+years?\b/i);
  const durationMatch = text.match(/\b\d+\s*[-–]?\s*months?\b/i);
  const salaryMatch = text.match(/(?:₹|\$)\s?[\d,.]+(?:\s*[-–]\s*(?:₹|\$)?\s?[\d,.]+)?\s*(?:LPA|per year|annually)?/i);
  const skills = ["React", "TypeScript", "JavaScript", "Python", "Java", "AWS", "SQL", "Node.js", "CRM", "ERP", "Enterprise sales", "Account planning", "Financial Services", "Machine Learning", "Computer Vision", "Data Science", "Deep Learning", "Accounting", "Finance", "US GAAP", "SOX", "CPA", "Excel", "NetSuite", "Workiva", "SEC reporting", "Data governance", "Distributed systems", "C++", "Privacy", "Application Security", "Cyber Security", "Vulnerability Management", "OWASP", "Penetration Testing", "Code Reviews", "Risk Analysis", "APIs", "Cloud"];
  const detectedSkills = skills.filter((skill) => normalizedText.includes(skill.toLowerCase()));
  const fallbackTitle = (applyingTitleMatch?.[1] || headingMatch?.[1] || titleMatch?.[0] || text.trim().split(/[!?\n]/)[0]).replace(/^#+\s*/, "").trim();
  return {
    title: explicitRoleMatch?.[0]?.trim() || (fallbackTitle && !/^download\b/i.test(fallbackTitle) ? fallbackTitle : "Job title not listed").slice(0, 70),
    company: (companyMatch?.[1] || companyMatch?.[0] || "").trim() || "Company not identified",
    location: locationHeaderMatch?.[1]?.trim() || (workdayLocationMatch ? "United States" : locationMatch?.[0]) || "Location not listed",
    workMode: workModeMatch ? (workModeMatch[1].toLowerCase() === "work from home" ? "Work from home" : workModeMatch[1]) : "Work mode not listed",
    employmentType: employmentMatch?.[1] || "Employment type not listed",
    experience: experienceMatch?.[0] || "Experience not listed",
    duration: durationMatch?.[0] || "Duration not listed",
    salary: salaryMatch?.[0]?.replace(/[.,;:]+$/, "") || "Salary not listed",
    skills: detectedSkills,
    summary: aiSummary || text.trim() || "No job text entered.",
  };
}

const MATCH_TIERS = {
  strong: {
    score: 87,
    tier: "strong",
    label: "Strong Match",
    summary: "Your experience and skills align well with this role.",
    skillsMatched: ["Java", "Spring Boot", "SQL", "AWS"],
    skillsMissing: ["Kafka"],
    experienceFit: "Strong",
    locationFit: "Same city",
  },
  partial: {
    score: 64,
    tier: "partial",
    label: "Partial Match",
    summary: "You meet the core requirements, with a few gaps worth noting.",
    skillsMatched: ["Java", "SQL"],
    skillsMissing: ["Spring Boot", "AWS", "Kafka"],
    experienceFit: "Moderate",
    locationFit: "Different city",
  },
  weak: {
    score: 34,
    tier: "weak",
    label: "Weak Match",
    summary: "This role needs skills and experience your resume doesn't show yet.",
    skillsMatched: ["SQL"],
    skillsMissing: ["Java", "Spring Boot", "AWS", "Kafka", "C++"],
    experienceFit: "Weak",
    locationFit: "Different city",
  },
};

/* ---------------------------------------------------------------------
   SMALL BUILDING BLOCKS
--------------------------------------------------------------------- */
function Badge({ t, tone, icon, size = 44 }) {
  const palette = t[tone];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: palette.text,
        boxShadow: `${t.shadowTightHero}, ${t.highlightTop}`,
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
  );
}

function Pill({ t, children, tone }) {
  const styles = tone
    ? { background: t[tone].bg, borderColor: t[tone].border, color: t[tone].text }
    : { background: "transparent", borderColor: t.border, color: t.textSecondary };
  return (
    <span
      style={{
        fontSize: 12,
        padding: "4px 10px",
        borderRadius: 999,
        border: `1px solid ${styles.borderColor}`,
        background: styles.background,
        color: styles.color,
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function formatSkillLabel(skill) {
  const value = String(skill ?? "").trim();
  if (!value) return "";
  if (/[A-Z]/.test(value) || /\d/.test(value) || value.includes(".") || value.includes("/") || value.includes("-") || value.includes("_") || value.includes(" ")) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function SectionLabel({ t, children }) {
  return (
    <div
      style={{
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: "0.06em",
        color: t.textMuted,
        textTransform: "uppercase",
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

/* iOS-style toggle switch */
/* app-icon style mark — rounded-square glyph, like an iOS app icon */
function AppIconMark({ t, size = 30 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: "linear-gradient(155deg, #2E9463 0%, #1C6B45 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#EAF6EF",
        boxShadow: `${t.shadowTightHero}, inset 0 1px 0 rgba(255,255,255,0.25)`,
        flexShrink: 0,
      }}
    >
      <ScanEye size={size * 0.56} strokeWidth={2.1} />
    </div>
  );
}

/* ---------------------------------------------------------------------
   TRUST VERDICT (hero #1)
--------------------------------------------------------------------- */
function TrustVerdict({ t, verdict }) {
  const toneMap = { genuine: "green", fake: "red", uncertain: "amber" };
  const tone = toneMap[verdict.status];
  const palette = t[tone];
  const icons = {
    genuine: <CheckCircle2 size={22} />,
    fake: <AlertTriangle size={20} />,
    uncertain: <HelpCircle size={20} />,
  };
  const labels = { genuine: "Likely Genuine", fake: "Likely Fake", uncertain: "Uncertain" };
  const heroShadow =
    verdict.status === "fake"
      ? `${t.shadowTightHero}, 0 22px 48px -10px ${
          t.bg === THEMES.dark.bg ? "rgba(0,0,0,0.65)" : "rgba(178,59,46,0.16)"
        }`
      : `${t.shadowTightHero}, ${t.shadowWideHero}`;

  return (
    <div
      style={{
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: 18,
        padding: "16px 16px 14px",
        boxShadow: heroShadow,
        transition: "all 320ms cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Badge t={t} tone={tone} icon={icons[verdict.status]} size={40} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: t.textPrimary, lineHeight: 1.2, letterSpacing: "-0.01em" }}>
            {labels[verdict.status]}
          </div>
          <div style={{ fontSize: 12.5, color: t.textSecondary, marginTop: 1, fontVariantNumeric: "tabular-nums" }}>
            {verdict.confidence}%
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   JOB SUMMARY — plain-English "what is this job" + quick-fact glance row
--------------------------------------------------------------------- */
function JobSummary({ t, job }) {
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const hasLongSummary = job.summary.length > 280;
  const facts = [job.workMode, job.location, job.salary]
    .filter((label) => label && !label.toLowerCase().includes("not listed"))
    .map((label) => ({ label }));
  return (
    <div>
      <SectionLabel t={t}>What this job is</SectionLabel>
      <p
        style={{
          fontSize: 14,
          lineHeight: 1.6,
          color: t.textPrimary,
          margin: 0,
          fontWeight: 400,
          display: "-webkit-box",
          WebkitLineClamp: summaryExpanded ? "unset" : 5,
          WebkitBoxOrient: "vertical",
          overflow: summaryExpanded ? "visible" : "hidden",
        }}
      >
        {job.summary}
      </p>
      {hasLongSummary && (
        <button
          onClick={() => setSummaryExpanded((expanded) => !expanded)}
          style={{
            marginTop: 6,
            padding: 0,
            border: "none",
            background: "none",
            color: t.accent,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {summaryExpanded ? "Hide summary" : "View full summary"}
        </button>
      )}
      {/* <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
        {facts.map((f) => (
          <span
            key={f.label}
            style={{
              fontSize: 11.5,
              fontWeight: 500,
              color: t.textSecondary,
              background: t.surfaceAlt,
              border: `1px solid ${t.border}`,
              borderRadius: 999,
              padding: "3px 9px",
            }}
          >
            {f.label}
          </span>
        ))}
      </div> */}
    </div>
  );
}

function SkillsSection({ t, skills }) {
  const visibleSkills = [...new Set((skills || []).map((skill) => formatSkillLabel(skill)).filter(Boolean))];
  if (!visibleSkills.length) return null;

  return (
    <div>
      <SectionLabel t={t}>Skills</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {visibleSkills.map((skill) => (
          <Pill key={skill} t={t} tone="green">{skill}</Pill>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   MATCH RING (svg)
--------------------------------------------------------------------- */
function MatchRing({ t, score, tone, size = 68 }) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const palette = t[tone];
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={t.border} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={palette.dot}
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 500ms ease" }}
      />
    </svg>
  );
}

/* ---------------------------------------------------------------------
   MATCH SECTION
--------------------------------------------------------------------- */
function MatchSection({ t, resumeState, matchTier, setMatchTier, onUploadClick, matchResult }) {
  const [showSkills, setShowSkills] = useState(false);

  if (resumeState !== "matched") {
    return (
      <button
        onClick={onUploadClick}
        className="btn-press"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          background: t.surfaceAlt,
          border: `1px solid ${t.border}`,
          borderRadius: 14,
          padding: "11px 14px",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: t.textSecondary }}>
          <UploadCloud size={14} style={{ color: t.textMuted }} />
          {resumeState === "uploading" ? "Uploading resume…" : "Upload your resume to see your match score"}
        </span>
        <ChevronRight size={14} style={{ color: t.textMuted, flexShrink: 0 }} />
      </button>
    );
  }

  if (!matchResult) {
    return (
      <div style={{ background: t.surfaceAlt, border: `1px solid ${t.border}`, borderRadius: 14, padding: 14, color: t.textSecondary, fontSize: 12.5 }}>
        Reading your resume to calculate the match score...
      </div>
    );
  }

  const demoMatch = matchResult
      ? {
          score: matchResult.score,
          skillsMatched: matchResult.matched_keywords || [],
          skillsMissing: matchResult.missing_keywords || [],
          tier: matchResult.score >= 70 ? "strong" : matchResult.score >= 40 ? "partial" : "weak",
          experienceFit: (matchResult.matched_keywords?.length || 0) + (matchResult.missing_keywords?.length || 0) >= 3 ? (matchResult.score >= 70 ? "Strong" : matchResult.score >= 40 ? "Moderate" : "Limited") : "Not evaluated",
          locationFit: (matchResult.matched_keywords?.length || 0) + (matchResult.missing_keywords?.length || 0) >= 3 ? (matchResult.score >= 60 ? "Likely compatible" : matchResult.score >= 30 ? "Needs review" : "Low signal") : "Not evaluated",
          summary: matchResult.missing_keywords?.length
            ? `Your resume matches ${matchResult.matched_count} job keywords. Review the missing keywords below.`
            : "Your resume covers the detected job keywords.",
        }
      : MATCH_TIERS[matchTier];
    const m = demoMatch;
  const toneMap = { strong: "green", partial: "amber", weak: "weak" };
  const tone = toneMap[m.tier];
  const palette = t[tone];

  return (
    <div
      style={{
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: 18,
        padding: 16,
        boxShadow: `${t.shadowTightHero}, ${t.shadowWideHero}`,
        transition: "all 320ms cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ position: "relative", width: 68, height: 68, flexShrink: 0 }}>
          <MatchRing t={t} score={m.score} tone={tone} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 700,
              color: t.textPrimary,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {m.score}%
          </div>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", color: t.textMuted, textTransform: "uppercase" }}>
            Match score
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: palette.text, marginTop: 2, letterSpacing: "-0.01em" }}>{m.label}</div>
        </div>
      </div>

      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 7 }}>
        {[
          // ["Experience fit", m.experienceFit],
          // ["Location fit", m.locationFit],
        ].map(([label, value]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
            <span style={{ color: t.textSecondary }}>{label}</span>
            <span style={{ color: t.textPrimary, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{value}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowSkills((s) => !s)}
        className="btn-press"
        style={{
          marginTop: 12,
          fontSize: 12,
          fontWeight: 600,
          color: palette.text,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {showSkills ? "Hide" : "View"} matched / missing skills
        <ChevronDown size={13} style={{ transform: showSkills ? "rotate(180deg)" : "none", transition: "transform 200ms ease" }} />
      </button>

      {showSkills && (
        <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {m.skillsMatched.map((s) => (
            <Pill key={s} t={t} tone="green">✓ {s}</Pill>
          ))}
          {m.skillsMissing.map((s) => (
            <span
              key={s}
              style={{
                fontSize: 12,
                padding: "4px 10px",
                borderRadius: 999,
                border: `1px dashed ${t.borderStrong}`,
                color: t.textMuted,
                fontWeight: 500,
              }}
            >
              {s}
            </span>
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: `1px solid ${palette.border}`,
          display: "flex",
          justifyContent: "flex-end",
          gap: 4,
        }}
      >
        {!matchResult && Object.keys(MATCH_TIERS).map((k) => (
          <button
            key={k}
            onClick={() => setMatchTier(k)}
            title={`Demo: show ${k} match`}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              border: "none",
              cursor: "pointer",
              background: matchTier === k ? palette.text : t.borderStrong,
              opacity: matchTier === k ? 1 : 0.6,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   JOB OVERVIEW / SKILLS / WHY THIS VERDICT / SELECTED TEXT
--------------------------------------------------------------------- */
function JobOverview({ t, job }) {
  const isPlaceholder = (value) => !value || value.toLowerCase().includes("not listed") || value.toLowerCase().includes("not identified");
  const locationFacts = [job.location, job.workMode, job.employmentType]
    .filter((value) => value && !isPlaceholder(value));
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: 16, boxShadow: t.shadowTight }}>
      <SectionLabel t={t}>Job overview</SectionLabel>
      {!isPlaceholder(job.title) && (
        <div style={{ fontSize: 19, fontWeight: 700, color: t.textPrimary, lineHeight: 1.25, letterSpacing: "-0.01em" }}>{job.title}</div>
      )}
      {!isPlaceholder(job.company) && (
        <div style={{ fontSize: 13.5, color: t.textSecondary, marginTop: 2 }}>{job.company}</div>
      )}
      {locationFacts.length > 0 && (
        <div style={{ fontSize: 12, color: t.textMuted, marginTop: 6 }}>
          {locationFacts.join(" · ")}
        </div>
      )}

      {(() => {
        const durationVal = !isPlaceholder(job.duration) ? job.duration : (!isPlaceholder(job.experience) ? job.experience : null);
        const durationLabel = !isPlaceholder(job.duration) ? "Duration" : "Experience";
        const salaryVal = !isPlaceholder(job.salary) ? job.salary : null;
        if (!durationVal && !salaryVal) return null;
        return (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginTop: 14,
              paddingTop: 14,
              borderTop: `1px solid ${t.border}`,
            }}
          >
            {durationVal && (
              <div>
                <div style={{ fontSize: 10.5, color: t.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {durationLabel}
                </div>
                <div style={{ fontSize: 13.5, color: t.textPrimary, fontWeight: 600, marginTop: 3 }}>
                  {durationVal}
                </div>
              </div>
            )}
            {salaryVal && (
              <div>
                <div style={{ fontSize: 10.5, color: t.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Salary
                </div>
                <div style={{ fontSize: 13.5, color: t.textPrimary, fontWeight: 600, marginTop: 3, fontVariantNumeric: "tabular-nums" }}>{salaryVal}</div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

function WhyThisVerdict({ t, verdict }) {
  const isFake = verdict.status === "fake";
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: 16, boxShadow: t.shadowTight }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: t.textPrimary, marginBottom: 10, letterSpacing: "-0.005em" }}>
        {isFake ? "Why suspicious?" : verdict.status === "uncertain" ? "Why uncertain?" : "Why it looks genuine"}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {verdict.reasons.map((r) => (
          <div key={r} style={{ display: "flex", gap: 8, fontSize: 12.5, color: t.textSecondary, lineHeight: 1.4 }}>
            <span style={{ color: t.textMuted, flexShrink: 0 }}>•</span>
            <span>{r}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SelectedTextBlock({ t, text, onTextChange, onAnalyze, autoAnalyze }) {
  return (
    <div>
      <SectionLabel t={t}>Selected text</SectionLabel>
      <textarea
        value={text}
        onChange={(event) => onTextChange(event.target.value)}
        aria-label="Selected job text"
        style={{
          width: "100%",
          minHeight: 112,
          resize: "vertical",
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: 14,
          padding: 12,
          boxShadow: t.shadowTight,
          fontSize: 12.5,
          color: t.textSecondary,
          lineHeight: 1.5,
          fontFamily: "inherit",
        }}
      />
      {!autoAnalyze && (
        <button
          onClick={() => onAnalyze(text)}
          disabled={!text.trim()}
          className="btn-press"
          style={{
            marginTop: 10,
            width: "100%",
            fontSize: 13,
            fontWeight: 600,
            padding: "10px 12px",
            borderRadius: 12,
            border: "none",
            background: t.textPrimary,
            color: t.bg,
            cursor: text.trim() ? "pointer" : "not-allowed",
            opacity: text.trim() ? 1 : 0.5,
            boxShadow: t.shadowTight,
          }}
        >
          Analyze job →
        </button>
      )}
    </div>
  );
}

function EmptyState({ t, onSimulate }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "36px 24px",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 13,
          background: t.surface,
          border: `1px solid ${t.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: t.textMuted,
          boxShadow: `${t.shadowTight}, ${t.highlightTop}`,
        }}
      >
        <Highlighter size={18} />
      </div>
      <div style={{ fontSize: 14.5, fontWeight: 700, color: t.textPrimary, letterSpacing: "-0.01em" }}>Select a job description</div>
      <div style={{ fontSize: 12.5, color: t.textSecondary, maxWidth: 220, lineHeight: 1.5 }}>
        Highlight text on any website to analyze it with JobLens.
      </div>
      <button
        onClick={onSimulate}
        className="btn-press"
        style={{
          marginTop: 6,
          fontSize: 12,
          fontWeight: 600,
          color: t.textSecondary,
          background: "none",
          border: `1px solid ${t.border}`,
          padding: "7px 12px",
          borderRadius: 9,
          cursor: "pointer",
        }}
      >
        Enter job text
      </button>
    </div>
  );
}

function LoadingState({ t, stage }) {
  const stages = ["Reading selected text", "Extracting job details", "Checking trust signals"];
  return (
    <div style={{ padding: "8px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Loader2 size={15} className="animate-spin" style={{ color: t.textSecondary }} />
        <span style={{ fontSize: 13.5, fontWeight: 600, color: t.textPrimary }}>Analyzing job…</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {stages.map((s, i) => (
          <div
            key={s}
            style={{
              fontSize: 12,
              color: i <= stage ? t.textPrimary : t.textMuted,
              opacity: i <= stage ? 1 : 0.5,
              transition: "opacity 300ms ease, color 300ms ease",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: i <= stage ? t.textPrimary : t.textMuted }} />
            {s}
          </div>
        ))}
      </div>
      {[64, 44, 88, 52].map((w, i) => (
        <div
          key={i}
          style={{
            height: i === 0 ? 46 : 14,
            width: i === 0 ? "100%" : `${w}%`,
            borderRadius: 9,
            marginBottom: 10,
            background: t.surface,
            border: `1px solid ${t.border}`,
            boxShadow: t.shadowTight,
            backgroundImage: `linear-gradient(90deg, transparent, ${
              t.bg === THEMES.dark.bg ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"
            }, transparent)`,
            backgroundSize: "200% 100%",
            animation: "shimmer 1.4s infinite",
          }}
        />
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------
   SETTINGS SHEET
--------------------------------------------------------------------- */
/* ---------------------------------------------------------------------
   TOP BAR
--------------------------------------------------------------------- */
function SettingsSheet({
  t,
  user,
  resumeFileName,
  onClose,
  onLogin,
  onUploadClick,
  onLogout,
  error,
}) {
  const rechargeUrl = `${window.location.origin}/recharge/index.html`;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 3,
        background: t.bg,
        padding: 16,
        overflowY: "auto",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: t.textPrimary,
          }}
        >
          Settings
        </div>

        <button
          onClick={onClose}
          style={{
            border: 0,
            background: "none",
            color: t.textMuted,
            cursor: "pointer",
          }}
        >
          <X size={20} />
        </button>
      </div>

      {!user ? (
        /* ================= LOGGED OUT ================= */
        <button
          onClick={onLogin}
          className="btn-press"
          style={{
            width: "100%",
            border: `1px solid ${t.border}`,
            background: t.surface,
            padding: 14,
            borderRadius: 12,
            cursor: "pointer",
            color: t.textPrimary,
            fontWeight: 650,
            display: "flex",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <LogIn size={17} />
          Continue with Google
        </button>
      ) : (
        /* ================= LOGGED IN ================= */
        <>
          {/* ACCOUNT */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 14,
              border: `1px solid ${t.border}`,
              borderRadius: 14,
              background: t.surfaceAlt,
              marginBottom: 14,
            }}
          >
            {/* Render an img with a fallback to initials avatar on error */}
            <img
              src={
                user.picture ||
                `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                  user.name || "User"
                )}`
              }
              alt={user.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                  user.name || "User"
                )}`;
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                objectFit: "cover",
                border: `1px solid ${t.border}`,
              }}
            />

            <div>
              <div
                style={{
                  fontWeight: 700,
                  color: t.textPrimary,
                }}
              >
                {user.name}
              </div>

              <div
                style={{
                  color: t.textSecondary,
                  fontSize: 12,
                  marginTop: 3,
                }}
              >
                {user.email}
              </div>
            </div>
          </div>

          {/* RESUME */}
          <button
            onClick={onUploadClick}
            className="btn-press"
            style={{
              width: "100%",
              border: `1px solid ${t.border}`,
              background: t.surface,
              padding: 13,
              borderRadius: 12,
              cursor: "pointer",
              color: t.textPrimary,
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontWeight: 650,
              }}
            >
              Upload resume
            </div>

            <div
              style={{
                fontSize: 12,
                color: t.textSecondary,
                marginTop: 3,
              }}
            >
              {resumeFileName || "PDF or DOCX — used for match analysis"}
            </div>
          </button>

          {/* RECHARGE */}
          <div
            style={{
              marginTop: 22,
              fontSize: 13,
              fontWeight: 700,
              color: t.textPrimary,
            }}
          >
            Recharge credits
          </div>

          <div
            style={{
              fontSize: 12,
              color: t.textSecondary,
              marginTop: 4,
            }}
          >
            Every analysis uses 1 credit. Recharge on the JobLens recharge page.
          </div>

          <button
            onClick={() =>
              window.open(
                rechargeUrl,
                "_blank",
                "noopener,noreferrer"
              )
            }
            className="btn-press"
            style={{
              width: "100%",
              marginTop: 10,
              padding: 12,
              border: 0,
              borderRadius: 10,
              background: t.accent,
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <ExternalLink size={16} />
            Recharge credits
          </button>

          {/* ERROR */}
          {error && (
            <div
              style={{
                color: t.red.text,
                fontSize: 12,
                marginTop: 10,
              }}
            >
              {error}
            </div>
          )}

          {/* LOGOUT */}
          <button
            onClick={onLogout}
            className="btn-press"
            style={{
              width: "100%",
              height: 38,
              marginTop: 20,
              borderRadius: 10,
              border: "1px solid #F0D2D2",
              background: "#FFF7F7",
              color: "#C62828",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              fontSize: 12,
              fontWeight: 650,
              cursor: "pointer",
            }}
          >
            <LogOut size={14} />
            Log out
          </button>
        </>
      )}
    </div>
  );
}

function TopBar({ t, credits, onSettings }) {
  return (
    <div
      style={{
        padding: "14px 16px 12px",
        flexShrink: 0,
        background: t.navBlur,
        backdropFilter: "blur(14px)",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <AppIconMark t={t} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.textPrimary, letterSpacing: "-0.015em", lineHeight: 1.1 }}>
              JobLens
            </div>
            <div style={{ fontSize: 10.5, color: t.textMuted, marginTop: 1 }}>Job intelligence for any website</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={onSettings}
            title="Credits"
            className="btn-press"
            style={{
              width: 58,
              height: 28,
              borderRadius: 8,
              border: `1px solid ${t.border}`,
              background: t.surface,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: t.textMuted,
              cursor: "pointer",
            }}
          >
           <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "4px 8px",
    borderRadius: 8,
    background: "#F0FDF7",
    border: "1px solid #CDEFE0",
  }}
>
  <Coins
    size={13}
    color="#16804F"
    strokeWidth={2.4}
  />

  <span
    style={{
      fontSize: 11,
      fontWeight: 700,
      color: "#146C43",
    }}
  >
    {credits}
  </span>
</div>
          </button>
          <button
  onClick={onSettings}
  title="Settings"
  className="btn-press"
  style={{
    width: 28,
    height: 28,
    borderRadius: 8,
    border: `1px solid ${t.border}`,
    background: t.surface,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#000",
    cursor: "pointer",
  }}
>
  <Settings size={13} />
</button>
        </div>
      </div>
      <div style={{ height: 1, background: t.border, marginTop: 12 }} />
    </div>
  );
}

/* ---------------------------------------------------------------------
   MAIN APP
--------------------------------------------------------------------- */
export default function JobLensPanel({ onAnalysisComplete }) {
  const [theme, setTheme] = useState("light");
  const t = THEMES[theme];

  const initialSelection = new URLSearchParams(window.location.search).get("selection");
  const [screen, setScreen] = useState(initialSelection ? "selected" : "empty");
  const [selectionText, setSelectionText] = useState(initialSelection || DEFAULT_SELECTION);
  const [loadStage, setLoadStage] = useState(0);
  const [verdictKey, setVerdictKey] = useState("genuine");
  const [resumeState, setResumeState] = useState("empty");
  const [resumeFileName, setResumeFileName] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeId, setResumeId] = useState(null);
  const [resumeHydrated, setResumeHydrated] = useState(false);
  const [matchTier, setMatchTier] = useState("strong");
  const [liveAnalysis, setLiveAnalysis] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("joblens.token"));
  const [user, setUser] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accountError, setAccountError] = useState("");
  const analysisStarted = useRef(false);
  const fileInputRef = useRef(null);
  const chooseFile = () => fileInputRef.current?.click();
const handleLogout = () => {
  localStorage.removeItem("joblens.token");
  setToken(null);
  setUser(null);
  setResumeId(null);
  setResumeFileName(null);
  setResumeFile(null);
  setResumeState("empty");
  setSettingsOpen(false);
  clearResume();
};
  const timers = useRef([]);
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const startAnalysis = async (text = selectionText) => {
    if (!resumeHydrated) {
      console.warn("startAnalysis: resume hydration not complete yet");
      return;
    }
    if (!token) { setSettingsOpen(true); setAccountError("Sign in with Google to analyze jobs."); return; }

    // If we have a token but no user yet (still hydrating), fetch the current user
    if (!user) {
      try {
        const freshUser = await getCurrentUser(token);
        setUser(freshUser);
        if ((freshUser.credits || 0) < 1) {
          setSettingsOpen(true);
          setAccountError("No credits left. Recharge to continue.");
          return;
        }
      } catch (err) {
        setSettingsOpen(true);
        setAccountError("Sign in with Google to analyze jobs.");
        return;
      }
    } else if (user.credits < 1) {
      setSettingsOpen(true);
      setAccountError("No credits left. Recharge to continue.");
      return;
    }
    setScreen("loading");
    setLoadStage(0);
    clearTimers();
    try {
      const result = await analyzeJob(text, resumeId, token);
      setLiveAnalysis({ ...result, demoText: text });
      setUser((current) => current ? { ...current, credits: Math.max(0, current.credits - 1) } : current);
      onAnalysisComplete?.(result);
    } catch (error) {
      setLiveAnalysis({
        classification: "uncertain",
        score: 0,
        groq: { summary: `AI analysis unavailable: ${error.message}` },
        reasons: [error.message],
        ml: { available: false },
        demoText: text,
      });
    }
    timers.current.push(setTimeout(() => setLoadStage(1), 550));
    timers.current.push(setTimeout(() => setLoadStage(2), 1100));
    timers.current.push(setTimeout(() => setScreen("result"), 1700));
  };

  useEffect(() => {
    if (!resumeHydrated || !initialSelection || analysisStarted.current) return;
    analysisStarted.current = true;
    startAnalysis(initialSelection);
  }, [resumeHydrated, initialSelection]);

  const startResumeUpload = async (file) => {
    if (!file) return;
    if (!token) { setSettingsOpen(true); setAccountError("Sign in before uploading a resume."); return; }
    setResumeState("uploading");
    setResumeFileName(file.name);
    try {
      const uploaded = await uploadResume(file, token);
        console.log("startResumeUpload: uploaded resume id", uploaded?.id);
      const resumeRecord = { id: uploaded.id, filename: file.name, uploaded_at: new Date().toISOString() };
      const persisted = await saveResume(resumeRecord);
        if (!persisted) {
          console.warn("startResumeUpload: saveResume returned false");
          setAccountError("Resume uploaded, but browser storage failed. Please retry.");
        } else {
          console.log("startResumeUpload: resume persisted locally", resumeRecord);
        }
      setResumeFile(file);
      setResumeId(uploaded.id);
      setResumeState("matched");
    } catch (error) { setResumeState("empty"); setAccountError(error.message); }
  };

  const removeResume = () => {
    setResumeState("empty");
    setResumeFileName(null);
    setResumeId(null);
    setResumeFile(null);
    clearResume();
  };

  useEffect(() => {
    let cancelled = false;
    const hydrateSavedResume = async () => {
      try {
        const savedResume = await loadResume();
        if (cancelled) return;
        if (savedResume?.id) {
          setResumeId(savedResume.id);
          setResumeFileName(savedResume.filename || "Saved resume");
          setResumeState("matched");
        } else {
          setResumeId(null);
          setResumeFileName(null);
          setResumeState("empty");
        }
      } catch (error) {
        console.warn("Resume hydration failed:", error);
        if (!cancelled) {
          setResumeId(null);
          setResumeFileName(null);
          setResumeState("empty");
        }
      } finally {
        if (!cancelled) setResumeHydrated(true);
      }
    };

    if (token) getCurrentUser(token).then((data) => !cancelled && setUser(data)).catch(() => { localStorage.removeItem("joblens.token"); setToken(null); });
    hydrateSavedResume();
    const onAuth = (event) => {
      if (event.data?.type !== "JOBLENS_AUTH" || !event.data.token) return;
      localStorage.setItem("joblens.token", event.data.token); setToken(event.data.token); setAccountError("");
      getCurrentUser(event.data.token).then(setUser).catch((error) => setAccountError(error.message));
    };
    window.addEventListener("message", onAuth);
    return () => {
      cancelled = true;
      clearTimers();
      window.removeEventListener("message", onAuth);
    };
  }, [token]);

  const verdict = liveAnalysis?.classification
    ? {
        ...VERDICTS[liveAnalysis.classification === "positive" ? "genuine" : liveAnalysis.classification === "negative" ? "fake" : "uncertain"],
        confidence: liveAnalysis.score,
        explanation: liveAnalysis.groq?.summary || VERDICTS[verdictKey].explanation,
        reasons: liveAnalysis.reasons?.length ? liveAnalysis.reasons : VERDICTS[verdictKey].reasons,
      }
    : VERDICTS[verdictKey];
  const aiJob = liveAnalysis?.groq?.job;
  const jobFromApi = aiJob
    ? {
        title: !isPlaceholderJobValue(aiJob.title) ? aiJob.title : "Job title not listed",
        company: !isPlaceholderJobValue(aiJob.company) ? aiJob.company : "Company not identified",
        location: !isPlaceholderJobValue(aiJob.location) ? aiJob.location : "Location not listed",
        workMode: !isPlaceholderJobValue(aiJob.work_mode) ? aiJob.work_mode : "Work mode not listed",
        employmentType: !isPlaceholderJobValue(aiJob.employment_type) ? aiJob.employment_type : "Employment type not listed",
        experience: !isPlaceholderJobValue(aiJob.experience) ? aiJob.experience : "Experience not listed",
        duration: !isPlaceholderJobValue(aiJob.duration) ? aiJob.duration : "Duration not listed",
        salary: !isPlaceholderJobValue(aiJob.salary) ? aiJob.salary : "Salary not listed",
        skills: Array.isArray(aiJob.skills) ? aiJob.skills.filter((skill) => !isPlaceholderJobValue(skill)) : [],
        summary: liveAnalysis.groq?.summary || "No summary available.",
      }
    : null;

  const displayJob = jobFromApi && !isPlaceholderJobValue(jobFromApi.title) && !isPlaceholderJobValue(jobFromApi.company)
    ? jobFromApi
    : liveAnalysis?.demoText
    ? buildDemoJob(liveAnalysis.demoText, liveAnalysis.groq?.summary)
    : JOB;

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: t.pageBg,
        fontFamily: FONT_STACK,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 16px",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .btn-press { transition: transform 120ms ease, opacity 120ms ease; }
        .btn-press:active { transform: scale(0.96); opacity: 0.85; }
        * { box-sizing: border-box; }
      `}</style>

      <div
        style={{
          position: "relative",
          width: 360,
          maxWidth: "100%",
          height: "min(700px, calc(100vh - 96px))",
          background: t.bg,
          backgroundImage: t.mesh,
          border: `1px solid ${t.border}`,
          borderRadius: 22,
          boxShadow: `${t.shadowWide}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) startResumeUpload(file);
            event.target.value = "";
          }}
          style={{ display: "none" }}
        />

        <TopBar
          t={t}
          credits={user?.credits ?? 0}
          onSettings={() => setSettingsOpen(true)}
        />

        {settingsOpen && <SettingsSheet
  t={t}
  user={user}
  resumeFileName={resumeFileName}
  onClose={() => {
    setSettingsOpen(false);
    setAccountError("");
  }}
  onLogin={openGoogleLogin}
  onUploadClick={chooseFile}
  onLogout={handleLogout}
  error={accountError}
/>}

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0 16px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            maskImage: "linear-gradient(to bottom, black calc(100% - 16px), transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black calc(100% - 16px), transparent 100%)",
          }}
        >
          {screen === "empty" && <EmptyState t={t} onSimulate={() => setScreen("selected")} />}

          {screen === "selected" && (
            <SelectedTextBlock
              t={t}
              text={selectionText}
              onTextChange={setSelectionText}
              onAnalyze={startAnalysis}
              autoAnalyze={Boolean(initialSelection)}
            />
          )}

          {screen === "loading" && <LoadingState t={t} stage={loadStage} />}

          {screen === "result" && (
            <>
              <TrustVerdict t={t} verdict={verdict} />
              <JobOverview t={t} job={displayJob} />
              <JobSummary t={t} job={displayJob} />
              {/* <SkillsSection t={t} skills={displayJob.skills} /> */}
              <MatchSection
                t={t}
                resumeState={resumeState}
                matchTier={matchTier}
                setMatchTier={setMatchTier}
                onUploadClick={chooseFile}
                matchResult={liveAnalysis?.resume_match}
              />
              <WhyThisVerdict t={t} verdict={verdict} />

            </>
          )}
        </div>
      </div>
    </div>
  );
}
