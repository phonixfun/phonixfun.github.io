import { Bone, Group, Material, Mesh, SkinnedMesh } from "three";
import { ThreeUtils } from "@utils/ThreeUtils";

type Handle = {
    root: Group | null;
    meshes: Record<string, Mesh | SkinnedMesh | Bone>;
    materials: Record<string, Material>;
};
export class GLTFJSXUtils {
    static createHandle<H extends Handle, T extends H["meshes"] = H["meshes"], M extends H["materials"] = H["materials"]>(props: Omit<H, "meshes" | "materials">, nodes: T, materials: M) {
        const handle = { ...props } as H;
        Object.defineProperty(handle, "meshes", {
            get: () => {
                const meshes = {} as T;
                if (!props.root) return meshes;
                props.root.traverse((child) => {
                    if (!ThreeUtils.isMesh(child)) return;
                    for (const key in nodes) {
                        if (child.name !== key) continue;
                        meshes[key] = child as any;
                        break;
                    }
                });
                return meshes;
            }
        });
        handle.materials = materials;
        return handle;
    }
}