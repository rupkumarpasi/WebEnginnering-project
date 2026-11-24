1. Predicted order
My prediction before running the code was:
1. sync start
2. sync inside async fn (before first await)
3. sync end
4. process.nextTick
5. Promise.then
6. queueMicrotask
7. after await
8. setTimeout(0) / setImmediate() (I expected these to run after
   the microtasks.)
2. Actual execution order
The code runs as an ES module because the project has "type": "module"
in package.json.

The reliable order for the synchronous statements and microtasks in this
ES module example is:
1. 1 sync start
2. 2 sync inside async fn (before first await)
3. 2b sync end
4. 4 microtask: promise.then
5. 5 microtask: queueMicrotask
6. 5b microtask: after await
7. 3 nextTick
After that, the two event-loop callbacks run:
- 6 macrotask: setTimeout 0
- 7 macrotask: setImmediate
Important: At top level, do not assume a fixed order between
setTimeout(..., 0) and setImmediate(). Their relative order can vary
with the Node.js version and runtime conditions. Record the order
printed by your own run here:
Paste your actual setTimeout / setImmediate order here.
3. Why is process.nextTick() after the Promise microtasks here?
In CommonJS, process.nextTick() callbacks normally run before Promise
and queueMicrotask() callbacks after the current JavaScript operation.

This example is an ES module. Node.js evaluates ES modules through its
Promise-based module job. The Promise microtasks queued during that
evaluation are processed before Node gets to drain the
process.nextTick() queue. That is why Promise.then(),
queueMicrotask(), and the continuation after await appear before
process.nextTick() in this example.
4. Key takeaways
- Synchronous code runs first.
- An async function runs synchronously until it reaches its first
  await.
- await schedules the rest of the async function as a microtask.
- Promise.then() and queueMicrotask() callbacks are microtasks.
- The observed ordering of process.nextTick() and Promise microtasks
  can differ between CommonJS and ES modules.
- setTimeout(0) and setImmediate() are event-loop callbacks; their
  top-level relative order should not be treated as guaranteed.
5. What I learned
The important lesson is that execution order depends not only on whether
a callback is synchronous, a microtask, or an event-loop callback, but
also on the Node.js module system. Since this project uses ES modules, I
should not apply the CommonJS process.nextTick() ordering rule
blindly.