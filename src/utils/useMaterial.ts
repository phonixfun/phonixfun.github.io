import { DependencyList, useMemo } from "react";
import { Material, MaterialParameters, MeshBasicMaterial, MeshBasicMaterialParameters, MeshLambertMaterial, MeshLambertMaterialParameters, MeshPhongMaterial, MeshPhongMaterialParameters, MeshPhysicalMaterial, MeshPhysicalMaterialParameters, MeshStandardMaterial, MeshStandardMaterialParameters, Texture } from "three";
import { useColorTexture, useTexture } from "@utils/useTexture";
import { TextureConfig } from "@utils/managers/TextureManager";
import { useEnvironment } from "@utils/useEnvironment";

type Config = Partial<Omit<TextureConfig, "colorSpace">>;
type ColorMap = string | [name: string, config?: Config];
type LinearMap = string | [name: string, config?: Config];
type EnvMap = string | [name: string, extension?: string];

type Map = LinearMap | ColorMap | EnvMap;

export type Maps = {
    // ----------
    // Three Maps
    // ----------
    map: ColorMap;
    specularColorMap: ColorMap;
    emissiveMap: ColorMap;
    alphaMap: LinearMap;
    metalnessMap: LinearMap;
    roughnessMap: LinearMap;
    normalMap: LinearMap;
    aoMap: LinearMap;
    transmissionMap: LinearMap;
    envMap: EnvMap;

    // -----------
    // Custom Maps
    // -----------
    mask: LinearMap;
    polarizationMap: LinearMap;
}

const defaultMaps: Maps = {
    // ----------
    // Three Maps
    // ----------
    map: "",
    specularColorMap: "",
    emissiveMap: "",
    alphaMap: "",
    metalnessMap: "",
    roughnessMap: "",
    normalMap: "",
    aoMap: "",
    transmissionMap: "",
    envMap: undefined!,

    // -----------
    // Custom Maps
    // -----------
    mask: "",
    polarizationMap: "",
}

function getName(map: Map) {
    return Array.isArray(map) ? map[0] : map;
}

function getConfig(map: LinearMap | ColorMap) {
    return Array.isArray(map) ? map[1] : {};
}

function getExtension(map: EnvMap) {
    return Array.isArray(map) ? map[1] : "png";
}

export function useMaterial<M extends Material, P extends MaterialParameters>(Material: new (params: P) => M, maps: Partial<Maps>, parameters: Omit<P, keyof Maps>, deps: DependencyList = []): M {
    // ----------
    // Three Maps
    // ----------
    const m: Maps = { ...defaultMaps, ...maps };
    const map = useColorTexture(getName(m.map), getConfig(m.map));
    const specularColorMap = useColorTexture(getName(m.specularColorMap), getConfig(m.specularColorMap));
    const emissiveMap = useColorTexture(getName(m.emissiveMap), getConfig(m.emissiveMap));
    const alphaMap = useTexture(getName(m.alphaMap), getConfig(m.alphaMap));
    const metalnessMap = useTexture(getName(m.metalnessMap), getConfig(m.metalnessMap));
    const roughnessMap = useTexture(getName(m.roughnessMap), getConfig(m.roughnessMap));
    const normalMap = useTexture(getName(m.normalMap), getConfig(m.normalMap));
    const aoMap = useTexture(getName(m.aoMap), getConfig(m.aoMap));
    const transmissionMap = useTexture(getName(m.transmissionMap), getConfig(m.transmissionMap));
    const envMap = m.envMap && useEnvironment(getName(m.envMap), getExtension(m.envMap)); // eslint-disable-line react-hooks/rules-of-hooks

    // -----------
    // Custom Maps
    // -----------
    const mask = useTexture(getName(m.mask), getConfig(m.mask));

    const params = { ...parameters } as P & { [K in keyof Maps]: Texture };
    // ----------
    // Three Maps
    // ----------
    if (map) params.map = map;
    if (specularColorMap) params.specularColorMap = specularColorMap;
    if (emissiveMap) params.emissiveMap = emissiveMap;
    if (alphaMap) params.alphaMap = alphaMap;
    if (metalnessMap) params.metalnessMap = metalnessMap;
    if (roughnessMap) params.roughnessMap = roughnessMap;
    if (normalMap) params.normalMap = normalMap;
    if (aoMap) params.aoMap = aoMap;
    if (transmissionMap) params.transmissionMap = transmissionMap;
    if (envMap) params.envMap = envMap;

    // -----------
    // Custom Maps
    // -----------
    if (mask) params.mask = mask;

    deps = [
        ...deps,

        // ----------
        // Three Maps
        // ----------
        map,
        specularColorMap,
        emissiveMap,
        alphaMap,
        metalnessMap,
        roughnessMap,
        normalMap,
        aoMap,
        transmissionMap,
        envMap,

        // -----------
        // Custom Maps
        // -----------
        mask,
    ];

    const material = useMemo(() => {
        return new Material(params);
    }, deps); // eslint-disable-line react-hooks/exhaustive-deps

    return material;
}

useMaterial.preload = function (maps: Partial<Maps>) {
    maps = { ...defaultMaps, ...maps };
    for (let key in maps) {
        const map = maps[key as keyof Maps];
        if (!map) continue;
        if (key === "envMap") map && useEnvironment.preload(getName(map), getExtension(map as EnvMap)) // eslint-disable-line react-hooks/rules-of-hooks
        else useTexture.preload(getName(map));
    }
}

// ---------------
// Three Materials
// ---------------
export function useMeshBasicMaterial(maps: Partial<Maps>, parameters: Omit<MeshBasicMaterialParameters, keyof Maps>, deps: DependencyList = []) {
    return useMaterial<MeshBasicMaterial, MeshBasicMaterialParameters>(MeshBasicMaterial, maps, parameters, deps);
}

export function useMeshLambertMaterial(maps: Partial<Maps>, parameters: Omit<MeshLambertMaterialParameters, keyof Maps>, deps: DependencyList = []) {
    return useMaterial<MeshLambertMaterial, MeshLambertMaterialParameters>(MeshLambertMaterial, maps, parameters, deps);
}

export function useMeshPhongMaterial(maps: Partial<Maps>, parameters: Omit<MeshPhongMaterialParameters, keyof Maps>, deps: DependencyList = []) {
    return useMaterial<MeshPhongMaterial, MeshPhongMaterialParameters>(MeshPhongMaterial, maps, parameters, deps);
}

export function useMeshStandardMaterial(maps: Partial<Maps>, parameters: Omit<MeshStandardMaterialParameters, keyof Maps>, deps: DependencyList = []) {
    return useMaterial<MeshStandardMaterial, MeshStandardMaterialParameters>(MeshStandardMaterial, maps, parameters, deps);
}

export function useMeshPhysicalMaterial(maps: Partial<Maps>, parameters: Omit<MeshPhysicalMaterialParameters, keyof Maps>, deps: DependencyList = []) {
    return useMaterial<MeshPhysicalMaterial, MeshPhysicalMaterialParameters>(MeshPhysicalMaterial, maps, parameters, deps);
}