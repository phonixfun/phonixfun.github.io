import styles from "@styles/UI.module.css";
import { LangContext } from "@contexts/LangContext";
import { MainData, Scenes, useStore } from "@utils/useStore";
import { ReactNode, useCallback, useContext, useEffect, useMemo } from "react";
import { Theme } from "@utils/Theme";
import { Modal, modal } from "@components/Modal";
import { assetPath } from "@utils/Config";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";

async function fullscreenLandscape(store: MainData) {
    try {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
        }
        if ("lock" in window.screen.orientation) {
            await (window.screen.orientation as any).lock("landscape");
        }
    } catch (ex) {
        if (ex instanceof DOMException) return;
        console.error(ex);
    }

    if (window.screen.orientation.type.startsWith("portrait")) {
        store.scene = "ToLandscape";
    }
}

async function exitFullscreen() {
    try {
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        }
        if ("unlock" in window.screen.orientation) {
            window.screen.orientation.unlock();
        }
    } catch (ex) {
        if (ex instanceof DOMException) return;
        console.error(ex);
    }
}

async function loadWords(theme: Theme) {
    const response = await fetch(assetPath(`/data/words.json`));
    if (!response.ok) throw new Error(`Failed to load words for theme ${theme}`);
    const data = await response.json();
    return data[theme];
}

export function UI() {
    const store = useStore();

    useEffect(() => {
        if (!store.theme) return;
        if (store.scene !== "Game") return;
        loadWords(store.theme).then(words => store.words = words);
    }, [store.scene, store.theme]); // eslint-disable-line react-hooks/exhaustive-deps

    let ActiveUI: () => ReactNode = () => null;
    switch (store.scene) {
        case "MainMenu": ActiveUI = MainMenu; break;
        case "Tutorial": ActiveUI = Tutorial; break;
        case "Credits": ActiveUI = Credits; break;
        case "ChooseTheme": ActiveUI = ThemeMenu; break;
        case "ToLandscape": ActiveUI = PromptLandscape; break;
        case "Game": {
            switch (store.error) {
                case null: ActiveUI = GameUI; break;
                case "Unsupported": ActiveUI = ErrorUnsupported; break;
                case "Microphone": ActiveUI = ErrorMicrophone; break;
            }
            break;
        }
    }

    let blur: "off" | "on" | "strong" = "off";
    switch (store.scene) {
        case "MainMenu":
        case "Tutorial":
        case "Credits":
        case "ChooseTheme":
        case "ToLandscape":
            blur = "strong";
            break;
        case "Game": {
            if (store.error) blur = "strong";
            else if (store.action.startsWith("speak")) blur = "off";
        }
    }

    return (
        <div className={styles.ui}>
            <div className={`${styles.blur} ${styles[blur]}`}>
                <ActiveUI />
            </div>
            <Modal />
        </div>
    );
}

function MainMenu() {
    const { lang: { translation: i18n } } = useContext(LangContext);
    const store = useStore();
    return (<>
        <div className={styles.menu}>
            <h3>{i18n.title}</h3>
            <div className={styles.buttons} style={{ flexDirection: "column" }}>
                <Button label={i18n.play} onClick={() => { store.scene = "ChooseTheme"; SpeechRecognition.startListening(); }} />
                <Button label={i18n.tutorial} onClick={() => { store.scene = "Tutorial"; }} />
            </div>
            <div className={styles.credits}>
                <Button label={i18n.credits.button} onClick={() => { store.scene = "Credits"; }} />
            </div>
        </div>
    </>);
}

function Tutorial() {
    return (<>
        <div className={[styles.menu, styles.tutorial].join(" ")}>
            <BackButton />
        </div>
    </>);
}

function Credits() {
    const { lang: { translation: i18n } } = useContext(LangContext);
    return (<>
        <div className={[styles.menu, styles.creditscreen].join(" ")}>
            <h3>{i18n.credits.founder}</h3>
            <span>Depi Prihamdani</span>
            <h3>{i18n.credits.developer}</h3>
            <span>Kronoxis</span>
            <h3>{i18n.credits.translator}</h3>
            <span>Lynns</span>
            <BackButton />
        </div>
    </>);
}

function ErrorUnsupported() {
    const { lang: { translation: i18n } } = useContext(LangContext);
    const store = useStore();
    useEffect(() => {
    }, [store]);

    return (<>
        <div className={styles.menu}>
            <span>{i18n.unsupported}</span>
        </div>
    </>);
}

function ErrorMicrophone() {
    const { lang: { translation: i18n } } = useContext(LangContext);
    const store = useStore();

    SpeechRecognition.startListening({ language: "en-GB" });
    const { isMicrophoneAvailable } = useSpeechRecognition();
    if (isMicrophoneAvailable) {
        SpeechRecognition.stopListening();
        store.error = null;
    }

    return (<>
        <div className={styles.menu}>
            <span>{i18n.microphone}</span>
            <Button label={i18n.allowMic} active
                onClick={() => SpeechRecognition.browserSupportsSpeechRecognition()}
            />
        </div>
    </>);
}

function ThemeMenu() {
    const { lang: { translation: i18n } } = useContext(LangContext);
    const store = useStore();
    return (<>
        <div className={styles.menu}>
            <h3>{i18n.themes.choose}</h3>
            <div className={[styles.buttons, styles.theme].join(" ")}>
                <ThemeButton theme={"1"} />
                <ThemeButton theme={"2"} />
                <ThemeButton theme={"3"} />
                <ThemeButton theme={"4"} />
                <ThemeButton theme={"5"} />
            </div>
            <div className={styles.controls}>
                <Button label={i18n.start} onClick={() => { store.scene = "Game"; fullscreenLandscape(store); }} disabled={!store.theme} />
            </div>
            <BackButton />
        </div>
    </>);
}

function PromptLandscape() {
    const { lang: { translation: i18n } } = useContext(LangContext);
    const store = useStore();
    useEffect(() => {
        function check() {
            if (window.screen.orientation.type.startsWith("portrait")) return;
            window.screen.orientation.removeEventListener("change", check);
            store.scene = "Game";
        }
        window.screen.orientation.addEventListener("change", check);
        check();
    }, [store]);

    return (<>
        <div className={styles.menu}>
            <span>{i18n.landscape}</span>
            <BackButton />
        </div>
    </>);
}

function GameUI() {
    return (<>
        <BackButton confirm />
        <div className={styles.playerA}>
            <Instruction player={0} />
        </div>
        <div className={styles.playerB}>
            <Instruction player={1} />
        </div>
        <Word />
        <Replay />
    </>);
}

const countable = /\$COUNT\(([^|]+)\|([^)]+)\)/;
function Instruction({ player }: { player: number }) {
    const { lang: { translation: i18n } } = useContext(LangContext);
    const store = useStore();
    let turn: string = store.player === -1 ? i18n.gameplay.gameEnd : i18n.gameplay.oppTurn;
    let instruction: string = store.player === -1 ? "" : i18n.gameplay.wait;
    if (store.result !== null) {
        const players = store.result.length;
        const myScore = store.result[player];
        const oppScore = store.result[(player + 1) % players];
        const winner = myScore > oppScore;
        turn = winner ? i18n.gameplay.winner : i18n.gameplay.loser;
        instruction = winner ? i18n.gameplay.winText : i18n.gameplay.loseText;
        instruction = instruction.replace(countable, myScore === 1 ? `${myScore} $1` : `${myScore} $2`);
    }
    else if (store.player === -1) {
        turn = i18n.gameplay.gameEnd;
        instruction = "";
    }
    else if (store.player === player) {
        turn = i18n.gameplay.yourTurn;
        instruction = i18n.gameplay[store.action];
        if (store.shells) {
            const count = store.shells.length;
            instruction = instruction.replace(countable, count === 1 ? `${count} $1` : `${count} $2`);
        }
    }
    return (
        <div className={styles.instruction}>
            <h3>{turn}</h3>
            <span>{instruction}</span>
        </div>
    );
}

function Word() {
    const { lang: { translation: i18n } } = useContext(LangContext);
    const store = useStore();

    const tts = useMemo(() => {
        if (!store.word) return null;
        const tts = new SpeechSynthesisUtterance(store.word);
        tts.lang = "en-GB";
        tts.addEventListener("start", () => SpeechRecognition.abortListening());
        tts.addEventListener("end", () => SpeechRecognition.startListening({ language: "en-GB" }));
        return tts;
    }, [store.word]);

    if (!store.action.startsWith("speak")) return null;

    const classes = [styles.word];
    if (store.player === 1) classes.push(styles.flip);

    return (
        <div className={classes.join(" ")}>
            <div className={styles.main}>
                <span>{store.word}</span>
                {tts && <Button label={i18n.gameplay.listen} classes={styles.listen}
                    onClick={() => {
                        window.speechSynthesis.speak(tts)
                    }}
                />}
            </div>
        </div>
    );
}

function Replay() {
    const { lang: { translation: i18n } } = useContext(LangContext);
    const store = useStore();
    if (store.result === null) return null;
    return (
        <div className={styles.menu} style={{ gap: "10px" }}>
            <Button label={i18n.playAgain} onClick={() => store.scene = "NewGame"} />
            <Button label={i18n.playAgainNewTheme} onClick={() => store.scene = "ChooseTheme"} />
        </div>
    );
}

function ThemeButton({ theme }: { theme: Theme }) {
    const { lang: { translation: i18n } } = useContext(LangContext);
    const store = useStore();
    return (<Button
        label={i18n.themes[theme]}
        active={store.theme === theme}
        onClick={() => store.theme = theme}
    />);
}

type ButtonProps = {
    label: string;
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
    classes?: string | string[];
}
function Button({ label, active = false, disabled = false, onClick, classes: cls = [] }: ButtonProps) {
    if (!Array.isArray(cls)) cls = [cls];
    const classes = [styles.button, ...cls];
    if (active) classes.push(styles.active);
    if (disabled) classes.push(styles.disabled);
    return (
        <div className={classes.join(" ")} onClick={() => !disabled && onClick()}>
            {label}
        </div>
    );
}

function BackButton({ confirm = false, scene = "MainMenu" }: { confirm?: boolean, scene?: Scenes }) {
    const { lang: { translation: i18n } } = useContext(LangContext);
    const store = useStore();

    const onClick = useCallback(() => {
        function goBack() {
            exitFullscreen();
            store.scene = scene;
        }
        if (confirm) {
            modal.addListener("confirm", () => {
                modal.clearAllListeners();
                goBack();
            });
            modal.addListener("cancel", () => {
                modal.clearAllListeners();
            })
            modal.open("quit");
        } else {
            goBack();
        }
    }, [store, scene, confirm]);

    return (
        <Button classes={styles.back} label={i18n.back} onClick={onClick} />
    );
}