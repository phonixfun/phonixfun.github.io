import { proxy } from "valtio";
import { useProxy } from "valtio/utils";
import { Theme } from "@utils/Theme";
import { Action, HoleKey } from "@components/Game";
import { RapierRigidBody } from "@react-three/rapier";

export type Scenes =
    "MainMenu" |
    "ChooseTheme" |
    "ToLandscape" |
    "Game" |
    "NewGame";

export type Errors =
    "Unsupported" |
    "Microphone";

export type MainData = {
    theme: Theme | null;
    scene: Scenes;
    error: Errors | null;
    player: number;
    action: Action;
    initialized: boolean;
    hoveredHole: HoleKey | null;
    selectedHole: HoleKey | null;
    shells: RapierRigidBody[] | null;
    words: string[];
    word: string | null;
    listening: boolean;
    result: number[] | null;
}

export const state = proxy<MainData>({
    theme: null,
    scene: "MainMenu",
    error: null,
    player: 0,
    initialized: false,
    action: "select",
    hoveredHole: null,
    selectedHole: null,
    shells: null,
    words: [],
    word: null,
    listening: false,
    result: null,
});

export const useStore = () => useProxy(state);