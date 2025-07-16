// TypeScript equivalent of PocketFlow - A 100-line minimalist LLM framework

// Utility function to sleep (equivalent to time.sleep in Python)
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// Utility function to create a new instance preserving methods (equivalent to copy.copy in Python)
const deepClone = <T extends BaseNode>(obj: T | null): T | null => {
  if (!obj) return null;
  // Create a new instance of the same class
  const newObj = Object.create(Object.getPrototypeOf(obj));
  // Copy all properties
  Object.assign(newObj, obj);
  return newObj;
};

// Type definitions
export type SharedStore = Record<string, any>;
export type Params = Record<string, any>;
export type Action = string | null | undefined;

export abstract class BaseNode {
  public params: Params = {};
  public successors: Record<string, BaseNode> = {};

  setParams(params: Params): void {
    this.params = params;
  }

  next(node: BaseNode, action: string = "default"): BaseNode {
    if (action in this.successors) {
      console.warn(`Overwriting successor for action '${action}'`);
    }
    this.successors[action] = node;
    return node;
  }

  prep(shared: SharedStore): any {
    // Override in subclasses
  }

  exec(prepRes: any): any {
    // Override in subclasses
  }

  post(shared: SharedStore, prepRes: any, execRes: any): Action {
    // Override in subclasses - return undefined by default
    return undefined;
  }

  protected _exec(prepRes: any): any {
    return this.exec(prepRes);
  }

  protected _run(shared: SharedStore): Action {
    const p = this.prep(shared);
    const e = this._exec(p);
    return this.post(shared, p, e);
  }

  run(shared: SharedStore): Action {
    if (Object.keys(this.successors).length > 0) {
      console.warn("Node won't run successors. Use Flow.");
    }
    return this._run(shared);
  }

  // Operator overloading equivalent using methods
  rshift(other: BaseNode): BaseNode {
    return this.next(other);
  }

  sub(action: string): ConditionalTransition {
    if (typeof action !== 'string') {
      throw new TypeError("Action must be a string");
    }
    return new ConditionalTransition(this, action);
  }
}

class ConditionalTransition {
  constructor(public src: BaseNode, public action: string) {}

  rshift(tgt: BaseNode): BaseNode {
    return this.src.next(tgt, this.action);
  }
}

export class Node extends BaseNode {
  public maxRetries: number;
  public wait: number;
  public curRetry: number = 0;

  constructor(maxRetries: number = 1, wait: number = 0) {
    super();
    this.maxRetries = maxRetries;
    this.wait = wait;
  }

  execFallback(prepRes: any, exc: Error): any {
    throw exc;
  }

  protected _exec(prepRes: any): any {
    for (this.curRetry = 0; this.curRetry < this.maxRetries; this.curRetry++) {
      try {
        return this.exec(prepRes);
      } catch (e) {
        if (this.curRetry === this.maxRetries - 1) {
          return this.execFallback(prepRes, e as Error);
        }
        if (this.wait > 0) {
          // Use synchronous sleep for regular nodes
          const start = Date.now();
          while (Date.now() - start < this.wait * 1000) {
            // Busy wait for simplicity in sync nodes
          }
        }
      }
    }
  }
}

export class BatchNode extends Node {
  protected _exec(items: any[]): any[] {
    const results: any[] = [];
    for (const item of items || []) {
      results.push(super._exec(item));
    }
    return results;
  }
}

export class Flow extends BaseNode {
  public startNode: BaseNode | null;

  constructor(start: BaseNode | null = null) {
    super();
    this.startNode = start;
  }

  start(start: BaseNode): BaseNode {
    this.startNode = start;
    return start;
  }

  getNextNode(curr: BaseNode, action: Action): BaseNode | null {
    const nxt = curr.successors[action || "default"];
    if (!nxt && Object.keys(curr.successors).length > 0) {
      console.warn(`Flow ends: '${action}' not found in [${Object.keys(curr.successors).map(k => `'${k}'`).join(', ')}]`);
    }
    return nxt || null;
  }

  protected _orch(shared: SharedStore, params: Params = {}): Action {
    let curr = deepClone(this.startNode);
    const p = { ...this.params, ...params };
    let lastAction: Action = null;

    while (curr) {
      curr.setParams(p);
      lastAction = (curr as any)._run(shared);
      curr = deepClone(this.getNextNode(curr, lastAction));
    }
    return lastAction;
  }

  protected _run(shared: SharedStore): Action {
    const p = this.prep(shared);
    const o = this._orch(shared);
    return this.post(shared, p, o);
  }

  post(shared: SharedStore, prepRes: any, execRes: any): Action {
    return execRes;
  }
}

export class BatchFlow extends Flow {
  protected _run(shared: SharedStore): Action {
    const pr = this.prep(shared) || [];
    for (const bp of pr) {
      this._orch(shared, { ...this.params, ...bp });
    }
    return this.post(shared, pr, null);
  }
}

export class AsyncNode extends Node {
  async prepAsync(shared: SharedStore): Promise<any> {
    // Override in subclasses
  }

  async execAsync(prepRes: any): Promise<any> {
    // Override in subclasses
  }

  async execFallbackAsync(prepRes: any, exc: Error): Promise<any> {
    throw exc;
  }

  async postAsync(shared: SharedStore, prepRes: any, execRes: any): Promise<Action> {
    // Override in subclasses - return undefined by default
    return undefined;
  }

  protected async _exec(prepRes: any): Promise<any> {
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        return await this.execAsync(prepRes);
      } catch (e) {
        if (i === this.maxRetries - 1) {
          return await this.execFallbackAsync(prepRes, e as Error);
        }
        if (this.wait > 0) {
          await sleep(this.wait * 1000);
        }
      }
    }
  }

  async runAsync(shared: SharedStore): Promise<Action> {
    if (Object.keys(this.successors).length > 0) {
      console.warn("Node won't run successors. Use AsyncFlow.");
    }
    return await this._runAsync(shared);
  }

  async _runAsync(shared: SharedStore): Promise<Action> {
    const p = await this.prepAsync(shared);
    const e = await this._exec(p);
    return await this.postAsync(shared, p, e);
  }

  protected _run(shared: SharedStore): Action {
    throw new Error("Use runAsync.");
  }
}

export class AsyncBatchNode extends AsyncNode {
  protected async _exec(items: any[]): Promise<any[]> {
    const results: any[] = [];
    for (const item of items) {
      results.push(await super._exec(item));
    }
    return results;
  }
}

export class AsyncParallelBatchNode extends AsyncNode {
  protected async _exec(items: any[]): Promise<any[]> {
    return await Promise.all(items.map(item => super._exec(item)));
  }
}

export class AsyncFlow extends Flow {
  async prepAsync(shared: SharedStore): Promise<any> {
    // Override in subclasses
  }

  async postAsync(shared: SharedStore, prepRes: any, execRes: any): Promise<Action> {
    return execRes;
  }

  protected async _orchAsync(shared: SharedStore, params: Params = {}): Promise<Action> {
    let curr = deepClone(this.startNode);
    const p = { ...this.params, ...params };
    let lastAction: Action = null;

    while (curr) {
      curr.setParams(p);
      if (curr instanceof AsyncNode) {
        lastAction = await curr._runAsync(shared);
      } else {
        lastAction = (curr as any)._run(shared);
      }
      curr = deepClone(this.getNextNode(curr, lastAction));
    }
    return lastAction;
  }

  async _runAsync(shared: SharedStore): Promise<Action> {
    const p = await this.prepAsync(shared);
    const o = await this._orchAsync(shared);
    return await this.postAsync(shared, p, o);
  }
}

export class AsyncBatchFlow extends AsyncFlow {
  async _runAsync(shared: SharedStore): Promise<Action> {
    const pr = await this.prepAsync(shared) || [];
    for (const bp of pr) {
      await this._orchAsync(shared, { ...this.params, ...bp });
    }
    return await this.postAsync(shared, pr, null);
  }
}

export class AsyncParallelBatchFlow extends AsyncFlow {
  async _runAsync(shared: SharedStore): Promise<Action> {
    const pr = await this.prepAsync(shared) || [];
    await Promise.all(pr.map((bp: Params) => this._orchAsync(shared, { ...this.params, ...bp })));
    return await this.postAsync(shared, pr, null);
  }
}

// Convenience functions for chaining nodes (equivalent to >> operator)
export function chain(first: BaseNode, ...rest: BaseNode[]): BaseNode {
  let current = first;
  for (const next of rest) {
    current.rshift(next);
    current = next;
  }
  return first;
}

export function branch(node: BaseNode, action: string, target: BaseNode): BaseNode {
  node.sub(action).rshift(target);
  return node;
}