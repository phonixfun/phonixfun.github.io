import { Environment as Env, Plane } from "@react-three/drei";
import useM_Ground from "@materials/M_Ground";
import { Raycast } from "@utils/Raycast";

export function Environment() {
    const M_Ground = useM_Ground();
    return (<>
        <Env preset="forest" background backgroundBlurriness={0.25} />
        <Plane args={[1, 1, 1, 1]} rotation-x={-Math.PI * 0.5} material={M_Ground} raycast={Raycast.Disabled} />
        <directionalLight position={[-3, 3, -3]} castShadow />
    </>);
}