export class PriorityQueue<T> extends Iterator<T> {
  #queue: Array<{ readonly item: T; readonly priority: number }>;

  constructor() {
    super();
    this.#queue = [];
  }

  public enqueue(item: T, priority: number): void {
    this.#queue.push({ item, priority });
    this.#queue.sort((a, b) => a.priority - b.priority); // Min-heap behavior
  }

  public dequeue(): T | undefined {
    return this.#queue.shift()?.item;
  }

  public clear(predicate?: (item: T, priority: number) => boolean) {
    if (!predicate) {
      this.#queue = [];
    } else {
      this.#queue = this.#queue.filter(
        ({ item, priority }) => !predicate(item, priority),
      );
    }
  }

  public next(): IteratorResult<T, undefined> {
    const value = this.dequeue();

    return value ? { value } : { value: undefined, done: true };
  }
}
