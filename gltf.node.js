#!/usr/bin/env node
const { exec } = require("node:child_process");
const { mkdirSync, readFileSync, writeFileSync, existsSync } = require("node:fs");
const path = require("node:path");
const escape = require("regexp.escape");
const { log, ESeverity, EColors, getFiles } = require("./utils.node.js");

const VERSION = "1.9.3";

const rootDir = "public";
const inputDir = "public/meshes/";
const outputDir = "src/meshes/";

run();
function run() {
    const arg = process.argv[2];
    switch (arg) {
        case "update":
            updateFiles();
            break;
        default:
            const files = arg.split(/,\s*/);
            for (const file of files)
                convertFile(file);
            break;
    }
}

function updateFiles() {
    const meshes = getFiles(outputDir);
    for (const mesh of meshes) {
        if (path.extname(mesh) !== ".tsx") continue;
        const name = path.basename(mesh, ".tsx");
        // Try GLTFJSX Generator Definition file
        let file = `${inputDir}${name}.ggd`;
        if (!existsSync(file)) {
            // Try GLTF mesh file
            file = `${inputDir}${name}.glb`;
        }
        convertFile(file);
    }
}

function convertFile(file) {
    const isDef = path.extname(file) === ".ggd";
    const name = path.basename(file, isDef ? ".ggd" : ".glb");
    const def = isDef ? parseDef(file) : null;
    if (isDef) file = def.source;
    if (!existsSync(file)) {
        log(ESeverity.error, `❌ Cannot find file ${file}`, EColors.red);
        return;
    }
    const gltf = path.join("/meshes/", path.basename(file)).replace(/\\/g, "/");
    const output = `${outputDir}${name}.tsx`;

    mkdirSync(path.dirname(output), { recursive: true });

    const args = [];
    // Input
    args.push(`"${file}"`)
    // Output
    args.push(`-o "${output}"`)
    // Root directory
    args.push(`-r "${rootDir}"`)
    // Config
    // - TypeScript -t
    // - Keep names -k
    // - Shadows    -s
    args.push("-t", "-k", "-s");
    // Precision 7 digits
    args.push("-p 7");

    // ! Instancing is broken
    log(ESeverity.info, `⚫ Attempting to convert ${file} without instances...`, EColors.grey);
    exec(`gltfjsx ${args.join(" ")}`, (err) => {
        if (!err) return handleFile(gltf, def, output);
        log(ESeverity.error, `❌ Failed to parse ${file}\n ${err.message}`, EColors.red);
    });
    // // Try with instances
    // args.push("-i");
    // log(ESeverity.info, `⚪ Attempting to convert ${file} with instances...`, EColors.grey);
    // exec(`gltfjsx ${args.join(" ")}`, (err) => {
    //     if (!err) return handleFile(gltf, def, output);

    //     // Try without instances
    //     args.pop();
    //     log(ESeverity.info, `⚫ Attempting to convert ${file} without instances...`, EColors.grey);
    //     exec(`gltfjsx ${args.join(" ")}`, (err) => {
    //         if (!err) return handleFile(gltf, def, output);
    //         log(ESeverity.error, `❌ Failed to parse ${file}\n ${err.message}`, EColors.red);
    //     });
    // });
}

function parseDef(file) {
    if (!existsSync(file)) {
        log(ESeverity.error, `❌ Cannot find file ${file}`, EColors.red);
        return null;
    }
    const def = {};
    let data = readFileSync(file, { encoding: "utf-8" });
    data = data.replace(new RegExp(/\r/, "g"), "");
    const lines = data.split("\n");
    def.file = file;
    def.source = path.join(inputDir, lines[0]).replace(/\\/g, "/");
    def.map = {};
    const map = new RegExp(/^(.+?)\s*\:\s*(.+?)\s*$/, "");
    for (let i = 1; i < lines.length; ++i) {
        const match = lines[i].match(map);
        if (match === null) continue;
        def.map[match[1]] = match[2];
    }
    return def;
}

function handleFile(gltf, def, output) {
    let data = readFileSync(output, { encoding: "utf-8" });
    if (def !== null) data = handleDef(def, data);
    data = handleGltf(gltf, data);
    writeFileSync(output, data, { encoding: "utf-8" });
    log(ESeverity.log, `✅ Created ${output}`, EColors.green);
}

/**
 * 
 * @param {{file: string; source: string; map: Record<string, string>}} def GLTFJSX Generator definition
 * @param {string} data 
 */
function handleDef(def, data) {
    // Map from definition
    for (let key in def.map) {
        const val = def.map[key];
        data = data
            .replace(
                new RegExp(`(?<=(use)|([\\/ .]))${escape(key)}(?=[: }"(])`, "g"),
                val
            );
    }

    // Handle duplicates
    const materials = data.match(new RegExp(/materials: \{(\s+(.+):.+)+(\s+)\}/, "m"));
    const occurances = materials[0].matchAll(new RegExp(/\s+(.+):.+/, "g"));
    const sorted = [];
    for (const occurance of occurances) {
        sorted.push(occurance);
    }
    sorted.sort((x, y) => y.index - x.index);
    const list = [];
    for (const occurance of sorted) {
        const name = occurance[1];
        if (list.includes(name)) {
            const start = materials.index + occurance.index;
            const end = start + occurance[0].length;
            data = data.substring(0, start) + data.substring(end);
            continue;
        }
        list.push(name);
    }

    // Add definition reference
    data = data
        .replace(
            new RegExp(/\*\//, ""),
            `Definition: ${def.file}\n*/`
        );

    return data;
}

function handleGltf(gltf, data) {
    const hasAnimations = new RegExp(/type ActionName/).test(data);

    // Apply code style
    data = data
        // Double quotes
        .replace(
            new RegExp(/'/, "g"),
            "\""
        )
        // 4-space indentation
        .replace(
            new RegExp(/  /, "g"),
            "    "
        )
        // newline
        .replace(
            new RegExp(/\r\n/, "g"),
            "\n"
        )
        // semicolons
        .replace(
            new RegExp(/(import.+)/, "g"),
            "$1;"
        )
        .replace(
            new RegExp(/(as GLTFResult)/, "g"),
            "$1;"
        )
        .replace(
            new RegExp(/(\))$/, "gm"),
            "$1;"
        );

    // Make export default
    data = data
        .replace(
            `export function`,
            `export default function`
        );

    // Find invalid material names
    const sanitizedMaterials = {};
    if (data.includes(`{materials["`)) {
        const matches = data.matchAll(new RegExp(/\{materials\["(.*?)"\]\}/, "g"));
        for (const match of matches) {
            const sanitized = match[1].replace(
                new RegExp(/[^a-z0-9]/, "gi"),
                "_"
            );
            if (match[1] in sanitizedMaterials) continue;
            // Material should not start with digit
            if (new RegExp(/^[0-9]/).test(sanitized)) sanitizedMaterials[match[1]] = `_${sanitized}`;
            else sanitizedMaterials[match[1]] = sanitized;
        }
    }

    // Use materials
    const materials = getFiles("./src/materials/");
    for (let material of materials) {
        const matName = path.basename(material, ".ts");

        // Sanitize material name
        for (const key in sanitizedMaterials) {
            if (sanitizedMaterials[key].toLowerCase() !== matName.toLowerCase()) continue;
            data = data
                .replace(
                    new RegExp(escape(`{materials["${key}"]}`), "g"),
                    `{materials.${matName}}`
                )
                .replace(
                    new RegExp(escape(`["${key}"]: THREE.`), "g"),
                    `${matName}: THREE.`
                );
            delete sanitizedMaterials[key];
            break;
        }

        if (data.includes(`{materials.${matName}}`)) {
            const matData = readFileSync(material, { encoding: "utf-8" });
            const matType = new RegExp(/return use(\w+)\(maps/).exec(matData)[1];

            const dir = path.dirname(material).substring(path.resolve("./src/materials/").length).replace(/\\/g, "/");
            data = data
                .replace(
                    `import { GLTF } from "three-stdlib";`,
                    `import use${matName} from "@materials${dir}/${matName}";\nimport { GLTF } from "three-stdlib";`
                )
                .replace(
                    new RegExp(`${matName}: THREE.+?Material$`, "m"),
                    `${matName}: THREE.${matType}`
                )
                .replace(
                    `return (`,
                    `materials.${matName} = use${matName}();\n    return (`
                );
        }
    }

    // Warn about non-overridden invalid materials
    if (Object.keys(sanitizedMaterials).length > 0) {
        const msg = `${gltf} contains invalid material names. Use the following sanitized names for material overriding:\n`;
        const list = Object.keys(sanitizedMaterials).map(key => `  ${key} -> ${sanitizedMaterials[key]}`).join("\n");
        log(ESeverity.warn, `${msg}${list}`, EColors.yellow);
    }

    // Info about missing materials overrides
    const allMaterials = {};
    const matches = data.matchAll(new RegExp(/\{materials\.(.+?)\}/, "g"));
    for (const match of matches) {
        if (match[1] in allMaterials) continue;
        allMaterials[match[1]] = false;
        for (let material of materials) {
            const matName = path.basename(material, ".ts");
            if (match[1].toLowerCase() !== matName.toLowerCase()) continue;
            allMaterials[match[1]] = true;
            break;
        }
    }
    for (const key in allMaterials) {
        if (!!allMaterials[key]) delete allMaterials[key];
    }
    if (Object.keys(allMaterials).length > 0) {
        const msg = `${gltf} contains the following materials that don't exist in the current project:\n`;
        const list = Object.keys(allMaterials).map(key => allMaterials[key] ? null : `  ${key}`).filter(x => !!x).join("\n");
        log(ESeverity.info, `${msg}${list}`, EColors.white);
    }

    // Import utils
    data = data
        .replace(
            `import { GLTF } from "three-stdlib";`,
            `import { GLTFJSXUtils } from "@utils/GLTFJSXUtils";\nimport { GLTF } from "three-stdlib";`
        );

    // Optimise Three imports
    // Add Group import for forwardRef
    // Add AnimationAction import for animations handle
    const threeImports = ["Group"];
    if (hasAnimations) threeImports.push("AnimationAction");
    for (let match of data.matchAll(/THREE\.(\w+)/g)) {
        const type = match[1];
        if (threeImports.includes(type)) continue;
        threeImports.push(type);
    }
    data = data
        .replace(
            `import * as THREE from "three";`,
            `import { ${threeImports.join(", ")} } from "three";`
        ).replace(
            new RegExp(/THREE\./, "g"),
            ""
        )
        .replace(
            new RegExp(`(: (${threeImports.join("|")}))$`, "gm"),
            "$1;"
        );

    // Optimise React imports
    // Add forwardRef import
    // Add ForwardedRef, useEffect, useImperativeHandle imports for handle
    const reactImports = ["forwardRef", "ForwardedRef", "useEffect", "useImperativeHandle"];
    for (let match of data.matchAll(/React\.(\w+)/g)) {
        const type = match[1];
        if (reactImports.includes(type)) continue;
        reactImports.push(type);
    }
    data = data
        .replace(
            `import React, { useRef } from "react";`,
            `import { ${reactImports.join(", ")}, useRef } from "react";`
        ).replace(
            new RegExp(/React\./, "g"),
            ""
        );

    // Use forwardRef
    data = data
        .replace(
            `export default function Model(props: JSX.IntrinsicElements["group"]) {`,
            `export default forwardRef<Handle, JSX.IntrinsicElements["group"]>(function Model(props, ref) {`
        )
        .replace(
            new RegExp(/\}\n\nuseGLTF/, "g"),
            `});\n\nuseGLTF`
        )
        .replace(
            `<group {...props} dispose={null}>`,
            `<group ref={group} {...props} dispose={null}>`
        );

    // Handle
    data = data
        .replace(
            new RegExp(/type ContextType = Record[^\n]+\n/, "g"),
            `export type Handle = {\n    root: Group | null;\n    meshes: GLTFResult["nodes"];\n    materials: GLTFResult["materials"];\n${hasAnimations ? `    actions: Record<ActionName, AnimationAction | null>;\n` : ``}};\nexport function useHandle(ref: ForwardedRef<Group>) {\n    const handle = useRef<Handle>(null);\n    useEffect(() => {\n        if (!ref) return;\n        if (typeof ref === "function") ref(handle.current?.root ?? null);\n        else ref.current = handle.current?.root ?? null;\n    }, [handle, ref]);\n    return handle;\n};`
        )
        .replace(
            `return (`,
            `useImperativeHandle(ref, () => GLTFJSXUtils.createHandle<Handle>({ root: group.current${hasAnimations ? ", actions" : ""} }, nodes, materials), [group, nodes, materials${hasAnimations ? ", actions" : ""}]);\n    return (`
        );

    if (!hasAnimations) {
        // Remove animations from GLTFResult
        data = data
            .replace(
                `    animations: GLTFAction[]\n`,
                ``
            );

        // Add ref
        data = data
            .replace(
                `function Model(props, ref) {`,
                `function Model(props, ref) {\n    const group = useRef<Group>(null);`
            );
    } else {
        // Fix ref type
        data = data
            .replace(
                `const group = useRef<Group>();`,
                `const group = useRef<Group>(null);`
            )
    }

    // Use assetPath
    data = data
        .replace(
            new RegExp(`"${gltf}"`, "g"),
            `mesh`
        )
        .replace(
            `import { GLTF } from "three-stdlib";`,
            `import { GLTF } from "three-stdlib";\nimport { assetPath } from "@utils/Config";\n\nconst mesh = assetPath("${gltf}");`
        );

    // Fix preload
    data = data
        .replace(
            "useGLTF.preload(mesh);",
            "useGLTF.preload(mesh, true, true);"
        )

    // Propagate selected properties
    /**
     * @type {(keyof import("three").Mesh)[]}
     */
    const propagatedProperties = [
        "geometry",
        "morphTargetDictionary",
        "morphTargetInfluences"
    ];
    data = data
        .replace(
            new RegExp(`geometry=\{(.+)\.geometry\}`, "g"),
            `{...ObjectUtils.pick($1, ${propagatedProperties.map(prop => `"${prop}"`).join(", ")})}`
        )
        .replace(
            `import { GLTF } from "three-stdlib";`,
            `import { GLTF } from "three-stdlib";\nimport { ObjectUtils } from "@utils/ObjectUtils";`
        );

    // Add optional shadows
    data = data
        .replace(
            new RegExp(`receiveShadow ?|castShadow ?`, "gm"),
            ""
        )
        .replace(
            new RegExp(`(<.*?mesh .*?)( \{\.\.\.)`, "gmi"),
            `$1 receiveShadow={props.receiveShadow} castShadow={props.castShadow}$2`
        );

    // Optimise raycast
    data = data
        .replace(
            new RegExp(`(<.*?mesh .*?)( ?\\/?>)$`, "gmi"),
            `$1 raycast={props.raycast} renderOrder={props.renderOrder} layers={props.layers}$2`
        );

    // Add version
    data = data
        .replace(
            new RegExp(/\*\//, ""),
            `Modified by: Aeroplane GLTFJSX Generator v${VERSION}\n*/`
        );

    return data;
}