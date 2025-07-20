import { HDRCubeTextureLoader } from 'three/examples/jsm/Addons';
import { CubeTextureLoader, CubeTexture } from 'three';
import { useLoader } from '@react-three/fiber';

type Options = {
    path: string;
};

function useCubeTexture(files: string[], {
    path
}: Options): CubeTexture {
    const Loader = /\.hdr$/i.test(files[0]) ? HDRCubeTextureLoader : CubeTextureLoader;
    // @ts-ignore
    const [cubeTexture] = useLoader(
        // @ts-ignore
        Loader, [files], loader => loader.setPath(path));
    return cubeTexture;
}
useCubeTexture.preload = (files: string[], {
    path
}: Options) => {
    const Loader = /\.hdr$/i.test(files[0]) ? HDRCubeTextureLoader : CubeTextureLoader;
    return useLoader.preload(
        // @ts-ignore
        Loader, [files], loader => loader.setPath(path)
    );
};

export { useCubeTexture };