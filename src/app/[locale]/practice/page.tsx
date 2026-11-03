// src/app/[locale]/practice/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { db, auth } from "@/lib/firebase/client";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { useTranslations } from "next-intl";

interface PracticePartner {
  uid: string;
  name: string;
  photoURL: string;
  practiceLanguages: string[];
  isPremium: boolean;
}

export default function PracticeLobbyPage() {
  const t = useTranslations("Practice");
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || "en";

  // The learner arrives from ATK with ?lesson=m1l1&phrases=Azul|Amek...
  const lessonId = searchParams.get("lesson") || "";
  const phrasesParam = searchParams.get("phrases") || "";
  const phrases = phrasesParam ? phrasesParam.split("|") : [];

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<PracticePartner[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser) {
        // If not signed in, redirect to login with return URL
        router.push(`/${locale}/account/login?return=/practice`);
      }
    });
    return () => unsub();
  }, [router, locale]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users"),
      where("practicePartner", "==", true)
    );
    const unsub = onSnapshot(q, (snap) => {
      const list: PracticePartner[] = [];
      snap.forEach((d) => {
        if (d.id === user.uid) return; // Exclude self
        const data = d.data();
        list.push({
          uid: d.id,
          name: data.name || data.displayName || "Anonymous",
          photoURL: data.photoURL || "",
          practiceLanguages: data.practiceLanguages || ["kab"],
          isPremium: data.isPremium || false,
        });
      });
      setPartners(list);
    });
    return () => unsub();
  }, [user]);

  const handleStartChat = (partnerUid: string) => {
    const prefill = phrases.length > 0
      ? `Azul! I just learned these phrases on ATK:\n${phrases.map((p) => `• ${p}`).join("\n")}\n\nCan we practice?`
      : `Azul! I would like to practice Kabyle.`;
    router.push(`/${locale}/rooms?dm=${partnerUid}&prefill=${encodeURIComponent(prefill)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">
        {t("loading")}
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-300">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0f172a]/90 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <Link
          href={`/${locale}/rooms`}
          className="text-teal-400 hover:text-teal-300 font-medium text-sm flex items-center gap-2"
        >
          ← {t("backToChat")}
        </Link>
        <h1 className="text-white font-bold text-lg">{t("title")}</h1>
        <div className="w-20"></div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Phrases from the lesson */}
        {phrases.length > 0 && (
          <div className="bg-[#1e293b] border border-teal-700 rounded-2xl p-4">
            <h2 className="text-sm text-teal-400 font-bold mb-2">
              {t("justLearned")}
            </h2>
            <ul className="space-y-1 text-white text-sm">
              {phrases.map((p, i) => (
                <li key={i}>• {p}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-gray-400 text-sm mb-4">{t("subtitle")}</p>

        {/* Partners list */}
        {partners.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            <p className="text-4xl mb-2">🌙</p>
            <p className="mb-4">{t("noPartners")}</p>
            <Link
              href={`/${locale}/profile`}
              className="text-teal-400 hover:text-teal-300 text-sm underline"
            >
              {t("becomePartner")}
            </Link>
          </div>
        ) : (
          partners.map((partner) => (
            <div
              key={partner.uid}
              className="bg-[#1e293b] border border-slate-700 rounded-2xl p-4 flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center text-xl text-white font-bold overflow-hidden">
                  {partner.photoURL ? (
                    <img
                      src={partner.photoURL}
                      alt={partner.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    partner.name[0]?.toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-white font-bold flex items-center gap-2">
                    {partner.name}
                    {partner.isPremium && <span className="text-sm">👑</span>}
                  </h3>
                  <p className="text-xs text-teal-400">🌟 {t("practicePartnerBadge")}</p>
                  <p className="text-xs text-gray-500">
                    {partner.practiceLanguages.map((l) => l.toUpperCase()).join(" · ")}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleStartChat(partner.uid)}
                className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition"
              >
                {t("startChat")}
              </button>
            </div>
          ))
        )}

        {/* Footer CTA */}
        <div className="mt-8 text-center text-xs text-gray-500">
          {t("wantToHelp")}{" "}
          <Link
            href={`/${locale}/profile`}
            className="text-teal-400 hover:text-teal-300 underline"
          >
            {t("enablePartner")}
          </Link>
        </div>
      </div>
    </div>
  );
}