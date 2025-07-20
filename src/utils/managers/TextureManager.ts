import { useTexture, useKTX2 } from "@react-three/drei";
import { assetPath } from "@utils/Config";
import { LinearFilter, NoColorSpace, RepeatWrapping, Texture, UVMapping, UnsignedByteType, Vector2, Vector3, Vector4 } from "three";

type Key = Omit<Texture,
    /* Read-only properties */ "id" | "isTexture" | "isRenderTargetTexture" | "isArrayTexture" |
    /* Auto-generated properties */ "uuid" | "image" | "internalFormat" | "matrix" | "version" | "source" | "mipmaps" | "format" |
    /* Unnecessary properties */ "needsUpdate" | "needsPMREMUpdate" | "userData" | "pmremVersion" | "width" | "height" | "depth" | "renderTarget" |
    /* Deprecated properties */ "encoding" |
    /* Methods */ "updateMatrix" | "copy" | "clone" | "toJSON" | "dispose" | "transformUv" | "clone" | "onUpdate" | "updateRanges" | "addUpdateRange" | "clearUpdateRanges" | "setValues" |
    /* Inherited EventDispatcher */ "addEventListener" | "hasEventListener" | "removeEventListener" | "dispatchEvent"
>;

export type TextureConfig = Omit<Key, "name">;

const defaultConfig: TextureConfig = {
    mapping: UVMapping,
    channel: 0,
    wrapS: RepeatWrapping,
    wrapT: RepeatWrapping,
    magFilter: LinearFilter,
    minFilter: LinearFilter,
    anisotropy: 1,
    type: UnsignedByteType,
    matrixAutoUpdate: true,
    offset: new Vector2(0, 0),
    repeat: new Vector2(1, 1),
    center: new Vector2(0, 0),
    rotation: 0,
    generateMipmaps: true,
    premultiplyAlpha: false,
    flipY: false,
    unpackAlignment: 4,
    colorSpace: NoColorSpace,
};

export class TextureManager {
    private static sources: Record<string, Texture> = {};
    public static textures: Map<Key, Texture> = new Map<Key, Texture>();

    private static get(key: Key) {
        function isEqual(val1: any, val2: any) {
            if (typeof val1 !== typeof val2) return false;
            if (val1 === val2) return true;
            if (val1 instanceof Vector2 && val2 instanceof Vector2) return val1.equals(val2);
            if (val1 instanceof Vector3 && val2 instanceof Vector3) return val1.equals(val2);
            if (val1 instanceof Vector4 && val2 instanceof Vector4) return val1.equals(val2);
            if (Array.isArray(val1) && Array.isArray(val2)) {
                if (val1.length !== val2.length) return false;
                for (let i = 0; i < val1.length; ++i) {
                    if (!isEqual(val1[i], val2[i])) return false;
                }
                return true;
            }
            return false;
        }

        for (let [k, v] of TextureManager.textures) {
            let match: boolean = true;
            for (let prop in key) {
                const val1 = key[prop as keyof Key];
                const val2 = k[prop as keyof Key];
                if (isEqual(val1, val2)) continue;
                match = false;
                break;
            }
            if (match) return v;
        }
        return null;
    }

    public static use(source: Texture, config: Partial<TextureConfig> = {}) {
        TextureManager.sources[source.name] = source;

        const c: TextureConfig = { ...defaultConfig, ...config };

        const key: Key = { name: source.name, ...c };
        const tex = TextureManager.get(key);

        if (!tex) {
            const copy = source.clone();
            for (let prop in c) {
                const p = prop as keyof TextureConfig;
                const val = c[p];
                (copy as any)[p] = val;
            }
            copy.needsUpdate = true;
            TextureManager.textures.set(key, copy);
            return copy;
        }
        return tex;
    }
};

export function useManagedTexture(name: string, config: Partial<TextureConfig> = {}) {
    /* eslint-disable-next-line react-hooks/rules-of-hooks */
    const source = /\.ktx2$/i.test(name) ? useKTX2(name, assetPath("/libs/basis/")) : useTexture(name);
    source.name = name;
    return TextureManager.use(source, config);
}