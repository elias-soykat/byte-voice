"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { translations, type Language } from "@/lib/translations";

type LanguageContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof translations.en;
  toggleLang: () => void;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>("en");

  // Load preferred language from localStorage if available
  useEffect(() => {
    const saved = localStorage.getItem("bytevoice_lang") as Language | null;
    if (saved === "en" || saved === "bn") {
      setLang(saved);
    }
  }, []);

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("bytevoice_lang", newLang);
  };

  const toggleLang = () => {
    const next = lang === "en" ? "bn" : "en";
    handleSetLang(next);
  };

  const value: LanguageContextType = {
    lang,
    setLang: handleSetLang,
    t: translations[lang],
    toggleLang,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
