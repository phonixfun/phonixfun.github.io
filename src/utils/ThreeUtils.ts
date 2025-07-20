import { Mesh, Object3D } from "three";

export class ThreeUtils {
    static isMesh(object: Object3D): object is Mesh {
        return (object as Mesh).isMesh;
    }
}
