export default function timer(name: string) {
    return (func: Function) => {
        return function wraps(...args) {
            let startTime: number = new Date().getTime();
            let result = func.apply(this, args);
            let elapsed: number = new Date().getTime() - startTime;
            console.log(`${name} took ${elapsed} ms`);
            return result;
        }
    }
}
