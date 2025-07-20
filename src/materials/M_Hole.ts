import { Color } from "three";
import { Maps, useMeshStandardMaterial } from "@utils/useMaterial";

/* Textures - Modify as needed */
const maps: Partial<Maps> = {
};

export default function useMat() {
    /* Create Material - Modify as needed */
    return useMeshStandardMaterial(maps, {
        name: "M_Hole",
        side: 0,
        color: new Color("lightgreen"),
        transparent: true,
        opacity: 0.5,
        depthTest: false,
        depthWrite: false,
    });
}