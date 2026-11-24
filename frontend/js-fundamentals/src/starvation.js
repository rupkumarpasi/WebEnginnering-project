let n = 0;
setTimeout(() => console.log('timer never fires while microtasks recurse'), 0);
function spin() { if (n++ < 1e5) queueMicrotask(spin); else console.log('microtasks done'); }
spin();