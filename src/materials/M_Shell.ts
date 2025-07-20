import { Color, Vector2 } from "three";
import { Maps, useMeshStandardMaterial } from "@utils/useMaterial";

/* Textures - Modify as needed */
const maps: Partial<Maps> = {
    map: "T_Shell_A.png",
    normalMap: "T_Shell_N.png",
};

export default function useMat() {
    /* Create Material - Modify as needed */
    return useMeshStandardMaterial(maps, {
        name: "M_Shell",
        side: 0,
        color: new Color("#ffffff"),
        roughness: 0.2,
        metalness: 0,
        normalScale: new Vector2(0.5, 0.5),
        envMapIntensity: 1,
    });
}