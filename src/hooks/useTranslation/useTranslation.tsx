import { useSelector } from "react-redux";
import { selectLanguageType } from "store/application";
import { de, en, fas, fi, fr, gr, hi, hu } from "translations";
import { LanguageType } from "types";

export const useTranslation = () => {
  const language = useSelector(selectLanguageType);

  const t = (word: string) => {
    switch (language) {
      case LanguageType.English:
        if (!en.translation[word]) return word;
        return en.translation[word];
      case LanguageType.Farsi:
        if (!fas.translation[word]) return word;
        return fas.translation[word];
      case LanguageType.Finnish:
        if (!fi.translation[word]) return word;
        return fi.translation[word];
      case LanguageType.French:
        if (!fr.translation[word]) return word;
        return fr.translation[word];
      case LanguageType.German:
        if (!de.translation[word]) return word;
        return de.translation[word];
      case LanguageType.Greek:
        if (!gr.translation[word]) return word;
        return gr.translation[word];
      case LanguageType.Hindi:
        if (!hi.translation[word]) return word;
        return hi.translation[word];
      case LanguageType.Hungarian:
        if (!hu.translation[word]) return word;
        return hu.translation[word];
      default:
        return word;
    }
  };

  return t;
};
