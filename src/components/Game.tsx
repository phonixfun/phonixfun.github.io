import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CameraControls, Line, Plane, Preload, useGLTF } from "@react-three/drei";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Environment } from "./Environment";
import GameBoard from "@meshes/GameBoard";
import Hole, { useHandle as useHole } from "@meshes/Hole";
import { Raycast } from "@utils/Raycast";
import { InstancedRigidBodies, InstancedRigidBodyProps, Physics, RapierRigidBody, RigidBody, useRapier } from "@react-three/rapier";
import { Perf } from "r3f-perf";
import useM_Shell from "@materials/M_Shell";
import { assetPath } from "@utils/Config";
import { CubicBezierCurve3, CurvePath, Group, LineCurve3, MathUtils, Mesh, Vector3 as Vec3 } from "three";
import { ImpulseJoint, Vector3 } from "@dimforge/rapier3d-compat";
import useM_Hole from "@materials/M_Hole";
import { useStore } from "@utils/useStore";
import { easings } from "react-spring";
import CameraControlsImpl from "camera-controls";
import SpeechRecognition, { SpeechRecognitionOptions, useSpeechRecognition } from "react-speech-recognition";
import { hasParam } from "@utils/Params";

export type Action = "select" | "confirm" | "rechoose" | "init" | "move" | "speak" | "speak-steal" | "speak-select" | "end" | "steal-init" | "steal-move" | "steal-end" | "clean-init" | "clean-move" | "clean-end";

/*
TODO:
- Loading screen during physics warmup
*/

export function Game() {
    return (<>
        <Canvas shadows flat gl={{ antialias: true }} dpr={[1, 1.5]}
            camera={{ position: [0, 0.6, 0], fov: 50, near: 0.01, far: 10 }}
            style={{ position: "fixed", width: `100%`, height: `100%`, left: "0px", top: "0px", pointerEvents: "initial" }}
        >
            <OptimizeShaders />
            <Suspense fallback={null}>
                <Initialization />
                {/* <SoftShadows size={10} samples={20} /> */}
                <Environment />
                <Physics gravity={[0, -9.81, 0]}>
                    <Models />
                </Physics>
                <Speech />
                {process.env.NODE_ENV === "development" && <Perf position="bottom-left" deepAnalyze overClock />}
            </Suspense>
            <Controls />
            <Preload all />
        </Canvas>
    </>);
}

function OptimizeShaders() {
    const gl = useThree(state => state.gl);
    gl.debug.checkShaderErrors = process.env.NODE_ENV === "development";
    return null;
}

function Initialization() {
    const store = useStore();
    useEffect(() => {
        if (store.scene === "NewGame") {
            store.scene = "Game";
            return;
        }
        if (store.scene === "Game") {
            store.action = "select";
            store.initialized = false;
            store.player = Math.round(Math.random());
            store.selectedHole = null;
            store.shells = null;
            store.word = null;
            store.result = null;
        }
    }, [store.scene, store]);
    return null;
}

function Controls() {
    const store = useStore();
    const controls = useRef<CameraControlsImpl>(null);

    useEffect(() => {
        if (!controls.current) return;
        if (store.scene === "Game") {
            controls.current.setLookAt(0.01, 0.6, -0.2, 0, 0, 0, true);
        } else {
            controls.current.setLookAt(0.1, 0.3, -0.5, 0, 0, 0.2, true);
        }
    }, [store.scene]);

    if (hasParam("debug")) {
        return (<CameraControls ref={controls} />);
    }

    return (
        <CameraControls ref={controls}
            mouseButtons={{
                left: CameraControlsImpl.ACTION.NONE,
                middle: CameraControlsImpl.ACTION.NONE,
                right: CameraControlsImpl.ACTION.NONE,
                wheel: CameraControlsImpl.ACTION.NONE
            }}
            touches={{
                one: CameraControlsImpl.ACTION.NONE,
                two: CameraControlsImpl.ACTION.NONE,
                three: CameraControlsImpl.ACTION.NONE,
            }}
        />
    );
}

const PLAYER_COUNT = 2;
const BOARD_HEIGHT = 0.035;
const HOLE_COUNT = 7;
const SHELLS_PER_HOLE = 7;
const SHELL_COUNT = PLAYER_COUNT * HOLE_COUNT * SHELLS_PER_HOLE;
const SHELL_SIZE = 0.011015;
const HOLE_SIZE = 0.07;
const HOLE_HEIGHT = 0.05;
const STORE_INDEX = HOLE_COUNT;
const STORE_SIZE = 0.08;

const decomposeIndex = (index: number) => {
    const player = Math.floor(index / HOLE_COUNT / SHELLS_PER_HOLE);
    const hole = Math.floor(index / SHELLS_PER_HOLE) % HOLE_COUNT;
    const shell = index % SHELLS_PER_HOLE;
    return { player, hole, shell };
}

const getNextPlayer = (player: number): number => {
    return (player + 1) % PLAYER_COUNT;
}

const getNextHole = (playingPlayer: number, player: number, hole: number): [player: number, hole: number] => {
    ++hole;
    if (
        // If this player is playing, include the player's store
        (playingPlayer === player && hole > HOLE_COUNT) ||
        // Otherwise, skip the store (we never drop a shell in opponent's store)
        (playingPlayer !== player && hole >= HOLE_COUNT)
    ) {
        ++player;
        player %= PLAYER_COUNT;
        hole = 0;
    }
    return [player, hole];
}

const getPrevHole = (playingPlayer: number, player: number, hole: number): [player: number, hole: number] => {
    --hole;
    if (hole < 0) {
        ++player;
        player %= PLAYER_COUNT;
        hole += HOLE_COUNT;
        // If this player is playing, include the player's store
        if (playingPlayer === player) {
            ++hole;
        }
    }
    return [player, hole];
}

const getOppositeHole = (player: number, hole: number): [player: number, hole: number] => {
    return [
        getNextPlayer(player),
        HOLE_COUNT - 1 - hole
    ];
}

const computeHolePosition = (holeKey: HoleKey): Vec3 => {
    const { player, hole } = holeKey;
    const pos = new Vec3();
    pos.x = (hole * HOLE_SIZE - HOLE_SIZE * (HOLE_COUNT - 1) * 0.5) * (player === 0 ? 1 : -1);
    pos.y = BOARD_HEIGHT - HOLE_HEIGHT * 0.5;
    pos.z = player * HOLE_SIZE - HOLE_SIZE * (PLAYER_COUNT - 1) * 0.5;
    // Store is centered
    if (hole === STORE_INDEX) pos.z = 0;
    return pos;
}

const holeKeys: HoleKey[] = [];
for (let player = 0; player < PLAYER_COUNT; ++player) {
    for (let hole = 0; hole < HOLE_COUNT; ++hole) {
        holeKeys.push({ player, hole });
    }
    // Store
    holeKeys.push({ player, hole: STORE_INDEX });
}

const getHoleKey = (player: number, hole: number) => {
    return holeKeys[player * (HOLE_COUNT + 1) + hole];
}

const holePositions = new Map<HoleKey, Vec3>();
for (let player = 0; player < PLAYER_COUNT; ++player) {
    for (let hole = 0; hole < HOLE_COUNT; ++hole) {
        const key = getHoleKey(player, hole);
        holePositions.set(key, computeHolePosition(key));
    }
    // Store
    const store = getHoleKey(player, STORE_INDEX);
    holePositions.set(store, computeHolePosition(store));
}

const getHolePosition = (player: number, hole: number) => {
    return holePositions.get(getHoleKey(player, hole))!;
}

const initialShellPosition = (index: number) => {
    const { player, hole, shell } = decomposeIndex(index);
    const position = getHolePosition(player, hole).clone();
    position.y += HOLE_HEIGHT * 0.5 + SHELL_SIZE * shell;
    return position;
}

const createShell = (index: number): InstancedRigidBodyProps => {
    const { player, hole, shell } = decomposeIndex(index);
    const key = `${player}-${hole}-${shell}`;
    const position = initialShellPosition(index);
    return ({ key, position });
};

export type HoleKey = {
    player: number;
    hole: number;
}

function Board() {
    return (
        <>
            <RigidBody colliders="trimesh" type="fixed">
                <GameBoard raycast={Raycast.Disabled} castShadow receiveShadow />
            </RigidBody>
            <RigidBody colliders="cuboid" type="fixed" position={[0, 0.001, 0]}>
                <Plane args={[10, 10, 1, 1]} rotation-x={-Math.PI * 0.5}>
                    <meshBasicMaterial colorWrite={false} depthWrite={false} />
                </Plane>
            </RigidBody>
        </>
    );
}

function Models() {
    return (<>
        <Board />
        <Hand animationTime={1} waitingTime={0.2} />
        <Shells />
        <Holes />
    </>);
}

function Shells() {
    const store = useStore();

    const bodies = useRef<RapierRigidBody[]>([]);

    const shell = useGLTF(assetPath("/meshes/Shell.glb"));
    const geom = (shell.nodes[Object.keys(shell.nodes)[1]] as Mesh).geometry;
    const M_Shell = useM_Shell();

    const shells = useMemo(() => Array.from({ length: SHELL_COUNT }).map((_, index) => createShell(index)), []);
    useEffect(() => {
        if (store.scene !== "Game") return;
        if (!bodies.current) return;
        for (let i = 0; i < bodies.current.length; ++i) {
            const position = initialShellPosition(i);
            const translation = new Vector3(position.x, position.y, position.z);
            bodies.current[i].setTranslation(translation, false);
            bodies.current[i].resetForces(false);
            bodies.current[i].resetTorques(false);
            bodies.current[i].wakeUp();
        }
    }, [bodies, store.scene]);

    const getHoleShells = useCallback((player: number, hole: number) => {
        const holePosition = getHolePosition(player, hole);
        const size = hole === STORE_INDEX ? STORE_SIZE : HOLE_SIZE;
        // Get all shells that are in the hole bounds
        const selected: RapierRigidBody[] = [];
        for (const shell of bodies.current) {
            const position = shell.translation();
            if (position.x > holePosition.x - size * 0.5 &&
                position.x < holePosition.x + size * 0.5 &&
                position.z > holePosition.z - size * 0.5 &&
                position.z < holePosition.z + size * 0.5
            ) {
                selected.push(shell);
            }
        }
        return selected;
    }, []);

    const getPlayerShells = useCallback((player: number) => {
        const selected: RapierRigidBody[] = [];
        for (let i = 0; i < HOLE_COUNT; ++i) {
            selected.push(...getHoleShells(player, i));
        }
        return selected;
    }, [getHoleShells]);

    useEffect(() => {
        if (!store.selectedHole) return;
        if (store.player === -1) return;
        const { player, hole } = store.selectedHole;
        const shells = getHoleShells(player, hole);
        store.shells = shells;
    }, [store.selectedHole, getHoleShells, store]);

    useEffect(() => {
        console.log(store.action);
        if (!store.selectedHole) return;
        if (store.action !== "confirm") return;
        const { player, hole } = store.selectedHole;
        const shells = getHoleShells(player, hole);
        if (shells.length === 0) {
            store.action = "rechoose";
        }
    }, [store.selectedHole, store.action, store, getHoleShells]);

    const [, update] = useState({});
    useEffect(() => {
        if (!store.initialized) {
            store.initialized = true;
            update({});
        }
    }, [store.initialized, store, update]);

    useEffect(() => {
        if (!store.action.endsWith("end")) return;
        
        if (store.action === "clean-end") {
            store.result = [
                getHoleShells(0, STORE_INDEX).length,
                getHoleShells(1, STORE_INDEX).length
            ];
            return;
        }
        if (!store.selectedHole) return;
        const { player, hole } = store.selectedHole;

        // 1. End game when someone runs out of shells on their side. Remaining shells go to player's store
        let end = false;
        if (getPlayerShells(0).length === 0) {
            // Player 0's holes are empty, so player 1 gets the remaining shells
            store.player = 1;
            end = true;
        } else if (getPlayerShells(1).length === 0) {
            store.player = 0; // Player 1's holes are empty, so player 0 gets the remaining shells
            end = true;
        }
        if (end) {
            store.action = "clean-init";
            const shells: RapierRigidBody[] = [];
            let foundStart = false;
            for (let i = 0; i < HOLE_COUNT; ++i) {
                const holeShells = getHoleShells(store.player, i);
                if (holeShells.length === 0) continue;
                if (!foundStart) {
                    foundStart = true;
                    store.selectedHole = getHoleKey(store.player, i);
                }
                shells.push(...holeShells);
                // Insert a marker in the form of `null` so that we can make a sweep motion over each hole
                shells.push(null!);
            }
            store.shells = shells;
            return;
        }

        // After steal action, change player (but only if the game didn't end!)
        if (store.action === "steal-end") {
            store.player = getNextPlayer(store.player);
            store.action = "select";
            return;
        }

        // 2. If last is in store, take another turn after speaking a word
        if (hole === STORE_INDEX) {
            store.action = "speak-select";
            return;
        }
        // 3. If last is in non-empty hole: take all from that hole and continue (>1 because we just dropped 1 into the hole)
        const shells = getHoleShells(player, hole);
        if (shells.length > 1) {
            store.shells = shells;
            store.action = "init";
            return;
        }
        // 4. If last is in empty hole on your side: take all from opposite hole after speaking a word. Drop in your store, then change player
        if (player === store.player) {
            store.shells = getHoleShells(...getOppositeHole(player, hole))
            store.action = "steal-init";
            return;
        }
        // 5. If last is in empty hole on opponent side, change player
        store.player = getNextPlayer(store.player);
        store.action = "select";
    }, [getHoleShells, getPlayerShells, store, store.action]);

    return (
        <InstancedRigidBodies instances={shells} ref={bodies} colliders="ball" gravityScale={0.1} mass={0.01} friction={0.001} linearDamping={0.85} angularDamping={0.95} ccd>
            <instancedMesh castShadow receiveShadow
                args={[geom, undefined, SHELL_COUNT]}
                raycast={Raycast.Disabled}
                count={SHELL_COUNT}
                material={M_Shell}
            />
        </InstancedRigidBodies>
    );
}

function Holes() {
    return Array.from({ length: PLAYER_COUNT }).flatMap((_, player) => (
        Array.from({ length: HOLE_COUNT }).map((_, hole) => {
            return <IndicatedHole key={`${player}-${hole}`} player={player} hole={hole} />
        })
    ));
}

function computePaths(from: Vec3, stops: Vec3[], elevation: number): CurvePath<Vec3>[] {
    const [
        p0, p1, p2, p3, dir,
        v0, v1, v2, v3,
    ] = Array.from({ length: 9 }).map(() => new Vec3());

    const paths = Array.from({ length: stops.length }).map(() => new CurvePath<Vec3>());

    p0.copy(from);
    p1.copy(from);
    dir.subVectors(stops[0], from).multiplyScalar(0.25);
    p1.add(dir);
    p1.y += elevation;
    p2.copy(stops[0]);
    p2.sub(dir);
    p2.y += elevation;
    p3.copy(stops[0]);
    p3.y += elevation;

    // First stop
    // 1. Moving up from hole
    dir.multiplyScalar(0.33);
    v0.copy(p0);
    v1.copy(p0);
    v1.y += elevation * 0.33;
    v2.copy(p1);
    v2.sub(dir);
    v3.copy(p1);
    paths[0].add(new CubicBezierCurve3(v0.clone(), v1.clone(), v2.clone(), v3.clone()));

    // 2. Moving horizontally to next holes
    v0.copy(p1);
    v1.copy(p1);
    v1.add(dir);
    v2.copy(p2);
    v2.sub(dir);
    v3.copy(p3);
    paths[0].add(new CubicBezierCurve3(v0.clone(), v1.clone(), v2.clone(), v3.clone()));

    // Move horizontally to next stop
    for (let i = 1; i < stops.length; ++i) {
        v0.copy(stops[i - 1]);
        v0.y += elevation;
        v1.copy(stops[i]);
        v1.y += elevation;
        paths[i].add(new LineCurve3(v0.clone(), v1.clone()));
    }

    return paths;
}

type AnimationData = {
    time: number;
    paths: CurvePath<Vec3>[];
    end: HoleKey;
}
function Hand({ animationTime = 1, waitingTime = 0.2 }: { animationTime?: number, waitingTime?: number }) {
    const store = useStore();
    const shells = useMemo(() => store.action.endsWith("init") ? [...(store.shells ?? [])] : [], [store.action, store.shells]);

    const hand = useRef<RapierRigidBody>(null);

    const { rapier, world } = useRapier();
    const joint = useMemo(() => {
        const anchor1 = new Vector3(0, 0, 0);
        const anchor2 = new Vector3(0, 0, 0);
        return rapier.JointData.rope(SHELL_SIZE * 1.414, anchor1, anchor2);
    }, [rapier]);

    const animationData = useRef<AnimationData>({ paths: [], time: 1, end: { player: 0, hole: 0 } });

    const joints = useRef<ImpulseJoint[]>([]);

    // Create animation path for Hand body, traversing all holes in order for number of shells
    useEffect(() => {
        if (store.action !== "init") return;
        if (!store.selectedHole) return;
        if (!hand.current || !shells) return;

        // Set animation path to next hole
        let { player, hole } = store.selectedHole;
        const from = getHolePosition(player, hole).clone();
        from.y += HOLE_HEIGHT * 0.5;
        const stops: Vec3[] = [];
        for (let i = 0; i < shells.length; ++i) {
            [player, hole] = getNextHole(store.player, player, hole);
            const to = getHolePosition(player, hole).clone();
            to.y += HOLE_HEIGHT * 0.5;
            stops.push(to);
        }
        animationData.current.paths = computePaths(from, stops, HOLE_HEIGHT * 0.5);
        animationData.current.time = 0;
        animationData.current.end = getHoleKey(player, hole);
        hand.current.setTranslation(from, true);
    }, [store.action, store.selectedHole, store.player, shells]);

    // Create animation path for Hand body, from opposite hole to player's store
    useEffect(() => {
        if (store.action !== "steal-init") return;
        if (!store.selectedHole) return;
        if (!hand.current) return;

        let { player, hole } = store.selectedHole;
        const from = getHolePosition(...getOppositeHole(player, hole)).clone();
        from.y += HOLE_HEIGHT * 0.5;
        const to = getHolePosition(player, STORE_INDEX).clone();
        to.y += HOLE_HEIGHT * 0.5;
        animationData.current.paths = computePaths(from, [to], HOLE_HEIGHT * 0.5);
        animationData.current.time = 0;
        animationData.current.end = getHoleKey(player, hole);
        hand.current.setTranslation(from, true);
    }, [store.action, store.selectedHole, store]);

    useEffect(() => {
        if (store.action !== "clean-init") return;
        if (!store.selectedHole) return;
        if (!hand.current || !shells) return;
        if (store.player === -1) return;

        const from = getHolePosition(store.selectedHole.player, store.selectedHole.hole).clone();
        from.y += HOLE_HEIGHT * 0.5;
        const stops: Vec3[] = [];
        for (let i = store.selectedHole.hole; i < HOLE_COUNT; ++i) {
            let [player, hole] = getNextHole(store.player, store.player, i);
            const to = getHolePosition(player, hole).clone();
            to.y += HOLE_HEIGHT * 0.5;
            stops.push(to);
        }
        animationData.current.paths = computePaths(from, stops, HOLE_HEIGHT * 0.5);
        animationData.current.time = 0;
        animationData.current.end = getHoleKey(store.player, STORE_INDEX);
        hand.current.setTranslation(from, true);

        store.player = -1;
    }, [store.action, store.player, shells, store]);

    // Create joints between Hand and shells
    useEffect(() => {
        if (!store.action.endsWith("init")) return;
        if (!store.selectedHole) return;
        if (!hand.current || !shells) return;

        const created = joints.current;
        while (shells.length > 0) {
            const shell = shells.shift();
            if (!shell) break;
            created.push(world.createImpulseJoint(joint, hand.current, shell, true));
        }
    }, [store.action, store.selectedHole, shells, world, joint]);

    useEffect(() => {
        // Speak when taking from hole
        if (store.action === "init") {
            store.action = "speak";
        }
        // Speak when stealing
        else if (store.action === "steal-init") {
            store.action = "speak-steal";
        }
        // Start cleaning
        else if (store.action === "clean-init") {
            store.action = "clean-move";
        }
    }, [store.action, store]);

    // Pick a random word from the list
    useEffect(() => {
        if (store.action.startsWith("speak")) {
            let next = store.word;
            while (next === store.word) {
                next = store.words[Math.floor(Math.random() * store.words.length)];
            }
            store.word = next;
        }
    }, [store.action, store.words, store]);

    // Animate
    useFrame((_, delta) => {
        if (!hand.current) return;
        if (!store.selectedHole) return;
        if (!store.action.endsWith("move")) return;
        if (animationData.current.paths.length === 0) return;

        // Force keep objects awake
        hand.current.wakeUp();
        for (const joint of joints.current) {
            joint.body2().wakeUp();
        }

        // Update time
        let t = animationData.current.time;
        t += delta / animationTime;

        // Reached the next hole
        if (t > 1) {
            const p = animationData.current.paths.shift()!;
            t = -waitingTime;

            // Drop the lowest shell to avoid missed drops
            // due to collisions with other shells in hand
            if (store.action === "move") {
                let lowestIdx = 0;
                let minY = Infinity;
                for (let i = 0; i < joints.current.length; ++i) {
                    const y = joints.current[i].body2().translation().y;
                    if (y < minY) {
                        minY = y;
                        lowestIdx = i;
                    }
                }
                const joint = joints.current.splice(lowestIdx, 1)[0];
                if (joint) world.removeImpulseJoint(joint, true);
            }
            else if (store.action === "steal-move") {
                while (joints.current.length) {
                    world.removeImpulseJoint(joints.current.pop()!, true);
                }
            } else if (store.action === "clean-move") {
                // Drop all at end
                if (animationData.current.paths.length === 0) {
                    while (joints.current.length) {
                        world.removeImpulseJoint(joints.current.pop()!, true);
                    }
                }
                else {
                    // Accumulate shells
                    store.selectedHole = getHoleKey(...getNextHole(store.selectedHole.player, store.selectedHole.player, store.selectedHole.hole));
                    store.action = "clean-init";
                }
            }

            // Finished dropping all shells
            if (animationData.current.paths.length === 0) {
                const position = p.getPointAt(1);
                hand.current.setTranslation(position, true);
                animationData.current.time = 1;

                // End this move
                setTimeout(() => {
                    store.action = store.action.replace("move", "end") as Action;
                    store.word = null;
                    store.selectedHole = animationData.current.end;
                }, waitingTime * 1000);

                return;
            }

            // Speak a word when dropping a shell into store
            let { player: currPlayer, hole: currHole } = animationData.current.end;
            for (let i = 0; i < animationData.current.paths.length; ++i) {
                [currPlayer, currHole] = getPrevHole(store.player, currPlayer, currHole);
            }
            if (currPlayer === store.player && currHole === STORE_INDEX) {
                setTimeout(() => store.action = "speak", waitingTime * 1000);
            }
        }

        // Waiting time
        if (t < 0) {
            animationData.current.time = t;
            return;
        }

        // Move over time to next hole
        const path = animationData.current.paths[0];
        animationData.current.time = t;
        const position = path.getPointAt(easings.easeOutQuad(t));
        hand.current.setTranslation(position, true);
    });

    // DEBUG PATH
    const [, setUpdate] = useState({});
    useEffect(() => {
        setUpdate({});
    }, [setUpdate, store.action]);

    return (
        <>
            <RigidBody ref={hand} type="kinematicPosition">
                <mesh />
            </RigidBody>
            {/* DEBUG PATH */}
            {hasParam("debug") && animationData.current.paths.map((path, index) => <Line key={index} points={path.getPoints(31)} color="#ff0000" />)}
        </>
    );
}

function IndicatedHole({ player, hole, transition = 0.25 }: HoleKey & { transition?: number }) {
    const store = useStore();

    const position = getHolePosition(player, hole).clone();
    position.y = 0;

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
        const active = store.scene === "Game" && store.player === player && !!store.hoveredHole && store.hoveredHole.player === player && store.hoveredHole.hole === hole;
        opacity.current.from = mat.opacity;
        opacity.current.to = active ? 0.5 : 0;
        opacity.current.time = 0;
    }, [player, hole, store.scene, store.player, store.hoveredHole, mat]);

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
                if (store.player !== player) return;
                store.hoveredHole = getHoleKey(player, hole);
            }}
            onPointerLeave={e => {
                store.hoveredHole = null;
            }}
            onPointerUp={e => {
                switch (store.action) {
                    case "select":
                    case "rechoose":
                        if (store.player === player) {
                            store.selectedHole = store.hoveredHole;
                            store.action = "confirm";
                        }
                        break;
                    case "confirm":
                        if (!store.selectedHole) {
                            console.warn("Trying to confirm before select!");
                            store.action = "select";
                            break;
                        }
                        if (store.selectedHole.player === player && store.selectedHole.hole === hole) {
                            store.action = "init";
                        } else {
                            store.selectedHole = store.hoveredHole;
                        }
                        break;
                }
            }}
        />
    );
}

function Speech() {
    const store = useStore();

    // Build fuzzy commands from loaded word list
    const commands = useMemo(() => store.words.map(word => ({
        command: word.toLowerCase(),
        callback: (command) => {
            console.log(`Heard word: ${command}`);
            if (command !== store.word?.toLowerCase()) return;
            store.listening = false;
            switch (store.action) {
                case "speak": store.action = "move"; break;
                case "speak-steal": store.action = "steal-move"; break;
                case "speak-select": store.action = "select"; break;
            }
            SpeechRecognition.stopListening();
        },
        isFuzzyMatch: true,
        fuzzyMatchingThreshold: 0.6,
    })) as SpeechRecognitionOptions["commands"], [store]);

    const { browserSupportsSpeechRecognition, isMicrophoneAvailable, listening, transcript } = useSpeechRecognition({
        commands, transcribing: true
    });

    // Start listening when action is speak
    useEffect(() => {
        if (store.scene !== "Game") return;
        if (store.error !== null) return;
        if (!store.action.startsWith("speak")) return;
        SpeechRecognition.startListening({ language: "en-GB" });
        store.listening = true;
    }, [store.scene, store.error, store.action, store]);

    // Restart if transcript ends before action completion
    useEffect(() => {
        if (!store.word) return;
        store.listening = listening;
        if (listening) return;
        SpeechRecognition.startListening({ language: "en-GB" });
    }, [store.word, store, listening, transcript]);

    // Handle errors (forward to UI)
    if (store.action.startsWith("speak")) {
        if (!browserSupportsSpeechRecognition) {
            store.error = "Unsupported";
        }

        if (!isMicrophoneAvailable) {
            store.error = "Microphone";
        }
    }

    return null;
}