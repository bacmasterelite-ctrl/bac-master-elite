import { motion } from "framer-motion";
import { Link } from "wouter";

const TICKER_ITEMS = [
  { emoji: "🏆", text: "DÉFI MENSUEL EN COURS — Inscris-toi !", highlight: true },
  { emoji: "👑", text: "Grand prix : 10 000 FCFA" },
  { emoji: "🥇", text: "Top 10% : 500 FCFA" },
  { emoji: "🥈", text: "Top 50% : 300 FCFA" },
  { emoji: "🥉", text: "Qualification : 100 FCFA" },
  { emoji: "⚡", text: "1 erreur = élimination — Tu es prêt ?" },
  { emoji: "🎯", text: "5 questions chrono pour te qualifier" },
  { emoji: "🔥", text: "Les meilleurs s'affrontent le 28 du mois" },
  { emoji: "💰", text: "Prouve ta valeur. Gagne de l'argent RÉEL." },
  { emoji: "🚀", text: "Seuls les plus préparés survivent" },
];

const ITEMS = [...TICKER_ITEMS, ...TICKER_ITEMS];

export default function DefiChallengeBanner() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#7c2d12] via-[#1e1b4b] to-[#7c2d12] border border-indigo-900/60 shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-purple-500/10 to-yellow-500/5 pointer-events-none" />
      <div className="absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-[#7c2d12] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-[#7c2d12] to-transparent z-10 pointer-events-none" />
      <div className="flex items-center py-3">
        <motion.div
          className="flex items-center gap-8 whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
        >
          {ITEMS.map((item, i) => (
            <span key={i} className={`inline-flex items-center gap-2 text-sm font-semibold ${item.highlight ? "text-yellow-400" : "text-white/80"}`}>
              <span className="text-base">{item.emoji}</span>
              {item.highlight ? (
                <span className="font-black tracking-wide text-yellow-400 uppercase">{item.text}</span>
              ) : (
                <span>{item.text}</span>
              )}
              <span className="text-indigo-400 mx-2 font-black">·</span>
            </span>
          ))}
        </motion.div>
      </div>
      <div className="absolute right-0 top-0 h-full flex items-center pr-3 z-20">
        <Link href="/dashboard/defi-elite">
          <button className="flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-yellow-900 font-black text-xs px-3 py-1.5 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 whitespace-nowrap">
            🏆 Participer
          </button>
        </Link>
      </div>
    </div>
  );
}
