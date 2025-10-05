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
    tutorial: string;
    start: string;
    back: string;
    playAgain: string;
    playAgainNewTheme: string;
    unsupported: string;
    microphone: string;
    allowMic: string;
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
        gameEnd: string;
        winner: string;
        loser: string;
        winText: string;
        loseText: string;
    };
    credits: {
        button: string;
        developer: string;
        translator: string;
        founder: string;
    }
}>;

export const translations: Record<Key, Translation> = {
    id: {
        title: "Phonix Fun",
        play: "Bermain",
        tutorial: "Cara bermain",
        start: "Mulai permainan",
        back: "←",
        playAgain: "Mainkan ronde berikutnya",
        playAgainNewTheme: "Pilih tema yang berbeda",
        unsupported: "Game ini tidak didukung di peramban Anda saat ini. Coba perbarui ke versi terbaru atau gunakan Google Chrome atau Safari.",
        microphone: "Harap izinkan akses ke mikrofon anda.",
        allowMic: "Izinkan mikrofon",
        landscape: "Silakan ubah perangkat ke lanskap",
        themes: {
            choose: "Pilih tema",
            "1": "satu",
            "2": "dua",
            "3": "tiga",
            "4": "empat",
            "5": "lima",
        },
        modal: {
            confirm: "Ya",
            cancel: "Tidak",
            quit: {
                title: "Berhenti",
                content: <>Apakah anda yakin ingin keluar dari permainan?</>,
            }
        },
        gameplay: {
            "yourTurn": "Giliranmu",
            "oppTurn": "Giliran lawan",
            "wait": "Harap tunggu sementara lawan Anda bermain.",
            "listen": "🔊",
            "gameEnd": "Permainan berakhir",
            "winner": "Menang",
            "loser": "Kalah",
            "winText": "Selamat, anda menang! Anda mendapatkan $COUNT(kerang|kerang)!",
            "loseText": "Anda hanya memiliki $COUNT(kerang|kerang).",

            "select": "Ketuk salah satu lubang anda.",
            "confirm": "Lubang ini memiliki $COUNT(kerang|kerang). Ketuk lubang ini sekali lagi untuk memainkan langkah ini!",
            "rechoose": "Lubang ini kosong. Pilih yang lain.",
            "init": "",
            "move": "",
            "speak": "Ucapkan kata yang ditunjukkan di papan tulis.",
            "speak-steal": "Ucapkan kata yang ditunjukkan di papan tulis.",
            "speak-select": "Ucapkan kata yang ditunjukkan di papan tulis.",
            "end": "",
            "steal-init": "",
            "steal-move": "",
            "steal-end": "",
            "clean-init": "",
            "clean-move": "",
            "clean-end": "",
        },
        credits: {
            "button": "Credits",
            "developer": "Developer",
            "translator": "Translator",
            "founder": "Founder",
        },
    },
} as const;