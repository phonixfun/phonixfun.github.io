import { useGLTF } from "@react-three/drei";

// Support Draco (without CDN)
useGLTF.setDecoderPath(assetPath("/libs/draco/"));

export function assetPath(asset: string): string {
    let root = process.env.PUBLIC_URL!;
    const trailing = root.endsWith("/") || root.endsWith("\\");
    if (trailing) root = root.slice(0, -1);
    const leading = asset.startsWith("/") || asset.startsWith("\\");
    if (!leading) asset = `/${asset}`;
    return `${root}${asset}`;
}

export function publicUrl(): string {
    return process.env.PUBLIC_URL!;
}