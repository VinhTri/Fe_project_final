import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const LanguageContext = createContext({
  language: "vi",
  setLanguage: () => {},
  translate: (viText, enText) => viText ?? enText ?? "",
});

const getInitialLanguage = () => {
  if (typeof window === "undefined") return "vi";
  return localStorage.getItem("appLanguage") || "vi";
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(getInitialLanguage);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("appLanguage", language);
    window.dispatchEvent(new CustomEvent("languageChanged", { detail: { language } }));
  }, [language]);

  const translate = useCallback(
    (viText, enText) => {
      if (language === "en") {
        if (typeof enText === "string" && enText.length > 0) {
          return enText;
        }
        if (typeof viText === "string" && viText.length > 0) {
          return viText;
        }
        return "";
      }
      if (typeof viText === "string" && viText.length > 0) {
        return viText;
      }
      if (typeof enText === "string" && enText.length > 0) {
        return enText;
      }
      return "";
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      translate,
    }),
    [language, translate]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
