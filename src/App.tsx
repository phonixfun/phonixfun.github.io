import "@styles/globals.css";
import "@utils/Config";
import { UI } from "@components/UI";
import { LangContextProvider } from "@contexts/LangContext";
import { Game } from "@components/Game";

export default function App() {
    return (
        <LangContextProvider>
            <Game />
            <UI />
        </LangContextProvider>
    );
}