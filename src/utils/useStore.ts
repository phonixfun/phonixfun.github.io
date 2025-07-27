import { proxy } from "valtio";
import { useProxy } from "valtio/utils";
import { Theme } from "@utils/Theme";
import { Action, HoleKey } from "@components/Game";
import { RapierRigidBody } from "@react-three/rapier";

export type Scenes = 
    "MainMenu" |
    "ChooseTheme" |
    "ToLandscape" |
    "Game";

export type MainData = {
    theme: Theme | null;
    scene: Scenes;
    player: number;
    action: Action;
    initialized: boolean;
    hoveredHole: HoleKey | null;
    selectedHole: HoleKey | null;
    shells: RapierRigidBody[] | null;
    words: string[];
    word: string | null;
}

export const state = proxy<MainData>({
    theme: null,
    scene: "MainMenu",
    player: 0,
    initialized: false,
    action: "select",
    hoveredHole: null,
    selectedHole: null,
    shells: null,
    words: [],
    word: null,
});

export const useStore = () => useProxy(state);