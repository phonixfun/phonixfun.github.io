import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CameraControls, Plane, Preload, SoftShadows, useGLTF } from "@react-three/drei";
import { forwardRef, Suspense, useEffect, useRef, useState } from "react";
import { Environment } from "./Environment";
import GameBoard from "@meshes/GameBoard";
import Hole, { Handle as HoleHandle, useHandle as useHole } from "@meshes/Hole";
import { Raycast } from "@utils/Raycast";
import { InstancedRigidBodies, InstancedRigidBodyProps, Physics, RapierRigidBody, RigidBody } from "@react-three/rapier";
import { Perf } from "r3f-perf";
import useM_Shell from "@materials/M_Shell";
import { assetPath } from "@utils/Config";
import { Group, InstancedMesh, MathUtils, Mesh } from "three";
import useM_Hole from "@materials/M_Hole";
import { useStore } from "@utils/useStore";
import { easings } from "react-spring";

export function Game() {
    return (<>
        <Canvas shadows flat gl={{ antialias: true }} dpr={[1, 1.5]}
            camera={{ position: [0.01, 0.6, -0.2], fov: 50, near: 0.01, far: 10 }}
            style={{ position: "fixed", width: `100%`, height: `100%`, left: "0px", top: "0px", pointerEvents: "initial" }}
        >
            <OptimizeShaders />
            <Suspense fallback={null}>
                <SoftShadows size={10} samples={20} />
                <Environment />
                <Physics gravity={[0, -9.81, 0]}>
                    <Models />
                </Physics>
                <CameraControls />
                {process.env.NODE_ENV === "development" && <Perf position="bottom-left" deepAnalyze overClock />}
            </Suspense>
            <Preload all />
        </Canvas>
    </>);
}

function OptimizeShaders() {
    const gl = useThree(state => state.gl);
    gl.debug.checkShaderErrors = process.env.NODE_ENV === "development";
    return null;
}

const PLAYER_COUNT = 2;
const HOLE_COUNT = 7;
const SHELLS_PER_HOLE = 7;
const SHELL_COUNT = PLAYER_COUNT * HOLE_COUNT * SHELLS_PER_HOLE;
const HOLE_SIZE = 0.07;

const decomposeIndex = (index: number) => {
    const player = Math.floor(index / HOLE_COUNT / SHELLS_PER_HOLE);
    const hole = Math.floor(index / SHELLS_PER_HOLE) % HOLE_COUNT;
    const shell = index % SHELLS_PER_HOLE;
    return { player, hole, shell };
}

const getPosition = (index: number): [x: number, y: number, z: number] => {
    const { player, hole, shell } = decomposeIndex(index);
    const x = (hole * HOLE_SIZE - HOLE_SIZE * (HOLE_COUNT - 1) * 0.5) * (player === 0 ? 1 : -1);
    const y = 0;
    const z = player * HOLE_SIZE - HOLE_SIZE * (PLAYER_COUNT - 1) * 0.5;
    return [x, y, z];
}

const createShell = (index: number): InstancedRigidBodyProps => {
    const { player, hole, shell } = decomposeIndex(index);
    const key = `${player}-${hole}-${shell}`;
    const position = getPosition(index);
    position[1] += 0.03 + shell * 0.005;
    return ({ key, position });
};

export type HoleKey = {
    player: number;
    hole: number;
}
type HoleValue = HoleHandle | null;

function Models() {
    const store = useStore();

    const ref = useRef<InstancedMesh>(null);
    const api = useRef<RapierRigidBody[]>([]);

    const shell = useGLTF(assetPath("/meshes/Shell.glb"));
    const geom = (shell.nodes[Object.keys(shell.nodes)[1]] as Mesh).geometry;
    const M_Shell = useM_Shell();

    const shells = Array.from({ length: SHELL_COUNT }).map((_, index) => createShell(index));

    return (<>
        <RigidBody colliders="trimesh" type="fixed">
            <GameBoard raycast={Raycast.Disabled} castShadow receiveShadow />
        </RigidBody>
        <RigidBody colliders="cuboid" type="fixed" position={[0, 0.001, 0]}>
            <Plane args={[10, 10, 1, 1]} rotation-x={-Math.PI * 0.5}>
                <meshBasicMaterial colorWrite={false} depthWrite={false} />
            </Plane>
        </RigidBody>
        <InstancedRigidBodies instances={shells} ref={api} colliders="ball" gravityScale={0.1} mass={0.01} friction={0.001}>
            <instancedMesh ref={ref} castShadow receiveShadow args={[geom, undefined, SHELL_COUNT]}
                count={SHELL_COUNT}>
                <primitive attach="material" object={M_Shell} />
            </instancedMesh>
        </InstancedRigidBodies>
        {Array.from({ length: PLAYER_COUNT }).flatMap((_, player) => (
            Array.from({ length: HOLE_COUNT }).map((_, hole) => {
                return <IndicatedHole key={`${player}-${hole}`} player={player} hole={hole} />
            })
        ))}
    </>);
}

function IndicatedHole({ player, hole, transition = 0.25 }: HoleKey & { transition?: number }) {
    const store = useStore();

    const holeIndex = player * HOLE_COUNT + hole;
    const shellIndex = holeIndex * SHELLS_PER_HOLE;
    const position = getPosition(shellIndex);

    const ref = useHole(useRef<Group>(null));
    const mat = useM_Hole();
    useEffect(() => {
        if (!ref.current) return;
        ref.current.meshes.Hole.material = mat;
        ref.current.meshes.Hole.layers.enable(0);
        mat.opacity = 0;
    }, [ref, mat]);

    const opacity = useRef({ from: 1, to: 0, time: 0.999 });
    useEffect(() => {
        const active = !!store.hole && store.hole.player === player && store.hole.hole === hole;
        opacity.current.from = mat.opacity;
        opacity.current.to = active ? 0.5 : 0;
        opacity.current.time = 0;
    }, [player, hole, store.hole, mat]);

    useFrame((_, delta) => {
        let { from, to, time } = opacity.current;
        if (time < 1) {
            time += delta / transition;
            time = Math.max(Math.min(time, 1), 0);
            mat.opacity = MathUtils.lerp(from, to, easings.easeInOutQuad(time));
            opacity.current.time = time;
        }
    });

    return (
        <Hole ref={ref} position={position}
            raycast={Raycast.BoundsOnly} layers={2}
            onPointerEnter={e => {
                store.hole = { player, hole };
            }}
            onPointerLeave={e => {
                store.hole = null;
            }}
        />
    );
}