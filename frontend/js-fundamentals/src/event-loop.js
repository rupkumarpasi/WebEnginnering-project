console.log('1 sync start');//1

setTimeout(() => console.log('6 macrotask: setTimeout 0'), 0);
setImmediate(() => console.log('7 macrotask: setImmediate'));

Promise.resolve().then(() => console.log('4 microtask: promise.then'));//4
queueMicrotask(() => console.log('5 microtask: queueMicrotask'));//5
process.nextTick(() => console.log('3 nextTick'));//7

(async () => {
  console.log('2 sync inside async fn (before first await)'); //2
  await null;
  console.log('5b microtask: after await');//6
})();

console.log('2b sync end'); //3