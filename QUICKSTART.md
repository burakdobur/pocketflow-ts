# Quick Start Guide

Get started with PocketFlow TypeScript in 5 minutes!

## Installation

```bash
npm install pocketflow-ts
# or
yarn add pocketflow-ts
```

## 1. Hello World

Create your first node and flow:

```typescript
import { Node, Flow, SharedStore } from 'pocketflow-ts';

class HelloWorldNode extends Node {
  exec(prepRes: any): string {
    return "Hello, PocketFlow TypeScript!";
  }

  post(shared: SharedStore, prepRes: any, execRes: string): void {
    console.log(execRes);
    shared.greeting = execRes;
  }
}

// Create and run
const node = new HelloWorldNode();
const flow = new Flow(node);
const shared = {};

flow.run(shared);
// Output: Hello, PocketFlow TypeScript!
```

## 2. Sequential Workflow

Chain multiple nodes together:

```typescript
import { Node, Flow, SharedStore, chain } from 'pocketflow-ts';

class InputNode extends Node {
  exec(prepRes: any): string {
    return "raw input";
  }

  post(shared: SharedStore, prepRes: any, execRes: string): void {
    shared.input = execRes;
  }
}

class ProcessNode extends Node {
  prep(shared: SharedStore): string {
    return shared.input;
  }

  exec(input: string): string {
    return `processed: ${input}`;
  }

  post(shared: SharedStore, prepRes: string, execRes: string): void {
    shared.output = execRes;
  }
}

// Chain nodes
const input = new InputNode();
const process = new ProcessNode();
chain(input, process);

// Run workflow
const flow = new Flow(input);
const shared = {};
flow.run(shared);

console.log(shared.output); // "processed: raw input"
```

## 3. Conditional Branching

Create decision-making flows:

```typescript
import { Node, Flow, SharedStore, branch } from 'pocketflow-ts';

class DecisionNode extends Node {
  exec(prepRes: any): string {
    return Math.random() > 0.5 ? "success" : "error";
  }

  post(shared: SharedStore, prepRes: any, execRes: string): string {
    shared.decision = execRes;
    return execRes; // Return action for branching
  }
}

class SuccessNode extends Node {
  exec(prepRes: any): string {
    return "Operation successful!";
  }

  post(shared: SharedStore, prepRes: any, execRes: string): void {
    shared.result = execRes;
  }
}

class ErrorNode extends Node {
  exec(prepRes: any): string {
    return "Operation failed!";
  }

  post(shared: SharedStore, prepRes: any, execRes: string): void {
    shared.result = execRes;
  }
}

// Create branching flow
const decision = new DecisionNode();
const success = new SuccessNode();
const error = new ErrorNode();

branch(decision, "success", success);
branch(decision, "error", error);

// Run flow
const flow = new Flow(decision);
const shared = {};
flow.run(shared);

console.log(`Decision: ${shared.decision}, Result: ${shared.result}`);
```

## 4. Batch Processing

Process multiple items efficiently:

```typescript
import { BatchNode, SharedStore } from 'pocketflow-ts';

class ProcessFilesNode extends BatchNode {
  prep(shared: SharedStore): string[] {
    return ["file1.txt", "file2.txt", "file3.txt"];
  }

  exec(filename: string): string {
    return `processed-${filename}`;
  }

  post(shared: SharedStore, prepRes: string[], execRes: string[]): void {
    shared.results = execRes;
    console.log(`Processed ${execRes.length} files`);
  }
}

// Run batch processing
const batchNode = new ProcessFilesNode();
const shared = {};
batchNode.run(shared);

console.log(shared.results);
// ["processed-file1.txt", "processed-file2.txt", "processed-file3.txt"]
```

## 5. Error Handling and Retries

Build reliable flows with automatic retries:

```typescript
import { Node, SharedStore } from 'pocketflow-ts';

class UnreliableNode extends Node {
  private attempts = 0;

  constructor() {
    super(3, 1); // 3 retries, 1 second wait
  }

  exec(prepRes: any): string {
    this.attempts++;
    if (this.attempts < 3) {
      throw new Error(`Attempt ${this.attempts} failed`);
    }
    return "Success after retries!";
  }

  execFallback(prepRes: any, error: Error): string {
    return "Used fallback after all retries failed";
  }

  post(shared: SharedStore, prepRes: any, execRes: string): void {
    shared.result = execRes;
    shared.totalAttempts = this.attempts;
  }
}

// Test retry logic
const node = new UnreliableNode();
const shared = {};
node.run(shared);

console.log(shared.result); // "Success after retries!"
console.log(shared.totalAttempts); // 3
```

## 6. LLM Integration (with OpenAI)

```typescript
import { Node, Flow, SharedStore } from 'pocketflow-ts';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key'
});

class LLMNode extends Node {
  prep(shared: SharedStore): string {
    return shared.prompt;
  }

  async exec(prompt: string): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
      return "Mock LLM response: This is a simulated answer.";
    }

    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }]
    });

    return response.choices[0]?.message?.content || "No response";
  }

  post(shared: SharedStore, prepRes: string, execRes: string): void {
    shared.answer = execRes;
  }
}

// Note: For async execution, use AsyncNode and AsyncFlow
```

## Next Steps

- **Check out the examples**: Run `npm run example:hello-world`, `npm run example:workflow`, etc.
- **Read the full README**: Learn about advanced features like async flows, parallel processing, and design patterns
- **Explore design patterns**: Implement Agents, RAG systems, Map-Reduce workflows, and more
- **Migration guide**: If coming from Python PocketFlow, check out `MIGRATION.md`

## Common Patterns

### Simple Chain
```typescript
chain(nodeA, nodeB, nodeC);
const flow = new Flow(nodeA);
```

### Branch and Loop
```typescript
branch(decisionNode, "retry", processNode);
branch(processNode, "continue", decisionNode); // Loop back
const flow = new Flow(decisionNode);
```

### Map-Reduce
```typescript
class MapNode extends BatchNode { /* process items */ }
class ReduceNode extends Node { /* combine results */ }

chain(mapNode, reduceNode);
const flow = new Flow(mapNode);
```

Happy coding with PocketFlow TypeScript! 🚀