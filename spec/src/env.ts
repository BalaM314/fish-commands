
class Pattern {
  private constructor(public string:string){}
  regex = new RegExp(this.string);
  static compile(regex:string){
    return new this(`^${regex}$`);
  }
  static matches(regex:string, target:string):boolean {
    return new RegExp(`^${regex}$`).test(target);
  }
  matcher(text:string){
    return {
      replaceAll: (replacement:string) => {
        return text.replaceAll(this.regex, replacement);
      },
      matches: () => {
        return this.regex.test(text);
      },
      group: () => {
        throw new Error("not implemented");
      }
    }
  }
}

class ObjectIntMap<K> {
  map = new Map<K, number>;
  get(key:K){ return this.map.get(key); }
  set(key:K, value:number){ return this.map.set(key, value); }
  get size(){ return this.map.size; }
  clear(){ this.map.clear(); }
	put(key:K, value:number){ this.map.set(key, value); }
	increment(key:K){
    this.map.set(key, (this.map.get(key) ?? 0) + 1);
  }
	entries(){
    const entries = this.map.entries();
    return Object.assign(entries, {
      toArray(){
        return new Seq([...entries].map(e => ({ key: e[0], value: e[1] })));
      }
    });
  }
}

class Seq<T> {
  constructor(public items:T[]){}
}

class Fi {
  constructor(public path:string){}
  exists(){
    return false;
  }
}

Object.assign(globalThis, {Pattern, ObjectIntMap, Seq, Fi});
