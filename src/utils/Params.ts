import { useEffect, useState } from "react";

let params: URLSearchParams | null = null;

export function initParams() {
    params = new URLSearchParams(window.location.search);
}

export function hasParam(name: string) {
    if (!params) initParams();
    return params!.has(name);
}

export function getParam(name: string, dflt: string) {
    if (!params) initParams();
    if (params!.has(name)) return params!.get(name)!.toLowerCase().replace("/", "");
    return dflt;
}

export function useDevParam(name: string, dflt: string) {
    const [val, set] = useState<string | undefined>(undefined);
    useEffect(() => {
        if (process.env.NODE_ENV !== "development") set(dflt);
        else set(getParam(name, dflt));
    }, [name, dflt]);
    return val;
}

export function useParam(name: string, dflt: string) {
    const [val, set] = useState<string | undefined>(undefined);
    useEffect(() => {
        set(getParam(name, dflt));
    }, [name, dflt]);
    return val;
}

export function getBoolParam(name: string, dflt: boolean) {
    const d = dflt ? "true" : " false";
    return getParam(name, d) === "true";
}

export function useDevBoolParam(name: string) {
    const [has, set] = useState<boolean | undefined>(undefined);
    useEffect(() => {
        if (process.env.NODE_ENV !== "development") set(false);
        else set(hasParam(name));
    }, [name]);
    return has;
}

export function useBoolParam(name: string) {
    const [has, set] = useState<boolean | undefined>(undefined);
    useEffect(() => {
        set(hasParam(name));
    }, [name]);
    return has;
}