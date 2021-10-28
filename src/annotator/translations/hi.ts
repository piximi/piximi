// prettier-ignore
import {language} from "./language";

const hi: language = {
  translation: {
    Cancel: "रद्द करें",
    Categories: "सारे वर्ग",
    "Create category": "वर्ग बनाएँ",
    "Create new classifier": "नया वर्गीकर्त्ता बनाएं", // वर्गीकर्त्ता = classifier but is rarely used; consider transliterating instead
    "Delete category": "वर्ग हटाएँ",
    "Delete images": "चित्रों को हटाएँ",
    Description: "विवरण",
    "Edit category": "वर्ग का बदलाव करें",
    Help: "सहायता",
    "Hide other categories": "बाकि वर्गों को छिपाएं",
    "Hide sidebar": "साइडबार छिपाएं",
    "Import images": "चित्रों को आयात करें",
    Logo: "लोगो", // transliterated (Logo) but that's ok because it is a loanword
    Model: "मॉडल", // transliterated (Model) but should figure out an appropriate abstraction and translate that
    "Open classifier": "वर्गीकर्त्ता खोलें",
    "Open example classifier": "उदाहरण का वर्गीकर्त्ता खोलें",
    "Open weights": "वेइट्स खोलें",
    Open: "खोलें",
    "Run classifier": "वर्गीकर्त्ता को चलाएं",
    "Save annotations and predictions": "टिप्पणी तथा अनुमान सहेजें", // व्याख्या is an alternative to टिप्पणी
    "Save classifier": "वर्गीकर्त्ता सहेजें",
    "Save weights": "वेइट्स सहेजें",
    Save: "सहेजें",
    "Search images": "चित्र खोजें",
    "Send feedback": "प्रतिक्रिया भेजें",
    Settings: "सेटिंग्स",
    "Show sidebar": "साइडबार दिखाएं",
    Unknown: "अज्ञात", // should be used as an adjective before a noun
  },
};

export default hi;
