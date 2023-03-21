
export function logg(msg:string){ Call.sendMessage(msg); }
export function list(ar:any[]){ Call.sendMessage(ar.join(' | ')); }
export function keys(obj:Record<string, unknown>){ Call.sendMessage(Object.keys(obj).join(' [scarlet]|[white] ')); }

const storedValues:Record<string, {
  value: any;
  dep: any[];
}> = {};
/**
 * Stores the output of a function and returns that value
 * instead of running the function again unless any
 * dependencies have changed to improve performance with
 * functions that have expensive computation.
 * @param callback function to run if a dependancy has changed
 * @param dep dependency array of values to monitor
 * @param id arbitrary unique id of the function for storage purposes.
 */
export function memoize<T>(callback: () => T, dep:any[], id:number | string){
  if(!storedValues[id]){
    storedValues[id] = { value: callback(), dep };
  } else if(dep.some((d, ind) => d !== storedValues[id].dep[ind])){
    //If the value changed
    storedValues[id].value = callback();
    storedValues[id].dep = dep;
  }
  return storedValues[id].value;
}

/**
 * Returns the amount of time passed since the old time in a readable format.
 */
export function getTimeSinceText(old:number){
  const timePassed = Date.now() - old;

  const hours = Math.floor((timePassed / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor(timePassed / 60000);
  const seconds = Math.floor((timePassed % 60000) / 1000);

  let timeSince = '';
  if(hours) timeSince += `[green]${hours} [lightgray]hrs, `;
  if(minutes) timeSince += `[green]${minutes} [lightgray]mins, `;
  timeSince += `[green]${seconds} [lightgray]secs ago.`;

  return timeSince;
};

export function to2DArray<T>(array:T[], width:number){
  let output:T[][] = [[]];
  array.forEach(el => {
    if(output.at(-1)!.length >= width){
      output.push([]);
    }
    output.at(-1)!.push(el);
  });
  return output;
}

export function getColor(input:string):Color | null {
  try {
    if(input.includes(',')){
      let formattedColor = input.split(',');
      const col = {
        r: Number(formattedColor[0]),
        g: Number(formattedColor[1]),
        b: Number(formattedColor[2]),
        a: 255,
      };
      return new Color(col.r, col.g, col.b, col.a);
    } else if(input.includes('#')) {
      return Color.valueOf(input);
    } else if(input in Color) {
      return Color[input];
    } else {
      return null;
    }
  } catch (e) {
    return null;
  }
}
