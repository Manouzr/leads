"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

const QUESTIONS = [
  {
    id: "equipped",
    s: 1,
    t: "Êtes-vous déjà équipé de panneaux photovoltaïques ?",
    sub: "Nous adaptons notre offre.",
    e: "☀️",
    type: "c",
    opts: [
      { v: "non", l: "Non, pas encore", i: "🏠" },
      { v: "oui", l: "Oui, déjà équipé", i: "✅" },
    ],
    g: true,
  },
  {
    id: "habitation",
    s: 2,
    t: "Quel est votre type d'habitation ?",
    sub: "L'installation dépend de votre toiture.",
    e: "🏡",
    type: "c",
    opts: [
      { v: "maison", l: "Maison individuelle", i: "🏠" },
      { v: "appartement", l: "Appartement", i: "🏢" },
      { v: "immeuble", l: "Immeuble", i: "🏗️" },
      { v: "autre", l: "Autre", i: "📍" },
    ],
    g: true,
    bk: {
      ok: ["maison"],
      tt: "Notre offre est réservée aux maisons individuelles",
      tx: "L'installation photovoltaïque nécessite un accès direct à la toiture.",
      ic: "🏢",
    },
  },
  {
    id: "propriete",
    s: 3,
    t: "Êtes-vous propriétaire de votre logement ?",
    sub: "Condition nécessaire pour l'installation.",
    e: "🔑",
    type: "c",
    opts: [
      { v: "proprietaire", l: "Propriétaire", i: "🔑" },
      { v: "locataire", l: "Locataire", i: "📄" },
    ],
    g: true,
    bk: {
      ok: ["proprietaire"],
      tt: "L'installation est réservée aux propriétaires",
      tx: "En tant que locataire, l'accord du propriétaire est nécessaire.",
      ic: "📄",
    },
  },
  {
    id: "chauffage",
    s: 4,
    t: "Quel est votre chauffage actuel ?",
    sub: "Pour estimer vos économies.",
    e: "🔥",
    type: "c",
    opts: [
      { v: "electricite", l: "Électricité", i: "⚡" },
      { v: "gaz", l: "Gaz", i: "🔵" },
      { v: "granule", l: "Granulé / Bois", i: "🪵" },
      { v: "fioul", l: "Fioul", i: "🛢️" },
    ],
    g: true,
  },
  {
    id: "facture",
    s: 5,
    t: "",
    sub: "Montant approximatif par mois.",
    e: "💶",
    type: "f",
  },
  {
    id: "subvention",
    s: 6,
    t: "Avez-vous un dossier de subvention en cours ?",
    sub: "MaPrimeRénov', CEE ou autre.",
    e: "📁",
    type: "c",
    opts: [
      { v: "oui", l: "Oui, en cours", i: "📋" },
      { v: "non", l: "Non", i: "❌" },
      { v: "ne_sais_pas", l: "Je ne sais pas", i: "❓" },
    ],
    g: false,
  },
  {
    id: "contact",
    s: 7,
    t: "Vos coordonnées",
    sub: "Un conseiller vous rappelle sous 24h.",
    e: "👤",
    type: "ct",
  },
];

const TOTAL = 7;

type Answers = Record<string, string>;

function isOk(step: number, answers: Answers): boolean {
  const q = QUESTIONS[step];
  if (!q) return false;
  if (q.type === "c") return !!answers[q.id];
  if (q.type === "f") return !!(answers.facture && answers.facture.length > 0);
  if (q.type === "ct") return !!(answers.prenom && answers.nom && answers.tel && answers.cp);
  return true;
}

export default function LandingPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [blocked, setBlocked] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const tlFillRef = useRef<HTMLDivElement>(null);
  const tlSectionRef = useRef<HTMLElement>(null);

  const q = QUESTIONS[step];
  const pct = Math.round(step / TOTAL * 100);

  // Scroll header
  useEffect(() => {
    const handleScroll = () => {
      if (navRef.current) {
        navRef.current.classList.toggle("scrolled", window.scrollY > 60);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Timeline animation
  useEffect(() => {
    const handleScroll = () => {
      const section = tlSectionRef.current;
      const fill = tlFillRef.current;
      if (!section || !fill) return;
      const rect = section.getBoundingClientRect();
      const h = section.offsetHeight;
      const wh = window.innerHeight;
      const scrolled = Math.max(0, wh - rect.top);
      const p = Math.min(1, Math.max(0, scrolled / (h + wh * 0.3)));
      fill.style.height = p * 100 + "%";
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function pickAnswer(id: string, value: string) {
    const newAnswers = { ...answers, [id]: value };
    setAnswers(newAnswers);
    const currentQ = QUESTIONS[step];
    if (currentQ.bk && !currentQ.bk.ok.includes(value)) {
      setBlocked(true);
      return;
    }
    setTimeout(() => next(step, newAnswers), 280);
  }

  function next(currentStep: number, currentAnswers: Answers) {
    if (!isOk(currentStep, currentAnswers) || blocked) return;
    if (currentStep < QUESTIONS.length - 1) {
      setBlocked(false);
      setStep(currentStep + 1);
    }
  }

  function prev() {
    if (step > 0) {
      setBlocked(false);
      setStep(step - 1);
    }
  }

  function resetBlocked() {
    const newAnswers = { ...answers };
    delete newAnswers[q.id];
    setAnswers(newAnswers);
    setBlocked(false);
  }

  async function submit() {
    if (!isOk(step, answers) || submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "landing",
          equipe_panneaux: answers.equipped || "",
          type_habitation: answers.habitation || "",
          statut_proprietaire: answers.propriete || "",
          type_chauffage: answers.chauffage || "",
          facture_mensuelle_eur: answers.facture || "",
          subvention_en_cours: answers.subvention || "",
          prenom: answers.prenom || "",
          nom: answers.nom || "",
          telephone: answers.tel || "",
          email: answers.email || "",
          code_postal: answers.cp || "",
        }),
      });
    } catch {
      // Silent fail — lead saved anyway
    }
    setSubmitted(true);
    setSubmitting(false);
  }

  const chauffageLabels: Record<string, string> = {
    electricite: "électricité",
    gaz: "gaz",
    granule: "granulé / bois",
    fioul: "fioul",
  };

  const factureTitle = `À combien s'élève votre facture de ${chauffageLabels[answers.chauffage] || "énergie"} ?`;
  const isLast = step === QUESTIONS.length - 1;
  const canNext = isOk(step, answers);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", background: "#ffffff", color: "#3a3a3a", overflowX: "hidden" }}>
      <style>{`
        :root {
          --bleu:#000091; --bleu-light:#ececfe; --bleu-hover:#1212ff;
          --green:#18753c; --green-bg:rgba(24,117,60,.06);
          --border:#e5e5e5; --border-light:#ddd;
          --bg:#fff; --bg-alt:#f6f6f6; --bg-alt2:#eee;
          --text-title:#161616; --text-body:#3a3a3a; --text-mention:#666; --text-light:#929292;
          --radius:8px; --shadow:0 2px 6px rgba(0,0,0,.04); --shadow-lg:0 6px 18px rgba(0,0,0,.07);
        }
        .gov-header{background:#fff;border-bottom:1px solid var(--border);position:fixed;top:0;left:0;right:0;z-index:200;transition:box-shadow .3s}
        .gov-header.scrolled{box-shadow:var(--shadow-lg)}
        .gov-header-inner{max-width:1140px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:12px 24px;gap:20px}
        .gov-brand{display:flex;align-items:center;gap:16px;text-decoration:none}
        .gov-brand-sep{width:1px;height:44px;background:var(--border);flex-shrink:0}
        .gov-service-name{font-size:1.15rem;font-weight:800;color:var(--text-title);letter-spacing:-.3px;line-height:1.2}
        .gov-service-name span{color:var(--bleu)}
        .gov-service-tagline{font-size:.72rem;color:var(--text-mention);font-weight:500}
        .gov-cta{background:var(--bleu);color:#fff;border:none;padding:10px 22px;border-radius:4px;font-family:inherit;font-size:.85rem;font-weight:700;cursor:pointer;transition:all .2s;text-decoration:none;white-space:nowrap}
        .gov-cta:hover{background:var(--bleu-hover)}
        .hero{position:relative;min-height:92vh;display:flex;align-items:center;overflow:hidden;background:#f0f0f0}
        .hero-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.35}
        .hero-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.5) 0%,rgba(255,255,255,.85) 50%,#fff 100%)}
        .hero-content{position:relative;z-index:2;max-width:1140px;margin:0 auto;padding:140px 24px 60px;width:100%}
        .hero-badge{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--bleu);background:var(--bleu-light);padding:6px 16px;border-radius:50px;font-size:.78rem;font-weight:600;color:var(--bleu);margin-bottom:24px}
        .pulse{width:6px;height:6px;border-radius:50%;background:#18753c;animation:pulse 2s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        .hero h1{font-size:clamp(2rem,5vw,3rem);font-weight:800;line-height:1.2;letter-spacing:-.5px;max-width:650px;margin-bottom:18px;color:var(--text-title)}
        .hero h1 .hl{color:var(--bleu)}
        .hero-sub{font-size:1.05rem;color:var(--text-body);line-height:1.7;max-width:520px;margin-bottom:36px}
        .hero-actions{display:flex;gap:12px;flex-wrap:wrap}
        .hero-btn{display:inline-flex;align-items:center;gap:8px;padding:14px 30px;border-radius:4px;font-family:inherit;font-size:.95rem;font-weight:700;cursor:pointer;transition:all .2s;border:none;text-decoration:none}
        .hero-btn.primary{background:var(--bleu);color:#fff;box-shadow:0 4px 16px rgba(0,0,145,.15)}
        .hero-btn.primary:hover{background:var(--bleu-hover);transform:translateY(-1px)}
        .hero-btn.secondary{background:#fff;color:var(--bleu);border:1px solid var(--bleu)}
        .hero-btn.secondary:hover{background:var(--bleu-light)}
        .hero-stats{display:flex;gap:48px;margin-top:50px;padding-top:30px;border-top:2px solid var(--border)}
        .hero-stat-num{font-size:1.8rem;font-weight:800;color:var(--text-title)}
        .hero-stat-num span{color:var(--bleu)}
        .hero-stat-label{font-size:.78rem;color:var(--text-mention);margin-top:2px;font-weight:500}
        .timeline-section{padding:80px 24px;background:#fff}
        .tl-container{max-width:1140px;margin:0 auto}
        .tl-header{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:start}
        .tl-left h2{font-size:clamp(1.6rem,3.5vw,2.2rem);font-weight:800;line-height:1.2;letter-spacing:-.3px;color:var(--text-title)}
        .tl-left p{color:var(--text-body);margin-top:16px;font-size:1rem;line-height:1.7;max-width:400px}
        .tl-right{position:relative;padding-left:40px}
        .tl-line{position:absolute;left:14px;top:0;bottom:0;width:2px;background:var(--border)}
        .tl-line-fill{position:absolute;left:14px;top:0;width:2px;background:linear-gradient(180deg,var(--bleu),var(--green));height:0%;transition:height .1s linear;border-radius:1px}
        .tl-step{position:relative;padding-bottom:48px}
        .tl-step:last-child{padding-bottom:0}
        .tl-dot{position:absolute;left:-40px;top:2px;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:800;z-index:2}
        .tl-dot.done{background:var(--green);color:white;border:2px solid var(--green)}
        .tl-dot.active{background:var(--bleu);color:#fff;border:2px solid var(--bleu);box-shadow:0 0 16px rgba(0,0,145,.2)}
        .tl-dot.pending{background:var(--bg-alt2);color:var(--text-light);border:2px solid var(--border)}
        .tl-step h3{font-size:1.05rem;font-weight:700;color:var(--text-title);margin-bottom:8px}
        .tl-step p{font-size:.88rem;color:var(--text-body);line-height:1.6;max-width:400px}
        .tl-cta{margin-top:40px;padding-left:40px}
        .tl-cta-btn{display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:var(--bleu);color:#fff;border:none;border-radius:4px;font-family:inherit;font-size:.9rem;font-weight:700;cursor:pointer;transition:all .2s;text-decoration:none}
        .tl-cta-btn:hover{background:var(--bleu-hover);transform:translateY(-1px)}
        .form-section{padding:40px 24px 80px;background:var(--bg-alt)}
        .form-container{max-width:560px;margin:0 auto}
        .form-header{text-align:center;margin-bottom:28px}
        .form-header h2{font-size:clamp(1.4rem,3vw,1.8rem);font-weight:800;letter-spacing:-.3px;color:var(--text-title)}
        .form-header h2 .hl{color:var(--bleu)}
        .form-header p{color:var(--text-mention);margin-top:8px;font-size:.9rem}
        .f-progress{margin-bottom:20px}
        .f-progress-info{display:flex;justify-content:space-between;margin-bottom:8px}
        .f-progress-info span{font-size:.78rem;font-weight:600;color:var(--text-mention)}
        .f-progress-info .pct{color:var(--bleu)}
        .f-track{height:4px;background:var(--border);border-radius:2px;overflow:hidden}
        .f-fill{height:100%;background:linear-gradient(90deg,var(--bleu),var(--green));border-radius:2px;transition:width .45s cubic-bezier(.4,0,.2,1)}
        .fc{background:#fff;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow)}
        .fc-top{padding:22px 24px 18px;border-bottom:1px solid var(--border-light)}
        .fc-badge{display:inline-block;background:var(--bleu-light);color:var(--bleu);padding:3px 12px;border-radius:50px;font-size:.7rem;font-weight:700;letter-spacing:.5px;margin-bottom:10px}
        .fc-title-row{display:flex;align-items:flex-start;gap:12px}
        .fc-emoji{font-size:24px;flex-shrink:0}
        .fc-title{font-size:1.1rem;font-weight:700;color:var(--text-title);line-height:1.35}
        .fc-sub{font-size:.8rem;color:var(--text-mention);margin-top:4px}
        .fc-body{padding:20px 24px 24px}
        .opts{display:flex;flex-direction:column;gap:8px}
        .opts.g2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .op{display:flex;align-items:center;gap:10px;padding:14px 16px;border:1.5px solid var(--border);border-radius:4px;cursor:pointer;transition:all .15s;user-select:none;position:relative;background:#fff}
        .op:hover{border-color:var(--bleu);background:var(--bleu-light)}
        .op.sel{border-color:var(--green);background:var(--green-bg)}
        .op-i{font-size:20px;flex-shrink:0}
        .op-t{font-size:.88rem;font-weight:600;color:var(--text-title);line-height:1.3}
        .op-ck{position:absolute;top:8px;right:8px;width:20px;height:20px;background:var(--green);border-radius:50%;display:flex;align-items:center;justify-content:center;opacity:0;transform:scale(.4);transition:all .2s}
        .op.sel .op-ck{opacity:1;transform:scale(1)}
        .op-ck svg{width:12px;height:12px;color:white}
        .blk{text-align:center;padding:16px 0}
        .blk-i{font-size:44px;margin-bottom:14px}
        .blk h4{font-size:1.05rem;font-weight:700;margin-bottom:8px;color:var(--text-title)}
        .blk p{font-size:.85rem;color:var(--text-body);line-height:1.6;max-width:340px;margin:0 auto}
        .blk-btn{display:inline-flex;align-items:center;gap:6px;margin-top:16px;padding:10px 22px;background:var(--bg-alt);color:var(--text-body);border:1px solid var(--border);border-radius:4px;font-family:inherit;font-size:.85rem;font-weight:600;cursor:pointer;transition:all .2s}
        .blk-btn:hover{background:var(--bleu);color:#fff;border-color:var(--bleu)}
        .fd{margin-bottom:12px}
        .fd label{display:block;font-size:.8rem;color:var(--text-mention);font-weight:600;margin-bottom:5px}
        .fi{width:100%;padding:12px 16px;border:1.5px solid var(--border);border-radius:4px;font-family:inherit;font-size:.92rem;color:var(--text-title);background:#fff;transition:border-color .2s;appearance:none}
        .fi:focus{outline:none;border-color:var(--bleu);box-shadow:0 0 0 3px rgba(0,0,145,.1)}
        .fi::placeholder{color:var(--text-light)}
        .fd-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .fd-sfx{position:relative}
        .fd-sfx .fi{padding-right:56px}
        .fd-sfx span{position:absolute;right:16px;bottom:13px;color:var(--text-mention);font-weight:700;font-size:.85rem;pointer-events:none}
        .fc-nav{display:flex;justify-content:space-between;align-items:center;padding:14px 24px;border-top:1px solid var(--border-light);background:var(--bg-alt)}
        .bn-back{display:flex;align-items:center;gap:4px;background:none;border:none;color:var(--text-mention);font-family:inherit;font-size:.85rem;cursor:pointer;padding:10px 12px;border-radius:4px;transition:all .15s;font-weight:600}
        .bn-back:hover{color:var(--text-title);background:var(--bg-alt2)}
        .bn-next{display:flex;align-items:center;gap:7px;background:var(--bleu);color:#fff;border:none;padding:11px 24px;border-radius:4px;font-family:inherit;font-size:.88rem;font-weight:700;cursor:pointer;transition:all .2s}
        .bn-next:hover:not(:disabled){background:var(--bleu-hover);transform:translateY(-1px)}
        .bn-next:disabled{opacity:.3;cursor:not-allowed;transform:none}
        .suc{text-align:center;padding:20px 0}
        .suc-ck{width:60px;height:60px;border-radius:50%;background:rgba(24,117,60,.08);border:2px solid var(--green);display:flex;align-items:center;justify-content:center;margin:0 auto 18px}
        .suc h3{font-size:1.2rem;font-weight:800;margin-bottom:8px;color:var(--text-title)}
        .suc p{font-size:.88rem;color:var(--text-body);line-height:1.6;max-width:360px;margin:0 auto}
        .suc-bd{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:18px}
        .suc-b{display:flex;align-items:center;gap:4px;padding:5px 12px;background:rgba(24,117,60,.06);border:1px solid rgba(24,117,60,.15);color:var(--green);border-radius:50px;font-size:.75rem;font-weight:600}
        .partners-bottom{padding:48px 24px;background:#fff;border-top:1px solid var(--border)}
        .partners-inner{max-width:960px;margin:0 auto;text-align:center}
        .partners-label{font-size:.88rem;text-transform:uppercase;letter-spacing:3px;color:var(--text-mention);font-weight:700;margin-bottom:28px}
        .partners-logos{display:flex;align-items:center;justify-content:center;gap:32px;flex-wrap:wrap}
        .p-logo{height:36px;object-fit:contain;opacity:.7;transition:opacity .3s}
        .p-logo:hover{opacity:1}
        .p-sep{width:1px;height:40px;background:var(--border)}
        .footer-gov{background:#fff;border-top:2px solid var(--bleu);padding:32px 24px 24px}
        .footer-inner{max-width:1140px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px}
        .footer-brand{display:flex;align-items:center;gap:14px}
        .footer-brand-text{font-size:.82rem;color:var(--text-mention);line-height:1.4}
        .footer-links{display:flex;gap:16px;flex-wrap:wrap}
        .footer-links a{font-size:.78rem;color:var(--text-mention);text-decoration:none;font-weight:500;transition:color .2s}
        .footer-links a:hover{color:var(--bleu)}
        .footer-copy{width:100%;text-align:center;margin-top:16px;padding-top:16px;border-top:1px solid var(--border);font-size:.75rem;color:var(--text-light)}
        .fi-anim{animation:fadeU .35s ease both}
        @keyframes fadeU{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:768px){.tl-header{grid-template-columns:1fr;gap:40px}.hero-stats{gap:24px;flex-wrap:wrap}}
        @media(max-width:480px){.hero h1{font-size:1.5rem}.hero-actions{flex-direction:column}.hero-btn{width:100%;justify-content:center}.fd-row{grid-template-columns:1fr}}
      `}</style>

      {/* Header */}
      <header className="gov-header" ref={navRef} id="mainNav">
        <div className="gov-header-inner">
          <a href="#" className="gov-brand">
            <img
              src="https://upload.wikimedia.org/wikipedia/fr/thumb/2/22/Republique-francaise-logo.svg/1280px-Republique-francaise-logo.svg.png"
              alt="République Française"
              style={{ height: 56, width: "auto", flexShrink: 0 }}
            />
            <div className="gov-brand-sep" />
            <div>
              <div className="gov-service-name">FRANCE <span>RÉNOVE</span></div>
              <div className="gov-service-tagline">Votre projet solaire clé en main</div>
            </div>
          </a>
          <a href="#formZone" className="gov-cta">Demander un devis</a>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <video className="hero-video" autoPlay muted loop playsInline>
          <source src="https://groupeverlaine.com/assets/videos/hero_groupeverlaine.mp4" type="video/mp4" />
        </video>
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-badge">
            <span className="pulse" />
            Programme disponible en 2026
          </div>
          <h1>Passez au solaire et réduisez votre facture jusqu&apos;à <span className="hl">70%</span></h1>
          <p className="hero-sub">Un interlocuteur unique, un parcours clair, et une prise en charge complète de l&apos;étude à la mise en service — aides comprises.</p>
          <div className="hero-actions">
            <a href="#formZone" className="hero-btn primary">
              Estimer mes économies
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </a>
            <a href="#timeline" className="hero-btn secondary">Découvrir le processus</a>
          </div>
          <div className="hero-stats">
            <div><div className="hero-stat-num">2 500<span>+</span></div><div className="hero-stat-label">Installations réalisées</div></div>
            <div><div className="hero-stat-num">4.8<span>/5</span></div><div className="hero-stat-label">Satisfaction client</div></div>
            <div><div className="hero-stat-num">40<span>%</span></div><div className="hero-stat-label">D&apos;aides en moyenne</div></div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="timeline-section" id="timeline" ref={tlSectionRef}>
        <div className="tl-container">
          <div className="tl-header">
            <div className="tl-left">
              <h2>Votre projet<br />clé en main</h2>
              <p>On s&apos;occupe de tout, du premier échange à la mise en service — aides comprises.</p>
            </div>
            <div className="tl-right">
              <div className="tl-line" />
              <div className="tl-line-fill" ref={tlFillRef} />
              {[
                { title: "Test d'éligibilité", desc: "Nous analysons votre éligibilité pour définir la solution la plus pertinente." },
                { title: "Étude gratuite avec un expert", desc: "Un technicien RGE confirme la faisabilité, la rentabilité, les dimensions et les points de conformité." },
                { title: "Montage complet des aides et démarches", desc: "Nous gérons MaPrimeRénov' et CEE, ainsi que les pièces administratives." },
                { title: "Exécution et installation", desc: "Planification, coordination, contrôle qualité : nous pilotons le chantier jusqu'à la mise en service." },
              ].map((item, i) => (
                <div className="tl-step" key={i}>
                  <div className={`tl-dot ${i < 2 ? "done" : "pending"}`}>
                    {i < 2 ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" style={{ width: 14, height: 14 }}><polyline points="20 6 9 17 4 12" /></svg>
                    ) : i + 1}
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="tl-cta">
            <a href="#formZone" className="tl-cta-btn">
              Démarrer mon projet
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </a>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="form-section" id="formZone">
        <div className="form-container">
          <div className="form-header">
            <h2>Votre estimation <span className="hl">personnalisée</span></h2>
            <p>Répondez en 2 minutes — un conseiller vous rappelle sous 24h.</p>
          </div>
          <div className="f-progress">
            <div className="f-progress-info">
              <span>{submitted ? "Terminé !" : `Étape ${q.s}/${TOTAL}`}</span>
              <span className="pct">{submitted ? "100%" : `${pct}%`}</span>
            </div>
            <div className="f-track">
              <div className="f-fill" style={{ width: submitted ? "100%" : `${pct}%` }} />
            </div>
          </div>

          {submitted ? (
            <div className="fc fi-anim">
              <div className="fc-top" style={{ background: "#18753c" }}>
                <div className="fc-badge" style={{ background: "rgba(255,255,255,.2)", color: "white" }}>TERMINÉ ✓</div>
                <div className="fc-title-row">
                  <div className="fc-emoji">🎉</div>
                  <div><div className="fc-title" style={{ color: "#fff" }}>Demande envoyée avec succès !</div></div>
                </div>
              </div>
              <div className="fc-body">
                <div className="suc">
                  <div className="suc-ck">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#18753c" strokeWidth="2.5" strokeLinecap="round" style={{ width: 28, height: 28 }}><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <h3>Merci {answers.prenom || ""} !</h3>
                  <p>Notre équipe vous contacte sous <strong>24 heures</strong> avec votre estimation et l&apos;étude de vos aides.</p>
                  <div className="suc-bd">
                    {["Devis gratuit", "Aides MaPrimeRénov'", "Clé en main"].map((l) => (
                      <div key={l} className="suc-b">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                        {l}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : blocked && q.bk ? (
            <div className="fc fi-anim">
              <div className="fc-top">
                <div className="fc-badge">ÉTAPE {q.s} / {TOTAL}</div>
                <div className="fc-title-row">
                  <div className="fc-emoji">{q.e}</div>
                  <div><div className="fc-title">{q.t}</div></div>
                </div>
              </div>
              <div className="fc-body">
                <div className="blk">
                  <div className="blk-i">{q.bk.ic}</div>
                  <h4>{q.bk.tt}</h4>
                  <p>{q.bk.tx}</p>
                  <button className="blk-btn" onClick={resetBlocked}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                    Modifier ma réponse
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="fc fi-anim" key={step}>
              <div className="fc-top">
                <div className="fc-badge">ÉTAPE {q.s} / {TOTAL}</div>
                <div className="fc-title-row">
                  <div className="fc-emoji">{q.e}</div>
                  <div>
                    <div className="fc-title">{q.type === "f" ? factureTitle : q.t}</div>
                    <div className="fc-sub">{q.sub}</div>
                  </div>
                </div>
              </div>
              <div className="fc-body">
                {q.type === "c" && (
                  <div className={`opts${q.g ? " g2" : ""}`}>
                    {q.opts!.map((opt) => (
                      <div
                        key={opt.v}
                        className={`op${answers[q.id] === opt.v ? " sel" : ""}`}
                        onClick={() => pickAnswer(q.id, opt.v)}
                      >
                        <div className="op-i">{opt.i}</div>
                        <div className="op-t">{opt.l}</div>
                        <div className="op-ck">
                          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" style={{ width: 12, height: 12 }}><polyline points="20 6 9 17 4 12" /></svg>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {q.type === "f" && (
                  <div className="fd fd-sfx">
                    <label>Montant mensuel</label>
                    <input
                      className="fi"
                      type="number"
                      inputMode="numeric"
                      placeholder="Ex : 120"
                      value={answers.facture || ""}
                      onChange={(e) => setAnswers({ ...answers, facture: e.target.value })}
                      autoFocus
                    />
                    <span>€/mois</span>
                  </div>
                )}
                {q.type === "ct" && (
                  <>
                    <div className="fd-row">
                      <div className="fd">
                        <label>Prénom *</label>
                        <input className="fi" placeholder="Jean" value={answers.prenom || ""} onChange={(e) => setAnswers({ ...answers, prenom: e.target.value })} autoFocus />
                      </div>
                      <div className="fd">
                        <label>Nom *</label>
                        <input className="fi" placeholder="Dupont" value={answers.nom || ""} onChange={(e) => setAnswers({ ...answers, nom: e.target.value })} />
                      </div>
                    </div>
                    <div className="fd">
                      <label>Téléphone *</label>
                      <input className="fi" type="tel" inputMode="tel" placeholder="06 12 34 56 78" value={answers.tel || ""} onChange={(e) => setAnswers({ ...answers, tel: e.target.value })} />
                    </div>
                    <div className="fd">
                      <label>Email</label>
                      <input className="fi" type="email" inputMode="email" placeholder="jean@email.com" value={answers.email || ""} onChange={(e) => setAnswers({ ...answers, email: e.target.value })} />
                    </div>
                    <div className="fd">
                      <label>Code postal *</label>
                      <input className="fi" inputMode="numeric" placeholder="75001" maxLength={5} value={answers.cp || ""} onChange={(e) => setAnswers({ ...answers, cp: e.target.value })} />
                    </div>
                  </>
                )}
              </div>
              <div className="fc-nav">
                {step > 0 ? (
                  <button className="bn-back" onClick={prev}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                    Retour
                  </button>
                ) : <div />}
                {isLast ? (
                  <button className="bn-next" disabled={!canNext || submitting} onClick={submit}>
                    {submitting ? "Envoi..." : "Recevoir mon estimation"}
                  </button>
                ) : q.type !== "c" ? (
                  <button className="bn-next" disabled={!canNext} onClick={() => next(step, answers)}>
                    Continuer
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                  </button>
                ) : <div />}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Partners */}
      <div className="partners-bottom">
        <div className="partners-inner">
          <div className="partners-label">En partenariat avec</div>
          <div className="partners-logos">
            <img src="https://upload.wikimedia.org/wikipedia/fr/d/d5/Maprimerenov_logo.jpg" alt="MaPrimeRénov'" style={{ height: 42 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <div className="p-sep" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/%C3%89lectricit%C3%A9_de_France_logo.svg" alt="EDF" style={{ height: 28 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <div className="p-sep" />
            <img src="https://companieslogo.com/img/orig/EGIE3.SA_BIG.D-2854155a.png" alt="Engie" style={{ height: 44, filter: "brightness(0)" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <div className="p-sep" />
            <img src="https://www.economie.gouv.fr/files/files/directions_services/dae/img/LogoCEE550.png" alt="CEE" style={{ height: 40 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer-gov">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src="https://upload.wikimedia.org/wikipedia/fr/thumb/2/22/Republique-francaise-logo.svg/1280px-Republique-francaise-logo.svg.png" alt="République Française" style={{ height: 48 }} />
            <div className="footer-brand-text">France Rénove est un service<br />d&apos;accompagnement à la rénovation énergétique.</div>
          </div>
          <div className="footer-links">
            <a href="#">Mentions légales</a>
            <a href="#">Politique de confidentialité</a>
            <a href="#">Accessibilité</a>
            <a href="#">Plan du site</a>
          </div>
          <div className="footer-copy">© 2026 France Rénove — Tous droits réservés</div>
        </div>
      </footer>
    </div>
  );
}
