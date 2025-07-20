import { Maps, useMeshBasicMaterial } from "@utils/useMaterial";

/* Textures - Modify as needed */
const maps: Partial<Maps> = {
    map: "T_Ground_A.png"
};

export default function useMat() {
    /* Create Material - Modify as needed */
    return useMeshBasicMaterial(maps, {
        name: "M_Ground",
        side: 0,
        transparent: true,
    });
}