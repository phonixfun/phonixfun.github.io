import styles from "@styles/UI.module.css";
import { LangContext } from "@contexts/LangContext";
import { MainData, Scenes, useStore } from "@utils/useStore";
import { ReactNode, useCallback, useContext, useEffect } from "react";
import { Theme } from "@utils/Theme";
import { Modal, modal } from "@components/Modal";
import { assetPath } from "@utils/Config";

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
    console.log("loaded words", theme);
    return data[theme];
}

export function UI() {
    const store = useStore();

    useEffect(() => {
        if (!store.theme) return;
        if (store.scene !== "Game") return;
        loadWords(store.theme).then(words => store.words = words);
    }, [store.scene, store.theme, store]);

    useEffect(() => {
        if (store.scene === "Game") fullscreenLandscape(store);
    }, [store, store.scene]);

    let ActiveUI: () => ReactNode = () => null;
    switch (store.scene) {
        case "MainMenu": ActiveUI = MainMenu; break;
        case "ChooseTheme": ActiveUI = ThemeMenu; break;
        case "ToLandscape": ActiveUI = PromptLandscape; break;
        case "Game": ActiveUI = GameUI; break;
    }

    return (
        <div className={styles.ui}>
            <ActiveUI />
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
            <div className={styles.buttons}>
                <Button label={i18n.play} onClick={() => store.scene = "ChooseTheme"} />
            </div>
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
                <Button label={i18n.start} onClick={() => store.scene = "Game"} disabled={!store.theme} />
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
    </>);
}

function Instruction({ player }: { player: number }) {
    const { lang: { translation: i18n } } = useContext(LangContext);
    const store = useStore();
    let turn: string = i18n.gameplay.oppTurn;
    let instruction: string = i18n.gameplay.wait;
    if (store.player === player) {
        turn = i18n.gameplay.yourTurn;
        instruction = i18n.gameplay[store.action];
        if (store.shells) {
            const countable = /\$COUNT\(([^|]+)\|([^)]+)\)/;
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
    const store = useStore();

    if (store.action !== "speak") return null;
    return (
        <div className={styles.word}>
            {/* TODO: Use store.word */}
            <span className={store.player === 0 ? styles.normal : styles.flip}>{store.words}</span>
            {/* TODO: Listen button with TTS */}
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