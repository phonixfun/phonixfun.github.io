import { PropsWithChildren, createContext, useEffect, useState } from "react";
import { LangKey, LangProps, Translation, languages, translations } from "@data/lang";
import { getParam } from "@utils/Params";

export type Translations = { [key in LangKey]: Translation };

export function isLangKey(s: string): s is LangKey {
    return s in translations;
}

export type LangState = {
    translation: Translation;
    selected: LangProps;
};

export type LangContextProps = {
    lang: LangState;
    select: (prop: LangKey) => void;
    languages: Record<LangKey, LangProps>;
    setState?: React.Dispatch<React.SetStateAction<LangState>>;
}

export const langContext: LangContextProps = {
    lang: {
        translation: translations.id,
        selected: languages.id
    },
    select: (prop: LangKey) => {
        langContext.lang.translation = (translations as Translations)[prop];
        const language = languages[prop];
        if (language) {
            langContext.lang.selected = language as LangProps;
        }
        if (langContext.setState) {
            langContext.setState({ ...langContext.lang });
        }
        localStorage.setItem("lang", prop);
    },
    languages: languages
}

export const LangContext = createContext<LangContextProps>(langContext);

export function LangContextProvider({ children }: PropsWithChildren) {
    const [init, setInit] = useState(false);
    const [lang, setLang] = useState(langContext.lang);
    langContext.setState = setLang;
    langContext.lang = lang;
    useEffect(() => {
        const param = getParam("lang", "");
        const lang = localStorage.getItem("lang");
        if (isLangKey(param)) {
            langContext.select(param);
        } else if (lang !== null) {
            langContext.select(lang as LangKey);
        }
        setInit(true);
    }, []);

    return (
        <LangContext.Provider value={langContext}>
            {init && children}
        </LangContext.Provider>
    );
}