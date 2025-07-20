import { useTexture as useTex } from "@react-three/drei";
import { assetPath } from "@utils/Config";
import { TextureConfig, useManagedTexture } from "@utils/managers/TextureManager";
import { SRGBColorSpace } from "three";

export function useTexture(name: string, config: Partial<TextureConfig> = {}) {
    const valid = !!name;
    if (!valid) name = "white.png";
    const tex = useManagedTexture(assetPath(`/textures/${name}`), config);
    return valid ? tex : null;
}

export function useColorTexture(name: string, config: Partial<Omit<TextureConfig, "colorSpace">> = {}) {
    return useTexture(name, { colorSpace: SRGBColorSpace, ...config });
}

useTexture.preload = function preload(name: string) {
    if (!name) return;
    const path = assetPath(`/textures/${name}`);
    
    // Don't preload KTX2 textures. 
    // They have a dependency on the Renderer for runtime support checking
    // and therefore can't load before the Canvas exists.
    if (/\.ktx2$/i.test(name)) return;

    useTex.preload(path);
}