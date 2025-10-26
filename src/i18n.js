import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en/common.json";
import ru from "./locales/ru/common.json";
import fa from "./locales/fa/common.json";
import zh from "./locales/zh/common.json";

const resources = {
  en: { translation: en },
  ru: { translation: ru },
  fa: { translation: fa },
  zh: { translation: zh },
};

const FALLBACK = "en";

const storedLang =
  typeof window !== "undefined" && window.localStorage
    ? window.localStorage.getItem("schedulaa_lang")
    : null;

export const rtlLanguages = new Set(["fa"]);

export const applyDocumentDirection = (language) => {
  if (typeof document === "undefined") return;
  const dir = rtlLanguages.has(language) ? "rtl" : "ltr";
  document.documentElement.setAttribute("lang", language);
  document.documentElement.setAttribute("dir", dir);
  document.body.setAttribute("dir", dir);
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: storedLang || FALLBACK,
    fallbackLng: FALLBACK,
    interpolation: { escapeValue: false },
    defaultNS: "translation",
  })
  .then(() => {
    applyDocumentDirection(i18n.language);
  });

i18n.on("languageChanged", (lng) => {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem("schedulaa_lang", lng);
  }
  applyDocumentDirection(lng);
});

export default i18n;
