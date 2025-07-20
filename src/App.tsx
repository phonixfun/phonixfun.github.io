import "@styles/globals.css";
import "@utils/Config";
import { useStore } from "@utils/useStore";
import { UI } from "@components/UI";
import { LangContextProvider } from "@contexts/LangContext";
import { Game } from "@components/Game";

export default function App() {
    const store = useStore();

    return (
        <LangContextProvider>
            <Game />
            <UI />
        </LangContextProvider>
    );
}