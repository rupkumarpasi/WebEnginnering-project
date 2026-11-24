import { sleep } from './async-utils.js';
import {createRequire} from "node:module";
import { makeCounter } from './closures.js';

const require = createRequire(import.meta.url);
console.log('start');
const {add} = require("./legacy.cjs");
console.log(add(2,3));
await sleep(100); // top-level await works in ESM
console.log('done after 100ms');

