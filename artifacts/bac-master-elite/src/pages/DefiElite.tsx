import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Zap, Shield, Crown, Clock, CheckCircle, XCircle, Users, Gift, ChevronRight, AlertTriangle, Flame, Target, Award, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/SupabaseAuthProvider";
import DashboardLayout from "@/components/DashboardLayout";

type Page = "home" | "conditions" | "qualification" | "survivor" | "champions" | "historique" | "gains";
type Series = "A" | "C" | "D";

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  time_limit: number;
}

interface Champion {
  id: string;
  display_name: string;
  series: string;
  score: number;
  reward_amount: number;
  challenge_date: string;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const QUESTIONS: Record<Series, Question[]> = {
  A: [
    { id:"a1", question:"Quel est le thème central de 'L'Étranger' de Camus ?", options:["L'absurde","L'amour","La guerre","La religion"], correct_answer:"L'absurde", time_limit:8 },
    { id:"a2", question:"Qui a écrit 'Les Misérables' ?", options:["Victor Hugo","Zola","Flaubert","Balzac"], correct_answer:"Victor Hugo", time_limit:5 },
    { id:"a3", question:"La philosophie de Descartes est basée sur :", options:["Le doute méthodique","L'empirisme","Le pragmatisme","Le nihilisme"], correct_answer:"Le doute méthodique", time_limit:8 },
    { id:"a4", question:"Quelle est la capitale du Sénégal ?", options:["Dakar","Abidjan","Accra","Lagos"], correct_answer:"Dakar", time_limit:5 },
    { id:"a5", question:"Le romantisme est un mouvement du :", options:["XIXe siècle","XVIIe siècle","XVIe siècle","XXe siècle"], correct_answer:"XIXe siècle", time_limit:5 },
  ],
  C: [
    { id:"c1", question:"Quelle est la dérivée de f(x) = x³ ?", options:["3x²","2x³","x²","3x"], correct_answer:"3x²", time_limit:8 },
    { id:"c2", question:"La limite de sin(x)/x quand x tend vers 0 est :", options:["1","0","infini","-1"], correct_answer:"1", time_limit:10 },
    { id:"c3", question:"Formule de l'énergie cinétique ?", options:["½mv²","mv²","mgh","½mgh"], correct_answer:"½mv²", time_limit:8 },
    { id:"c4", question:"Le logarithme de 1 en base 10 est :", options:["0","1","10","-1"], correct_answer:"0", time_limit:5 },
    { id:"c5", question:"La force de Coulomb est proportionnelle à :", options:["1/r²","r²","1/r","r"], correct_answer:"1/r²", time_limit:8 },
  ],
  D: [
    { id:"d1", question:"La photosynthèse produit :", options:["O2 et glucose","CO2 et eau","N2 et ATP","H2 et glucose"], correct_answer:"O2 et glucose", time_limit:8 },
    { id:"d2", question:"La mitose est une division :", options:["Cellulaire somatique","Sexuée","Bactérienne","Virale"], correct_answer:"Cellulaire somatique", time_limit:8 },
    { id:"d3", question:"L'insuline est produite par :", options:["Le pancréas","Le foie","Les reins","La rate"], correct_answer:"Le pancréas", time_limit:5 },
    { id:"d4", question:"Le chromosome est composé de :", options:["ADN et protéines","ARN et lipides","ADN et ARN","Protéines et lipides"], correct_answer:"ADN et protéines", time_limit:8 },
    { id:"d5", question:"Quelle molécule transporte l'O2 dans le sang ?", options:["Hémoglobine","Albumine","Fibrine","Globuline"], correct_answer:"Hémoglobine", time_limit:5 },
  ],
};

const SURVIVOR_Q: Record<Series, Question[]> = {
  A: [
    { id:"sa1", question:"Figure de style attribuant des traits humains à un objet ?", options:["Personnification","Métaphore","Allitération","Anaphore"], correct_answer:"Personnification", time_limit:8 },
    { id:"sa2", question:"Auteur de 'Du contrat social' ?", options:["Rousseau","Voltaire","Montesquieu","Diderot"], correct_answer:"Rousseau", time_limit:5 },
    { id:"sa3", question:"Le surréalisme est fondé par :", options:["André Breton","Apollinaire","Aragon","Éluard"], correct_answer:"André Breton", time_limit:8 },
    { id:"sa4", question:"Langue officielle du Cameroun ?", options:["Français et Anglais","Français","Anglais","Ewondo"], correct_answer:"Français et Anglais", time_limit:5 },
    { id:"sa5", question:"La tragédie classique respecte la règle des :", options:["3 unités","2 unités","4 actes","5 actes"], correct_answer:"3 unités", time_limit:8 },
    { id:"sa6", question:"Nietzsche a déclaré :", options:["Dieu est mort","Je pense donc je suis","L'enfer c'est les autres","La vie est absurde"], correct_answer:"Dieu est mort", time_limit:5 },
    { id:"sa7", question:"Quel siècle est appelé Siècle des Lumières ?", options:["XVIIIe","XVIIe","XIXe","XVIe"], correct_answer:"XVIIIe", time_limit:5 },
  ],
  C: [
    { id:"sc1", question:"Intégrale de 2x dx = ?", options:["x²+C","2x²+C","x+C","2+C"], correct_answer:"x²+C", time_limit:8 },
    { id:"sc2", question:"P = UI correspond à :", options:["Puissance électrique","Pression","Probabilité","Période"], correct_answer:"Puissance électrique", time_limit:5 },
    { id:"sc3", question:"Formule de la 2e loi de Newton ?", options:["F=ma","E=mc²","P=mv","W=Fd"], correct_answer:"F=ma", time_limit:5 },
    { id:"sc4", question:"cos(0°) = ?", options:["1","0","-1","½"], correct_answer:"1", time_limit:5 },
    { id:"sc5", question:"La vitesse de la lumière est environ :", options:["3×10⁸ m/s","3×10⁶ m/s","3×10¹⁰ m/s","3×10⁴ m/s"], correct_answer:"3×10⁸ m/s", time_limit:8 },
    { id:"sc6", question:"Nombre d'Avogadro :", options:["6,02×10²³","6,02×10²²","3,14×10²³","1,6×10⁻¹⁹"], correct_answer:"6,02×10²³", time_limit:8 },
    { id:"sc7", question:"Un triangle équilatéral a des angles de :", options:["60°","45°","90°","30°"], correct_answer:"60°", time_limit:5 },
  ],
  D: [
    { id:"sd1", question:"L'unité de base de l'hérédité est :", options:["Le gène","Le chromosome","L'ADN","L'ARN"], correct_answer:"Le gène", time_limit:5 },
    { id:"sd2", question:"La méiose produit des cellules :", options:["Haploïdes","Diploïdes","Triploïdes","Tétraploïdes"], correct_answer:"Haploïdes", time_limit:8 },
    { id:"sd3", question:"Quel organe filtre le sang ?", options:["Le rein","Le foie","La rate","Le coeur"], correct_answer:"Le rein", time_limit:5 },
    { id:"sd4", question:"L'ATP est synthétisé lors de :", options:["La respiration cellulaire","La mitose","La transcription","La traduction"], correct_answer:"La respiration cellulaire", time_limit:8 },
    { id:"sd5", question:"Les anticorps sont produits par :", options:["Les lymphocytes B","Les lymphocytes T","Les macrophages","Les neutrophiles"], correct_answer:"Les lymphocytes B", time_limit:8 },
    { id:"sd6", question:"La double hélice d'ADN est découverte par :", options:["Watson et Crick","Darwin et Mendel","Pasteur et Koch","Fleming et Chain"], correct_answer:"Watson et Crick", time_limit:8 },
    { id:"sd7", question:"Le glucose est stocké sous forme de :", options:["Glycogène","Amidon","Cellulose","Saccharose"], correct_answer:"Glycogène", time_limit:5 },
  ],
};

function Timer({ total, onExpire }: { total: number; onExpire: () => void }) {
  const [left, setLeft] = useState(total);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setLeft(total);
    ref.current = setInterval(() => {
      setLeft(p => {
        if (p <= 1) { clearInterval(ref.current!); onExpire(); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current!);
  }, [total]);

  const pct = (left / total) * 100;
  const color = pct > 50 ? "#10b981" : pct > 25 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-14 w-14">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
          <circle cx="28" cy="28" r="24" fill="none" stroke={color} strokeWidth="4"
            strokeDasharray={`${2 * Math.PI * 24}`}
            strokeDashoffset={`${2 * Math.PI * 24 * (1 - pct / 100)}`}
            style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.3s" }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-black" style={{ color }}>
          {left}
        </span>
      </div>
    </div>
  );
}

function HomePage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const nextChallenge = new Date();
  nextChallenge.setDate(28);
  nextChallenge.setHours(19, 0, 0, 0);
  if (nextChallenge < new Date()) nextChallenge.setMonth(nextChallenge.getMonth() + 1);

  const [countdown, setCountdown] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = nextChallenge.getTime() - Date.now();
      if (diff <= 0) return;
      setCountdown({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 sm:p-10 text-white"
        style={{ background: "linear-gradient(135deg, #1e40af 0%, #7c3aed 50%, #10b981 100%)" }}>
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div key={i} className="absolute rounded-full bg-white/10"
              style={{ width: 60 + i * 40, height: 60 + i * 40, top: `${10 + i * 12}%`, left: `${5 + i * 15}%` }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }} />
          ))}
        </div>
        <div className="relative z-10 text-center">
          <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl mb-3">🏆</motion.div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">DÉFI MENSUEL ELITE</h1>
          <p className="text-white/80 text-sm mb-4">Le challenge éducatif premium du BAC</p>
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
            className="inline-block bg-yellow-400 text-yellow-900 font-black text-2xl px-6 py-2 rounded-2xl shadow-lg mb-6">
            🎁 Gagne jusqu'à 10 000 FCFA !
          </motion.div>
          <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto mb-4">
            {[["JOURS", countdown.d], ["HEURES", countdown.h], ["MIN", countdown.m], ["SEC", countdown.s]].map(([l, v]) => (
              <div key={l as string} className="bg-white/15 backdrop-blur rounded-xl p-2 text-center">
                <div className="text-2xl font-black">{String(v).padStart(2, "0")}</div>
                <div className="text-[10px] text-white/70">{l}</div>
              </div>
            ))}
          </div>
          <p className="text-white/70 text-xs mb-6">Prochain défi : 28 du mois à 19h00</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => onNavigate("conditions")}
              className="bg-white text-blue-700 font-bold px-6 py-3 rounded-2xl hover:bg-white/90 transition-all shadow-lg flex items-center gap-2">
              Participer <ChevronRight className="h-4 w-4" />
            </button>
            <button onClick={() => onNavigate("champions")}
              className="bg-white/15 backdrop-blur text-white font-bold px-6 py-3 rounded-2xl hover:bg-white/25 transition-all flex items-center gap-2">
              <Trophy className="h-4 w-4" /> Hall des Champions
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: "🧠", label: "Quiz Qualification", desc: "5 questions pour accéder" },
          { icon: "⚡", label: "Mode Survivor", desc: "1 erreur = élimination" },
          { icon: "🏅", label: "Badges Rares", desc: "Récompenses exclusives" },
          { icon: "💰", label: "Gains FCFA", desc: "Récompenses réelles" },
        ].map((f, i) => (
          <motion.div key={f.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
            <div className="text-3xl mb-2">{f.icon}</div>
            <div className="font-bold text-xs">{f.label}</div>
            <div className="text-muted-foreground text-xs mt-1">{f.desc}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "📋 Conditions", page: "conditions" as Page },
          { label: "🏆 Champions", page: "champions" as Page },
          { label: "📜 Mon Historique", page: "historique" as Page },
          { label: "💳 Récupérer mes gains", page: "gains" as Page },
        ].map(({ label, page }) => (
          <button key={page} onClick={() => onNavigate(page)}
            className="rounded-2xl border border-border bg-card p-4 text-sm font-semibold text-left hover:bg-muted transition-all flex items-center justify-between">
            {label} <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ConditionsPage({ onNavigate, profile }: { onNavigate: (p: Page) => void; profile: any }) {
  const isPremium = profile?.is_premium;
  const points = profile?.points ?? 0;
  const referrals = profile?.referral_count ?? 0;
  const badges = profile?.badges ?? [];

  const REQUIRED_BADGES = [
    "Premier pas validé", "Série de 7 jours consécutifs", "10 cours suivis",
    "Maître des annales", "Ami de l'IA", "Score parfait 100%",
  ];

  const conditions = [
    { label: "Compte Premium actif", ok: isPremium, detail: "Abonnez-vous pour accéder" },
    { label: "Minimum 5 parrainages", ok: referrals >= 5, detail: `${referrals}/5 invitations` },
    { label: "Minimum 200 points", ok: points >= 200, detail: `${points}/200 points` },
    { label: "Non-participation ce mois", ok: true, detail: "Pas encore participé" },
  ];

  const badgeConditions = REQUIRED_BADGES.map(b => ({ label: b, ok: badges.includes(b) }));
  const allOk = conditions.every(c => c.ok) && badgeConditions.every(b => b.ok);

  return (
    <div className="space-y-6">
      <button onClick={() => onNavigate("home")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-black mb-1 flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" /> Conditions de participation
        </h2>
        <p className="text-muted-foreground text-sm mb-6">Toutes ces conditions doivent être remplies</p>
        <div className="space-y-3 mb-6">
          {conditions.map(c => (
            <div key={c.label} className={`flex items-center justify-between p-3 rounded-xl border ${c.ok ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800" : "border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800"}`}>
              <div className="flex items-center gap-3">
                {c.ok ? <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" /> : <XCircle className="h-5 w-5 text-red-500 shrink-0" />}
                <span className="text-sm font-semibold">{c.label}</span>
              </div>
              <span className="text-xs text-muted-foreground">{c.detail}</span>
            </div>
          ))}
        </div>
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-500" /> Badges requis (6/6)
        </h3>
        <div className="grid grid-cols-1 gap-2 mb-6">
          {badgeConditions.map(b => (
            <div key={b.label} className={`flex items-center gap-3 p-2.5 rounded-xl border ${b.ok ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800" : "border-border bg-muted/30"}`}>
              {b.ok ? <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" /> : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground shrink-0" />}
              <span className="text-xs font-medium">{b.label}</span>
            </div>
          ))}
        </div>
        {allOk ? (
          <button onClick={() => onNavigate("qualification")}
            className="w-full bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-black py-4 rounded-2xl shadow-lg hover:opacity-90 transition-all text-lg">
            🚀 Commencer le Quiz de Qualification
          </button>
        ) : (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-center">
            <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Conditions non remplies</p>
            <p className="text-xs text-muted-foreground mt-1">Complétez toutes les conditions pour participer</p>
          </div>
        )}
      </div>
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h3 className="font-black text-base mb-4 flex items-center gap-2"><Gift className="h-5 w-5 text-purple-600" /> Récompenses possibles</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "100 FCFA", emoji: "🥉", desc: "Qualification" },
            { label: "300 FCFA", emoji: "🥈", desc: "Top 50%" },
            { label: "500 FCFA", emoji: "🥇", desc: "Top 10%" },
            { label: "10 000 FCFA", emoji: "👑", desc: "Événements spéciaux" },
          ].map(r => (
            <div key={r.label} className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-3 text-center">
              <div className="text-2xl">{r.emoji}</div>
              <div className="font-black text-sm text-yellow-700 dark:text-yellow-400">{r.label}</div>
              <div className="text-xs text-muted-foreground">{r.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QualificationPage({ onNavigate, series }: { onNavigate: (p: Page) => void; series: Series }) {
  const questions = shuffle(QUESTIONS[series]).slice(0, 5);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [shuffledOpts, setShuffledOpts] = useState<string[]>([]);
  const [timerKey, setTimerKey] = useState(0);

  useEffect(() => {
    if (idx < questions.length) setShuffledOpts(shuffle(questions[idx].options));
  }, [idx]);

  const answer = (opt: string) => {
    if (selected) return;
    setSelected(opt);
    const correct = opt === questions[idx].correct_answer;
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      if (idx + 1 >= questions.length) setDone(true);
      else { setIdx(i => i + 1); setSelected(null); setTimerKey(k => k + 1); }
    }, 1200);
  };

  if (done) {
    const passed = score >= 4;
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm space-y-4">
        <div className="text-6xl">{passed ? "🎉" : "😔"}</div>
        <h2 className="text-2xl font-black">{passed ? "Qualifié !" : "Non qualifié"}</h2>
        <p className="text-muted-foreground">Score : {score}/5</p>
        {passed ? (
          <>
            <p className="text-emerald-600 font-semibold">Excellent ! Vous accédez au Défi Survivor.</p>
            <button onClick={() => onNavigate("survivor")}
              className="w-full bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-black py-4 rounded-2xl shadow-lg text-lg hover:opacity-90 transition-all">
              ⚡ Lancer le Mode Survivor !
            </button>
          </>
        ) : (
          <>
            <p className="text-muted-foreground text-sm">Il faut 4/5 minimum. Révisez et revenez le mois prochain !</p>
            <button onClick={() => onNavigate("home")}
              className="w-full border border-border bg-muted py-3 rounded-2xl font-semibold hover:bg-muted/80 transition-all">
              Retour à l'accueil
            </button>
          </>
        )}
      </motion.div>
    );
  }

  const q = questions[idx];
  return (
    <div className="space-y-6">
      <button onClick={() => onNavigate("home")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Quiz de Qualification</span>
            <div className="text-sm text-muted-foreground">Série {series} · Question {idx + 1}/5</div>
          </div>
          <Timer key={timerKey} total={q.time_limit} onExpire={() => answer("__expired__")} />
        </div>
        <div className="h-1.5 bg-muted rounded-full mb-6">
          <div className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all"
            style={{ width: `${(idx / 5) * 100}%` }} />
        </div>
        <h3 className="text-base font-bold mb-6 leading-relaxed">{q.question}</h3>
        <div className="space-y-3">
          {shuffledOpts.map(opt => {
            let cls = "border border-border bg-muted/30 hover:bg-muted";
            if (selected) {
              if (opt === q.correct_answer) cls = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40";
              else if (opt === selected) cls = "border-red-500 bg-red-50 dark:bg-red-950/40";
            }
            return (
              <button key={opt} onClick={() => answer(opt)}
                className={`w-full text-left p-4 rounded-2xl transition-all font-medium text-sm ${cls}`}>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
      <div className="text-center text-xs text-muted-foreground">
        ✅ {score} bonne{score > 1 ? "s" : ""} réponse{score > 1 ? "s" : ""} · Minimum 4/5 requis
      </div>
    </div>
  );
}

function SurvivorPage({ onNavigate, series }: { onNavigate: (p: Page) => void; series: Series }) {
  const questions = shuffle(SURVIVOR_Q[series]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [eliminated, setEliminated] = useState(false);
  const [winner, setWinner] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [shuffledOpts, setShuffledOpts] = useState<string[]>([]);
  const [timerKey, setTimerKey] = useState(0);

  useEffect(() => {
    if (idx < questions.length) setShuffledOpts(shuffle(questions[idx].options));
  }, [idx]);

  const answer = (opt: string) => {
    if (selected) return;
    setSelected(opt);
    const correct = opt === questions[idx].correct_answer;
    setTimeout(() => {
      if (!correct || opt === "__expired__") { setEliminated(true); return; }
      const newScore = score + 1;
      setScore(newScore);
      if (idx + 1 >= questions.length) { setWinner(true); return; }
      setIdx(i => i + 1);
      setSelected(null);
      setTimerKey(k => k + 1);
    }, 1000);
  };

  if (winner) return (
    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
      className="rounded-3xl p-8 text-center text-white space-y-4"
      style={{ background: "linear-gradient(135deg,#1e40af,#7c3aed,#10b981)" }}>
      <motion.div animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 1, repeat: 3 }} className="text-7xl">🏆</motion.div>
      <h2 className="text-3xl font-black">CHAMPION !</h2>
      <p className="text-white/80">Score : {score}/{questions.length}</p>
      <div className="bg-yellow-400 text-yellow-900 font-black text-xl px-6 py-3 rounded-2xl inline-block">
        🎁 Récompense débloquée !
      </div>
      <div className="flex flex-col gap-3 pt-2">
        <button onClick={() => onNavigate("gains")}
          className="w-full bg-white text-blue-700 font-black py-3 rounded-2xl hover:bg-white/90 transition-all">
          💳 Récupérer mes gains
        </button>
        <button onClick={() => onNavigate("champions")}
          className="w-full bg-white/20 text-white font-bold py-3 rounded-2xl hover:bg-white/30 transition-all">
          Voir le Hall des Champions
        </button>
      </div>
    </motion.div>
  );

  if (eliminated) return (
    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
      className="rounded-3xl border border-red-300 bg-red-50 dark:bg-red-950/30 p-8 text-center space-y-4">
      <div className="text-6xl">💥</div>
      <h2 className="text-2xl font-black text-red-600">ÉLIMINÉ !</h2>
      <p className="text-muted-foreground">Vous avez survécu {score} question{score > 1 ? "s" : ""}.</p>
      <p className="text-sm text-muted-foreground">Une seule erreur suffit. Révisez et revenez le mois prochain !</p>
      <button onClick={() => onNavigate("home")}
        className="w-full border border-border bg-card py-3 rounded-2xl font-semibold hover:bg-muted transition-all">
        Retour à l'accueil
      </button>
    </motion.div>
  );

  const q = questions[idx];
  const danger = idx >= 4;

  return (
    <div className="space-y-4">
      <div className={`rounded-3xl border p-6 shadow-sm ${danger ? "border-red-400 bg-red-50/50 dark:bg-red-950/20" : "border-border bg-card"}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className={`text-xs font-black uppercase tracking-wider ${danger ? "text-red-600" : "text-purple-600"}`}>
              {danger ? "ZONE DANGER" : "Mode Survivor"}
            </span>
            <div className="text-sm text-muted-foreground">Question {idx + 1}/{questions.length} · {score} survécues</div>
          </div>
          <Timer key={timerKey} total={q.time_limit} onExpire={() => answer("__expired__")} />
        </div>
        <div className="flex gap-1 mb-6">
          {questions.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < idx ? "bg-emerald-500" : i === idx ? (danger ? "bg-red-500" : "bg-blue-600") : "bg-muted"}`} />
          ))}
        </div>
        {danger && (
          <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 0.8, repeat: Infinity }}
            className="mb-4 flex items-center gap-2 text-red-600 text-xs font-bold bg-red-100 dark:bg-red-950/40 px-3 py-2 rounded-xl">
            <Zap className="h-4 w-4" /> UNE ERREUR = ELIMINATION DIRECTE
          </motion.div>
        )}
        <h3 className="text-base font-bold mb-6 leading-relaxed">{q.question}</h3>
        <div className="space-y-3">
          {shuffledOpts.map(opt => {
            let cls = "border border-border bg-muted/30 hover:bg-muted hover:border-blue-400";
            if (selected) {
              if (opt === q.correct_answer) cls = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40";
              else if (opt === selected) cls = "border-red-500 bg-red-50 dark:bg-red-950/40";
            }
            return (
              <button key={opt} onClick={() => answer(opt)}
                className={`w-full text-left p-4 rounded-2xl transition-all font-medium text-sm ${cls}`}>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
      <div className="text-center">
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
          <Flame className="h-3 w-3 text-orange-500" /> {score} question{score > 1 ? "s" : ""} survécue{score > 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

function ChampionsPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("elite_champions").select("*").order("score", { ascending: false }).limit(20)
      .then(({ data }) => { setChampions(data ?? []); setLoading(false); });
  }, []);

  const DEMO: Champion[] = [
    { id:"1", display_name:"Kofi A.", series:"C", score:7, reward_amount:500, challenge_date:"2026-04-28" },
    { id:"2", display_name:"Amina D.", series:"D", score:6, reward_amount:300, challenge_date:"2026-04-28" },
    { id:"3", display_name:"Brice M.", series:"A", score:5, reward_amount:100, challenge_date:"2026-04-28" },
  ];

  const list = champions.length > 0 ? champions : DEMO;

  return (
    <div className="space-y-6">
      <button onClick={() => onNavigate("home")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>
      <div className="rounded-3xl p-6 text-white text-center"
        style={{ background: "linear-gradient(135deg,#1e40af,#7c3aed)" }}>
        <Trophy className="h-10 w-10 mx-auto mb-2" />
        <h2 className="text-2xl font-black">Hall des Champions</h2>
        <p className="text-white/70 text-sm">Les meilleurs du Défi Elite</p>
      </div>
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Chargement...</div>
      ) : (
        <div className="space-y-3">
          {list.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-black text-white text-sm shrink-0 ${i === 0 ? "bg-yellow-500" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-amber-600" : "bg-muted text-muted-foreground"}`}>
                {i < 3 ? ["🥇","🥈","🥉"][i] : `#${i+1}`}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm">{c.display_name}</div>
                <div className="text-xs text-muted-foreground">
                  Série {c.series} · {new Date(c.challenge_date).toLocaleDateString("fr-FR")}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-black text-sm">{c.score} pts</div>
                {c.reward_amount > 0 && (
                  <div className="text-xs text-emerald-600 font-bold">{c.reward_amount} FCFA</div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function HistoriquePage({ onNavigate, userId }: { onNavigate: (p: Page) => void; userId: string }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("elite_participations").select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .then(({ data }) => { setHistory(data ?? []); setLoading(false); });
  }, [userId]);

  return (
    <div className="space-y-6">
      <button onClick={() => onNavigate("home")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-black mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" /> Mon Historique
        </h2>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Aucune participation</p>
            <p className="text-sm mt-1">Participez à votre premier défi !</p>
            <button onClick={() => onNavigate("conditions")}
              className="mt-4 bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold hover:opacity-90 transition-all">
              Participer
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((h) => (
              <div key={h.id} className="flex items-center gap-4 p-3 rounded-xl border border-border">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white shrink-0 ${h.is_winner ? "bg-yellow-500" : h.eliminated ? "bg-red-500" : "bg-blue-500"}`}>
                  {h.is_winner ? "🏆" : h.eliminated ? "💥" : "✅"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">
                    {h.is_winner ? "Champion !" : h.eliminated ? "Éliminé" : "Qualifié"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(h.started_at).toLocaleDateString("fr-FR")} · Score: {h.survivor_score}
                  </div>
                </div>
                {h.reward_amount > 0 && (
                  <div className="text-emerald-600 font-black text-sm shrink-0">{h.reward_amount} FCFA</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GainsPage({ onNavigate, userId }: { onNavigate: (p: Page) => void; userId: string }) {
  const [hasWon, setHasWon] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.from("elite_participations").select("id").eq("user_id", userId).eq("is_winner", true).limit(1)
      .then(({ data }) => { setHasWon((data ?? []).length > 0); setChecking(false); });
  }, [userId]);
  const [form, setForm] = useState({ full_name: "", mobile_money_number: "", city: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.full_name || !form.mobile_money_number || !form.city) {
      setError("Veuillez remplir tous les champs."); return;
    }
    setLoading(true);
    const { error: err } = await supabase.from("elite_payment_requests").insert({
      user_id: userId,
      full_name: form.full_name,
      mobile_money_number: form.mobile_money_number,
      city: form.city,
      amount: 0,
    });
    setLoading(false);
    if (err) { setError("Erreur lors de l'envoi. Réessayez."); return; }
    setSent(true);
  };

  if (checking) return (
    <div className="text-center py-12 text-muted-foreground">Vérification en cours...</div>
  );

  if (!hasWon) return (
    <div className="rounded-3xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-8 text-center space-y-4">
      <div className="text-5xl">🔒</div>
      <h2 className="text-xl font-black text-amber-700">Accès refusé</h2>
      <p className="text-muted-foreground text-sm">Vous devez gagner le Défi Survivor pour récupérer des gains.</p>
      <button onClick={() => onNavigate("conditions")} className="w-full bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-black py-3 rounded-2xl hover:opacity-90 transition-all">
        Participer au Défi
      </button>
    </div>
  );

  if (sent) return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="rounded-3xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 p-8 text-center space-y-4">
      <CheckCircle className="h-12 w-12 text-emerald-600 mx-auto" />
      <h2 className="text-xl font-black text-emerald-700 dark:text-emerald-400">Demande envoyée !</h2>
      <p className="text-muted-foreground text-sm">L'administration va traiter votre demande dans les 48h.</p>
      <button onClick={() => onNavigate("home")}
        className="w-full border border-border bg-card py-3 rounded-2xl font-semibold hover:bg-muted transition-all">
        Retour à l'accueil
      </button>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <button onClick={() => onNavigate("home")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-black mb-1 flex items-center gap-2">
          <Gift className="h-5 w-5 text-purple-600" /> Récupérer mes gains
        </h2>
        <p className="text-muted-foreground text-sm mb-6">Remplissez ce formulaire pour recevoir votre récompense</p>
        <div className="space-y-4">
          {[
            { key: "full_name", label: "Nom complet", placeholder: "Jean Dupont" },
            { key: "mobile_money_number", label: "Numéro Mobile Money", placeholder: "+237 6XX XXX XXX" },
            { key: "city", label: "Ville", placeholder: "Yaoundé" },
          ].map(f => (
            <div key={f.key}>
              <label className="text-sm font-semibold block mb-1.5">{f.label}</label>
              <input
                value={form[f.key as keyof typeof form]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
            </div>
          ))}
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button onClick={submit} disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-black py-4 rounded-2xl shadow-lg hover:opacity-90 transition-all disabled:opacity-50 text-base mt-2">
            {loading ? "Envoi en cours..." : "📤 Envoyer ma demande"}
          </button>
        </div>
      </div>
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
        <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">Délai de traitement : 24 à 48h ouvrées</p>
        <p className="text-xs text-muted-foreground mt-1">Les gains sont vérifiés manuellement par l'équipe BAC MASTER ELITE.</p>
      </div>
    </div>
  );
}

export default function DefiElite() {
  const { user } = useAuth();
  const [page, setPage] = useState<Page>("home");
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("profiles").select("*").eq("id", user.id).single()
      .then(({ data }) => setProfile(data));
  }, [user?.id]);

  const series: Series = (["A","C","D"].includes((profile?.serie ?? "").toUpperCase())
    ? profile.serie.toUpperCase() : "D") as Series;

  const navigate = (p: Page) => { setPage(p); window.scrollTo(0, 0); };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-4 pb-8">
        <AnimatePresence mode="wait">
          <motion.div key={page}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}>
            {page === "home" && <HomePage onNavigate={navigate} />}
            {page === "conditions" && <ConditionsPage onNavigate={navigate} profile={profile} />}
            {page === "qualification" && <QualificationPage onNavigate={navigate} series={series} />}
            {page === "survivor" && <SurvivorPage onNavigate={navigate} series={series} />}
            {page === "champions" && <ChampionsPage onNavigate={navigate} />}
            {page === "historique" && <HistoriquePage onNavigate={navigate} userId={user?.id ?? ""} />}
            {page === "gains" && <GainsPage onNavigate={navigate} userId={user?.id ?? ""} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
