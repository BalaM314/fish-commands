
const fakeObjectTrap = new Proxy({}, {
	get(target, property){ throw new Error(`Attempted to access property ${String(property)} on fake object`); },
});
export function fakeObject<T>(input:Partial<T>):T {
	Object.setPrototypeOf(input, fakeObjectTrap);
	return input as never;
}
