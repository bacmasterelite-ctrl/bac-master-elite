import { SignIn } from "@clerk/react";
import { GraduationCap } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">BAC MASTER</h1>
              <p className="text-sm text-blue-100 -mt-1">ELITE</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Réussis ton BAC avec confiance.
          </h2>
          <p className="text-blue-100 text-lg leading-relaxed">
            Cours, exercices interactifs, annales, tuteur IA et méthodologie —
            tout ce qu'il te faut pour décrocher la meilleure mention. Séries A,
            C, D.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { n: "1000+", l: "Exercices" },
              { n: "300+", l: "Cours" },
              { n: "24/7", l: "Tuteur IA" },
            ].map((s) => (
              <div key={s.l} className="bg-white/10 rounded-xl p-4">
                <div className="text-2xl font-bold">{s.n}</div>
                <div className="text-xs text-blue-100 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <SignIn routing="path" path="/login" signUpUrl="/login" />
      </div>
    </div>
  );
}
