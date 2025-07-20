import { Color, Vector2 } from "three";
import { Maps, useMeshStandardMaterial } from "@utils/useMaterial";

/* Textures - Modify as needed */
const maps: Partial<Maps> = {
    map: ["T_Wood_A.png", { repeat: new Vector2(3, 3) }],
    roughnessMap: ["T_Wood_R.png", { repeat: new Vector2(3, 3) }],
    normalMap: ["T_Wood_N.png", { repeat: new Vector2(3, 3) }],
    aoMap: ["T_Board_AO.png", { channel: 1 }],
};

export default function useMat() {
    /* Create Material - Modify as needed */
    return useMeshStandardMaterial(maps, {
        name: "M_Board",
        side: 0,
        color: new Color("#5a5145"),
        roughness: 1,
        metalness: 0,
        normalScale: new Vector2(1, 1),
        envMapIntensity: 1,
        aoMapIntensity: 3,
    });
}