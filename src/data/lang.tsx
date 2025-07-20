import { Theme } from "@utils/Theme";

type Key = "id";
export type { Key as LangKey };

type Props = {
    id: number;
    key: Key;
    name: string;
    shortName: string;
};
export type { Props as LangProps };

export const languages: Record<Key, Props> = {
    id: {
        id: 0,
        key: "id",
        name: "Indonesian",
        shortName: "ID",
    },
};

export type Translation = Readonly<{
    title: string;
    play: string;
    start: string;
    back: string;
    themes: Record<Theme, string> & {
        choose: string;
    }
}>;

export const translations: Record<Key, Translation> = {
    id: {
        title: "Phonix Fun",
        play: "Play",
        start: "Start game",
        back: "Back",
        themes: {
            choose: "Choose a theme",
            "1": "one",
            "2": "two",
            "3": "three",
            "4": "four",
            "5": "five",
        }
    },
} as const;