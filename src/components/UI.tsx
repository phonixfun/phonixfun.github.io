import styles from "@styles/UI.module.css";
import { LangContext } from "@contexts/LangContext";
import { useStore } from "@utils/useStore";
import { ReactNode, useContext } from "react";
import { Theme } from "@utils/Theme";

export type UIs = "MainMenu" | "ThemeMenu" | "GameUI"

export function UI() {
    const store = useStore();

    let ActiveUI: () => ReactNode = () => null;
    switch (store.ui) {
        case "MainMenu": ActiveUI = MainMenu; break;
        case "ThemeMenu": ActiveUI = ThemeMenu; break;
        case "GameUI": ActiveUI = GameUI; break;
    }

    return (<>
        <div className={styles.menu}>
            <ActiveUI />
        </div>
    </>);
}

function MainMenu() {
    const { lang: { translation: i18n } } = useContext(LangContext);
    const store = useStore();
    return (<>
        <h3>{i18n.title}</h3>
        <div className={styles.buttons}>
            <Button label={i18n.play} onClick={() => store.ui = "ThemeMenu"} />
        </div>
    </>);
}

function ThemeMenu() {
    const { lang: { translation: i18n } } = useContext(LangContext);
    const store = useStore();
    return (<>
        <h3>{i18n.themes.choose}</h3>
        <div className={[styles.buttons, styles.theme].join(" ")}>
            <ThemeButton theme={"1"} />
            <ThemeButton theme={"2"} />
            <ThemeButton theme={"3"} />
            <ThemeButton theme={"4"} />
            <ThemeButton theme={"5"} />
        </div>
        <div className={styles.controls}>
            <Button label={i18n.back} onClick={() => store.ui = "MainMenu"} />
            <Button label={i18n.start} onClick={() => store.ui = "GameUI"} disabled={!store.theme} />
        </div>
    </>);
}

function GameUI() {
    return (<>
    </>);
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

function Button({ label, active = false, disabled = false, onClick }: { label: string, active?: boolean, disabled?: boolean, onClick: () => void }) {
    const classes = [styles.button];
    if (active) classes.push(styles.active);
    if (disabled) classes.push(styles.disabled);
    return (
        <div className={classes.join(" ")} onClick={() => !disabled && onClick()}>
            {label}
        </div>
    );
}