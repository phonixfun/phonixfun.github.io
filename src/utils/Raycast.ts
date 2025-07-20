import { meshBounds } from "@react-three/drei";
import { Intersection, Object3D, Raycaster } from "three";

export enum ERaycastMethod {
    Disabled,
    BoundsOnly,
    Default
}

function disableRaycast() { }

function applyRaycastMethod(object: Object3D, method: ERaycastMethod) {
    if (!object.userData.raycast) object.userData.raycast = object.raycast;
    switch (method) {
        case ERaycastMethod.Disabled:
            object.raycast = disableRaycast;
            break;
        case ERaycastMethod.BoundsOnly:
            object.raycast = meshBounds;
            break;
        case ERaycastMethod.Default:
            if (object.userData.raycast) object.raycast = object.userData.raycast;
            break;
    }
}

export function setRaycastMethod(object: Object3D, method: ERaycastMethod, includeChildren: boolean = true) {
    if (includeChildren) object.traverse((o) => applyRaycastMethod(o, method));
    else applyRaycastMethod(object, method);
}

export type RaycastFunc = (raycaster: Raycaster, intersects: Intersection[]) => void;

/**
 * Raycast functions.
 * Overwrites the default ThreeJS raycast method.
 * 
 * Switching to `Default` at runtime will throw errors, as the raycast method will no longer exist.
 */
export const Raycast: Record<"Disabled" | "BoundsOnly" | "Default", RaycastFunc | undefined> = {
    Disabled: () => {},
    BoundsOnly: meshBounds,
    Default: undefined
}