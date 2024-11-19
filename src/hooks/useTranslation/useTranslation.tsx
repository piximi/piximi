import { useSelector } from "react-redux";
import { de, en, fas, fi, fr, gr, hi, hu } from "translations";

import { selectLanguageType } from "store/applicationSettings/selectors";
import { Languages } from "utils/common/enums";

export const useTranslation = () => {
  const language = useSelector(selectLanguageType);

  const t = (word: string) => {
    switch (language) {
      case Languages.English:
        if (!en.translation[word]) return word;
        return en.translation[word];
      case Languages.Farsi:
        if (!fas.translation[word]) return word;
        return fas.translation[word];
      case Languages.Finnish:
        if (!fi.translation[word]) return word;
        return fi.translation[word];
      case Languages.French:
        if (!fr.translation[word]) return word;
        return fr.translation[word];
      case Languages.German:
        if (!de.translation[word]) return word;
        return de.translation[word];
      case Languages.Greek:
        if (!gr.translation[word]) return word;
        return gr.translation[word];
      case Languages.Hindi:
        if (!hi.translation[word]) return word;
        return hi.translation[word];
      case Languages.Hungarian:
        if (!hu.translation[word]) return word;
        return hu.translation[word];
      default:
        return word;
    }
  };

  return t;
};
