import styles from "@styles/Modal.module.css";
import { LangContext } from "@contexts/LangContext";
import { forwardRef, ReactElement, useCallback, useContext, useImperativeHandle, useRef, useState } from "react"
import { Translation } from "@data/lang";

export type ModalProps = { 
    title: string; 
    content: ReactElement; 
};
export type Modals = Exclude<keyof Translation["modal"], "confirm" | "cancel">;

type EventType = "confirm" | "cancel";
type Listener = () => void;

type Handle = {
    element: HTMLDialogElement | null,
    addListener: (type: EventType, listener: Listener) => void;
    removeListener: (type: EventType, listener: Listener) => void;
    clearListeners: (type: EventType) => void;
    clearAllListeners: () => void;
    open: (modal: Modals) => void;
}

export const Modal = forwardRef<Handle>((_, fref) => {
    const { lang: { translation: i18n } } = useContext(LangContext);

    const ref = useRef<HTMLDialogElement>(null);

    const [active, setActive] = useState<Modals | null>(null);

    const confirmListeners = useRef<Listener[]>([]);
    const onConfirm = useCallback(() => {
        if (!ref.current) return;
        setActive(null);
        ref.current.close();
        for (const listener of confirmListeners.current) {
            listener();
        }
    }, []);

    const cancelListeners = useRef<Listener[]>([]);
    const onCancel = useCallback(() => {
        if (!ref.current) return;
        setActive(null);
        ref.current.close();
        for (const listener of cancelListeners.current) {
            listener();
        }
    }, []);

    const getListeners = useCallback((type: EventType) => {
        switch (type) {
            case "confirm": return confirmListeners.current;
            case "cancel": return cancelListeners.current;
        }
    }, []);
    const addListener = useCallback((type: EventType, listener: Listener) => {
        getListeners(type).push(listener);
    }, [getListeners]);
    const removeListener = useCallback((type: EventType, listener: Listener) => {
        const listeners = getListeners(type);
        const index = listeners.indexOf(listener);
        if (index !== -1) listeners.splice(index, 1);
    }, [getListeners]);
    const clearListeners = useCallback((type: EventType) => {
        getListeners(type).length = 0;
    }, [getListeners]);
    const clearAllListeners = useCallback(() => {
        clearListeners("confirm");
        clearListeners("cancel");
    }, [clearListeners]);

    const open = useCallback((modal: Modals) => {
        if (!ref.current) return;
        setActive(modal);
        ref.current.showModal();
    }, []);

    modal.element = ref.current;
    modal.addListener = addListener;
    modal.removeListener = removeListener;
    modal.clearListeners = clearListeners;
    modal.clearAllListeners = clearAllListeners;
    modal.open = open;

    useImperativeHandle(fref, () => modal);

    return (
        <dialog ref={ref} className={styles.root}>
            <div className="row">
                {active && <h1>{i18n.modal[active].title}</h1>}
            </div>
            <div className={styles.content}>
                {active && i18n.modal[active].content}
            </div>
            <div className={styles.buttons}>
                <div className={styles.button} onClick={onConfirm}>
                    <span>{i18n.modal.confirm}</span>
                </div>
                <div className={styles.button} onClick={onCancel}>
                    <span>{i18n.modal.cancel}</span>
                </div>
            </div>
        </dialog>
    )
});

export const modal: Handle = {} as Handle;