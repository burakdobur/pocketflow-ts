import { Node, Flow, BatchNode, SharedStore, chain, branch } from '../src/index';

// Extended SharedStore interface for tests
interface TestSharedStore extends SharedStore {
  result?: string;
  output?: string;
  action?: string;
  results?: string[];
  input?: string;
  decision?: string;
  attempts?: number;
  totalAttempts?: number;
  items?: string[];
}

// Mock test nodes
class TestNode extends Node {
  exec(prepRes: any): string {
    return `processed: ${prepRes}`;
  }

  post(shared: TestSharedStore, prepRes: any, execRes: string): undefined {
    shared.result = execRes;
    return undefined;
  }
}

class TestPrepNode extends Node {
  prep(shared: TestSharedStore): string {
    return shared.input || '';
  }

  exec(prepRes: string): string {
    return `exec: ${prepRes}`;
  }

  post(shared: TestSharedStore, prepRes: string, execRes: string): undefined {
    shared.output = execRes;
    return undefined;
  }
}

class TestActionNode extends Node {
  exec(prepRes: any): string {
    return 'test-action';
  }

  post(shared: TestSharedStore, prepRes: any, execRes: string): string {
    shared.action = execRes;
    return execRes;
  }
}

class TestBatchNode extends BatchNode {
  prep(shared: TestSharedStore): string[] {
    return shared.items || [];
  }

  exec(item: string): string {
    return `processed-${item}`;
  }

  post(shared: TestSharedStore, prepRes: string[], execRes: string[]): undefined {
    shared.results = execRes;
    return undefined;
  }
}

describe('PocketFlow TypeScript', () => {
  describe('Node', () => {
    it('should execute basic node logic', () => {
      const node = new TestNode();
      const shared: TestSharedStore = {};
      
      const action = node.run(shared);
      
      expect(shared).toHaveProperty('result', 'processed: undefined');
      expect(action).toBeUndefined();
    });

    it('should handle prep-exec-post cycle', () => {
      const node = new TestPrepNode();
      const shared: TestSharedStore = { input: 'test-input' };
      
      node.run(shared);
      
      expect(shared.output).toBe('exec: test-input');
    });

    it('should handle retry logic', () => {
      class FailingNode extends Node {
        private attempts = 0;

        constructor() {
          super(3, 0); // 3 retries, no wait
        }

        exec(prepRes: any): string {
          this.attempts++;
          if (this.attempts < 3) {
            throw new Error('Test failure');
          }
          return 'success';
        }

        post(shared: TestSharedStore, prepRes: any, execRes: string): undefined {
          shared.result = execRes;
          shared.attempts = this.attempts;
          return undefined;
        }
      }

      const node = new FailingNode();
      const shared: TestSharedStore = {};
      
      node.run(shared);
      
      expect(shared).toHaveProperty('result', 'success');
      expect(shared).toHaveProperty('attempts', 3);
    });

    it('should handle fallback logic', () => {
      class FailingNodeWithFallback extends Node {
        constructor() {
          super(2, 0); // 2 retries, no wait
        }

        exec(prepRes: any): string {
          throw new Error('Always fails');
        }

        execFallback(prepRes: any, error: Error): string {
          return 'fallback-result';
        }

        post(shared: TestSharedStore, prepRes: any, execRes: string): undefined {
          shared.result = execRes;
          return undefined;
        }
      }

      const node = new FailingNodeWithFallback();
      const shared: TestSharedStore = {};
      
      node.run(shared);
      
      expect(shared).toHaveProperty('result', 'fallback-result');
    });
  });

  describe('Flow', () => {
    it('should execute single node flow', () => {
      const node = new TestNode();
      const flow = new Flow(node);
      const shared: TestSharedStore = {};
      
      flow.run(shared);
      
      expect(shared).toHaveProperty('result', 'processed: undefined');
    });

    it('should execute sequential flow', () => {
      const node1 = new TestPrepNode();
      const node2 = new TestNode();
      
      chain(node1, node2);
      
      const flow = new Flow(node1);
      const shared: TestSharedStore = { input: 'test' };
      
      flow.run(shared);
      
      expect(shared.output).toBe('exec: test');
      expect(shared.result).toBe('processed: undefined');
    });

    it('should handle conditional branching', () => {
      const decisionNode = new TestActionNode();
      const actionNode = new TestNode();
      
      branch(decisionNode, 'test-action', actionNode);
      
      const flow = new Flow(decisionNode);
      const shared: TestSharedStore = {};
      
      flow.run(shared);
      
      expect(shared.action).toBe('test-action');
      expect(shared.result).toBe('processed: undefined');
    });

    it('should handle flow ending when no successor found', () => {
      const decisionNode = new TestActionNode();
      const actionNode = new TestNode();
      
      // Connect to different action
      branch(decisionNode, 'different-action', actionNode);
      
      const flow = new Flow(decisionNode);
      const shared: TestSharedStore = {};
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      flow.run(shared);
      
      expect(shared.action).toBe('test-action');
      expect(shared).not.toHaveProperty('result');
      expect(consoleSpy).toHaveBeenCalledWith(
        "Flow ends: 'test-action' not found in ['different-action']"
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('BatchNode', () => {
    it('should process multiple items', () => {
      const batchNode = new TestBatchNode();
      const shared: TestSharedStore = { items: ['item1', 'item2', 'item3'] };
      
      batchNode.run(shared);
      
      expect(shared.results).toEqual([
        'processed-item1',
        'processed-item2', 
        'processed-item3'
      ]);
    });

    it('should handle empty items', () => {
      const batchNode = new TestBatchNode();
      const shared: TestSharedStore = { items: [] };
      
      batchNode.run(shared);
      
      expect(shared.results).toEqual([]);
    });
  });

  describe('Helper Functions', () => {
    it('should chain nodes correctly', () => {
      const node1 = new TestNode();
      const node2 = new TestNode();
      const node3 = new TestNode();
      
      chain(node1, node2, node3);
      
      expect(node1.successors.default).toBe(node2);
      expect(node2.successors.default).toBe(node3);
      expect(Object.keys(node3.successors)).toHaveLength(0);
    });

    it('should branch nodes correctly', () => {
      const sourceNode = new TestNode();
      const targetNode = new TestNode();
      
      branch(sourceNode, 'custom-action', targetNode);
      
      expect(sourceNode.successors['custom-action']).toBe(targetNode);
    });
  });

  describe('Node Methods', () => {
    it('should use rshift method for chaining', () => {
      const node1 = new TestNode();
      const node2 = new TestNode();
      
      node1.rshift(node2);
      
      expect(node1.successors.default).toBe(node2);
    });

    it('should use sub method for conditional transitions', () => {
      const node1 = new TestNode();
      const node2 = new TestNode();
      
      node1.sub('custom').rshift(node2);
      
      expect(node1.successors.custom).toBe(node2);
    });

    it('should throw error for non-string action in sub', () => {
      const node = new TestNode();
      
      expect(() => {
        (node as any).sub(123);
      }).toThrow('Action must be a string');
    });
  });

  describe('Params', () => {
    it('should set and use params', () => {
      class ParamNode extends Node {
        prep(shared: SharedStore): any {
          return this.params.testParam;
        }

        exec(prepRes: any): string {
          return `param: ${prepRes}`;
        }

        post(shared: TestSharedStore, prepRes: any, execRes: string): undefined {
          shared.result = execRes;
          return undefined;
        }
      }

      const node = new ParamNode();
      node.setParams({ testParam: 'test-value' });
      
      const shared: TestSharedStore = {};
      node.run(shared);
      
      expect(shared).toHaveProperty('result', 'param: test-value');
    });
  });
});