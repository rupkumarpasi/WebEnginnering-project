export class TaskQueue {
  #items = [];
  static #created = 0;

  constructor(name) { this.name = name; TaskQueue.#created++; }
  static get created() { return TaskQueue.#created; }

  push(task) { this.#items.push(task); return this; }
  get size() { return this.#items.length; }

  async runAll() {
    const results = [];
    for (const task of this.#items) results.push(await task());
    this.#items = [];
    return results;
  }
}