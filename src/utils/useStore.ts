import { proxy } from "valtio";
import { useProxy } from "valtio/utils";
import { Theme } from "@utils/Theme";
import { UIs } from "@components/UI";
import { HoleKey } from "@components/Game";

export type MainData = {
    theme: Theme | null;
    ui: UIs;
    player: number;
    hole: HoleKey | null;
}

export const state = proxy<MainData>({
    theme: null,
    ui: "MainMenu",
    player: 0,
    hole: null,
});

export const useStore = () => useProxy(state);