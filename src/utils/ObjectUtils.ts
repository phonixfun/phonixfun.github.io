export class ObjectUtils {
    static pick<T extends Record<string, any>, K extends keyof T>(object: T, ...props: K[]): Pick<T, K> {
        const pick = {} as Pick<T, K>;
        for (const prop of props) {
            pick[prop] = object[prop];
        }
        return pick;
    }
}