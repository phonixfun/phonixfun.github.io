import { Environment as Env } from "@react-three/drei";
import useM_Ground from "@materials/M_Ground";

export function Environment() {
    const M_Ground = useM_Ground();
    return (<>
        <Env preset="forest" background backgroundBlurriness={0.25} />
        <mesh rotation-x={-Math.PI * 0.5}>
            <planeGeometry args={[1, 1, 1, 1]} />
            <primitive attach="material" object={M_Ground} />
        </mesh>
        <directionalLight position={[-3, 3, -3]} castShadow />
    </>);
}