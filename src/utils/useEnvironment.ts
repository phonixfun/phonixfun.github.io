import { useCubeTexture } from "@utils/useCubeTexture";
import { assetPath } from "@utils/Config";

export function useEnvironment(name: string, extension: string = "png") {
    const files = ["px", "nx", "py", "ny", "pz", "nz"];
    for (let i = 0; i < files.length; ++i) files[i] = `${files[i]}.${extension}`;
    const envMap = useCubeTexture(files, { path: assetPath(`/textures/${name}/`) });
    return envMap;
}

useEnvironment.preload = function preload(name: string, extension: string = "png") {
    const files = ["px", "nx", "py", "ny", "pz", "nz"];
    for (let i = 0; i < files.length; ++i) files[i] = `${files[i]}.${extension}`;
    useCubeTexture.preload(files, { path: assetPath(`/textures/${name}/`) });
}