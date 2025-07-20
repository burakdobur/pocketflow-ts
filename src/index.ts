// PocketFlow TypeScript - Minimalist LLM Framework
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
const deepClone = <T extends BaseNode>(obj: T | null): T | null => obj ? Object.assign(Object.create(Object.getPrototypeOf(obj)), obj) : null;

export type SharedStore = Record<string, any>;
export type Params = Record<string, any>;
export type Action = string | null | undefined;

export abstract class BaseNode {
  public params: Params = {};
  public successors: Record<string, BaseNode> = {};

  setParams(params: Params): void { this.params = params; }
  next(node: BaseNode, action: string = "default"): BaseNode { 
    if (action in this.successors) console.warn(`Overwriting successor for action '${action}'`);
    this.successors[action] = node; return node; 
  }
  prep(shared: SharedStore): any { /* Override */ }
  exec(prepRes: any): any { /* Override */ }
  post(shared: SharedStore, prepRes: any, execRes: any): Action { return undefined; }
  protected _exec(prepRes: any): any { return this.exec(prepRes); }
  protected _run(shared: SharedStore): Action { return this.post(shared, this.prep(shared), this._exec(this.prep(shared))); }
  run(shared: SharedStore): Action { 
    if (Object.keys(this.successors).length > 0) console.warn("Node won't run successors. Use Flow.");
    return this._run(shared); 
  }
  connectTo(other: BaseNode): BaseNode { return this.next(other); }
  onAction(action: string): ConditionalTransition { 
    if (typeof action !== 'string') throw new TypeError("Action must be a string");
    return new ConditionalTransition(this, action); 
  }
}

class ConditionalTransition {
  constructor(public src: BaseNode, public action: string) {}
  connectTo(tgt: BaseNode): BaseNode { return this.src.next(tgt, this.action); }
}

export class Node extends BaseNode {
  constructor(public maxRetries: number = 1, public wait: number = 0) { super(); }
  execFallback(prepRes: any, exc: Error): any { throw exc; }
  protected _exec(prepRes: any): any {
    for (this.curRetry = 0; this.curRetry < this.maxRetries; this.curRetry++) {
      try { return this.exec(prepRes); } catch (e) {
        if (this.curRetry === this.maxRetries - 1) return this.execFallback(prepRes, e as Error);
        if (this.wait > 0) { const start = Date.now(); while (Date.now() - start < this.wait * 1000); }
      }
    }
  }
  protected _run(shared: SharedStore): Action { return this.post(shared, this.prep(shared), this._exec(this.prep(shared))); }
  public curRetry: number = 0;
}

export class BatchNode extends Node {
  protected _exec(items: any[]): any[] { return (items || []).map(item => super._exec(item)); }
}

export class Flow extends BaseNode {
  constructor(public startNode: BaseNode | null = null) { super(); }
  start(start: BaseNode): BaseNode { this.startNode = start; return start; }
  async runAsync(shared: SharedStore): Promise<any> { 
    return typeof (this as any)._runAsync === "function" ? (this as any)._runAsync(shared) : Promise.reject(new Error("runAsync not implemented.")); 
  }
  getNextNode(curr: BaseNode, action: Action): BaseNode | null {
    const nxt = curr.successors[action || "default"];
    if (!nxt && Object.keys(curr.successors).length > 0) console.warn(`Flow ends: '${action}' not found in [${Object.keys(curr.successors).map(k => `'${k}'`).join(', ')}]`);
    return nxt || null;
  }
  protected _orch(shared: SharedStore, params: Params = {}): Action {
    let curr = deepClone(this.startNode), p = { ...this.params, ...params }, lastAction: Action = null;
    while (curr) { curr.setParams(p); lastAction = (curr as any)._run(shared); curr = deepClone(this.getNextNode(curr, lastAction)); }
    return lastAction;
  }
  protected _run(shared: SharedStore): Action { return this.post(shared, this.prep(shared), this._orch(shared)); }
  post(shared: SharedStore, prepRes: any, execRes: any): Action { return execRes; }
}

export class BatchFlow extends Flow {
  protected _run(shared: SharedStore): Action { 
    const pr = this.prep(shared) || []; 
    for (const bp of pr) this._orch(shared, { ...this.params, ...bp }); 
    return this.post(shared, pr, null); 
  }
}

export class AsyncNode extends Node {
  async prepAsync(shared: SharedStore): Promise<any> { /* Override */ }
  async execAsync(prepRes: any): Promise<any> { /* Override */ }
  async execFallbackAsync(prepRes: any, exc: Error): Promise<any> { throw exc; }
  async postAsync(shared: SharedStore, prepRes: any, execRes: any): Promise<Action> { return undefined; }
  protected async _exec(prepRes: any): Promise<any> {
    for (let i = 0; i < this.maxRetries; i++) {
      try { return await this.execAsync(prepRes); } catch (e) {
        if (i === this.maxRetries - 1) return await this.execFallbackAsync(prepRes, e as Error);
        if (this.wait > 0) await sleep(this.wait * 1000);
      }
    }
  }
  async runAsync(shared: SharedStore): Promise<Action> { 
    if (Object.keys(this.successors).length > 0) console.warn("Node won't run successors. Use AsyncFlow.");
    return await this._runAsync(shared); 
  }
  async _runAsync(shared: SharedStore): Promise<Action> { return await this.postAsync(shared, await this.prepAsync(shared), await this._exec(await this.prepAsync(shared))); }
  protected _run(shared: SharedStore): Action { throw new Error("Use runAsync."); }
}

export class AsyncBatchNode extends AsyncNode {
  protected async _exec(items: any[]): Promise<any[]> { return Promise.all((items || []).map(item => super._exec(item))); }
}

export class AsyncParallelBatchNode extends AsyncNode {
  protected async _exec(items: any[]): Promise<any[]> { return Promise.all(items.map(item => super._exec(item))); }
}

export class AsyncFlow extends Flow {
  async prepAsync(shared: SharedStore): Promise<any> { /* Override */ }
  async postAsync(shared: SharedStore, prepRes: any, execRes: any): Promise<Action> { return execRes; }
  protected async _orchAsync(shared: SharedStore, params: Params = {}): Promise<Action> {
    let curr = deepClone(this.startNode), p = { ...this.params, ...params }, lastAction: Action = null;
    while (curr) { 
      curr.setParams(p); 
      lastAction = curr instanceof AsyncNode ? await curr._runAsync(shared) : (curr as any)._run(shared);
      curr = deepClone(this.getNextNode(curr, lastAction)); 
    }
    return lastAction;
  }
  async _runAsync(shared: SharedStore): Promise<Action> { return await this.postAsync(shared, await this.prepAsync(shared), await this._orchAsync(shared)); }
}

export class AsyncBatchFlow extends AsyncFlow {
  async _runAsync(shared: SharedStore): Promise<Action> { 
    const pr = await this.prepAsync(shared) || []; 
    for (const bp of pr) await this._orchAsync(shared, { ...this.params, ...bp }); 
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

export function chain(first: BaseNode, ...rest: BaseNode[]): BaseNode { 
  let current = first; for (const next of rest) { current.connectTo(next); current = next; } return first; 
}
export function branch(node: BaseNode, action: string, target: BaseNode): BaseNode { 
  node.onAction(action).connectTo(target); return node; 
}