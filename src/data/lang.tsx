import { Action } from "@components/Game";
import { ModalProps } from "@components/Modal";
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
    unsupported: string;
    microphone: string;
    allowMic: string;
    speak: string;
    landscape: string;
    themes: Record<Theme, string> & {
        choose: string;
    };
    modal: {
        confirm: string;
        cancel: string;
        quit: ModalProps;
    };
    gameplay: Record<Action, string> & {
        yourTurn: string;
        oppTurn: string;
        wait: string;
        listen: string;
    };
}>;

export const translations: Record<Key, Translation> = {
    id: {
        title: "Phonix Fun",
        play: "Play",
        start: "Start game",
        back: "←",
        unsupported: "This game is not supported in your current browser. Try updating to the latest version or use Google Chrome or Safari.",
        microphone: "Please allow access to your microphone.",
        allowMic: "Allow microphone",
        speak: "Click here, then say the word",
        landscape: "Please turn the device to landscape",
        themes: {
            choose: "Choose a theme",
            "1": "one",
            "2": "two",
            "3": "three",
            "4": "four",
            "5": "five",
        },
        modal: {
            confirm: "Yes",
            cancel: "No",
            quit: {
                title: "Quit",
                content: <>Are you sure you want to quit the game?</>,
            }
        },
        gameplay: {
            yourTurn: "Your turn",
            oppTurn: "Opponent's turn",
            wait: "Please wait while your opponent plays.",
            listen: "🔊",
            select: "Tap on one of your holes.",
            confirm: "This hole has $COUNT(shell|shells). Tap on this hole once more to play this move!",
            init: "",
            move: "",
            speak: "Say the word shown on the board.",
            end: "",
            "steal-init": "",
            "steal-move": "",
            "steal-end": "",
            "clean-init": "",
            "clean-move": "",
            "clean-end": "",
        },
    },
} as const;