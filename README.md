# PocketFlow TypeScript

A TypeScript/Node.js port of [PocketFlow](https://github.com/The-Pocket/PocketFlow) - a 100-line minimalist LLM framework for Agents, Task Decomposition, RAG, and more.

## Features

- **🪶 Lightweight**: Core framework in ~200 lines of TypeScript
- **🔗 Zero Dependencies**: No external dependencies for the core framework
- **🎯 Type-Safe**: Full TypeScript support with comprehensive type definitions
- **🚀 Expressive**: Build Agents, Workflows, RAG systems, and more
- **🔄 Async/Await**: Native async support for Node.js
- **🔁 Retry Logic**: Built-in retry mechanisms with exponential backoff
- **📦 Batch Processing**: Handle multiple items efficiently
- **🌊 Flow Control**: Conditional branching and looping

## Installation

```bash
npm install pocketflow-ts
# or
yarn add pocketflow-ts
```

Or copy the source code from `src/index.ts` (it's just ~200 lines!).

## Quick Start

### 1. Hello World

```typescript
import { Node, Flow, SharedStore } from 'pocketflow-ts';

class GreetNode extends Node {
  exec(prepRes: any): string {
    return "Hello, World from PocketFlow TypeScript!";
  }

  post(shared: SharedStore, prepRes: any, execRes: string): void {
    shared.greeting = execRes;
    console.log(execRes);
  }
}

const node = new GreetNode();
const flow = new Flow(node);

const shared = {};
flow.run(shared);
```

### 2. LLM Integration

```typescript
import { Node, Flow, SharedStore } from 'pocketflow-ts';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

class LLMNode extends Node {
  prep(shared: SharedStore): string {
    return shared.question;
  }

  async exec(question: string): Promise<string> {
    const response = await client.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: question }]
    });
    return response.choices[0]?.message?.content || "";
  }

  post(shared: SharedStore, prepRes: string, execRes: string): void {
    shared.answer = execRes;
  }
}

// Usage
const shared = { question: "What is the meaning of life?" };
const flow = new Flow(new LLMNode());
flow.run(shared);
```

## Core Concepts

### Node

A **Node** is the basic building block with three phases:

- `prep(shared)`: Read and preprocess data from shared store
- `exec(prepRes)`: Execute compute logic (e.g., LLM calls)
- `post(shared, prepRes, execRes)`: Write results back to shared store

```typescript
class MyNode extends Node {
  prep(shared: SharedStore): any {
    return shared.input;
  }

  exec(input: any): any {
    // Your logic here
    return processInput(input);
  }

  post(shared: SharedStore, prepRes: any, execRes: any): string | void {
    shared.output = execRes;
    return "next"; // Action for flow control
  }
}
```

### Flow

A **Flow** connects nodes through actions and manages execution:

```typescript
import { chain, branch } from 'pocketflow-ts';

const nodeA = new NodeA();
const nodeB = new NodeB();
const nodeC = new NodeC();

// Sequential flow
chain(nodeA, nodeB, nodeC);

// Conditional branching
branch(nodeA, "success", nodeB);
branch(nodeA, "error", nodeC);

const flow = new Flow(nodeA);
```

### Shared Store

The **Shared Store** is how nodes communicate:

```typescript
const shared = {
  user: { id: "123", name: "Alice" },
  results: {},
  config: { model: "gpt-4" }
};

flow.run(shared);
```

## Design Patterns

### 1. Workflow (Sequential Processing)

```typescript
class GenerateOutline extends Node { /* ... */ }
class WriteContent extends Node { /* ... */ }
class ReviewContent extends Node { /* ... */ }

const outline = new GenerateOutline();
const write = new WriteContent();
const review = new ReviewContent();

chain(outline, write, review);
const workflow = new Flow(outline);
```

### 2. Agent (Decision Making)

```typescript
class DecideAction extends Node {
  post(shared: SharedStore, prepRes: any, execRes: any): string {
    return execRes.action; // "search" | "answer"
  }
}

class SearchWeb extends Node { /* ... */ }
class ProvideAnswer extends Node { /* ... */ }

const decide = new DecideAction();
const search = new SearchWeb();
const answer = new ProvideAnswer();

branch(decide, "search", search);
branch(decide, "answer", answer);
branch(search, "continue", decide); // Loop back

const agent = new Flow(decide);
```

### 3. Map-Reduce (Batch Processing)

```typescript
class ProcessFiles extends BatchNode {
  prep(shared: SharedStore): string[] {
    return Object.keys(shared.files);
  }

  exec(filename: string): string {
    return processFile(shared.files[filename]);
  }

  post(shared: SharedStore, prepRes: string[], execRes: string[]): void {
    shared.results = execRes;
  }
}

const mapReduce = new Flow(new ProcessFiles());
```

### 4. RAG (Retrieval Augmented Generation)

```typescript
// Offline: Index documents
class ChunkDocs extends BatchNode { /* ... */ }
class EmbedChunks extends BatchNode { /* ... */ }
class BuildIndex extends Node { /* ... */ }

// Online: Query and generate
class EmbedQuery extends Node { /* ... */ }
class RetrieveContext extends Node { /* ... */ }
class GenerateAnswer extends Node { /* ... */ }
```

## Advanced Features

### Async Nodes

```typescript
class AsyncLLMNode extends AsyncNode {
  async execAsync(input: string): Promise<string> {
    const response = await callLLMAsync(input);
    return response;
  }
}

const flow = new AsyncFlow(new AsyncLLMNode());
await flow.runAsync(shared);
```

### Retry Logic

```typescript
class ReliableNode extends Node {
  constructor() {
    super(3, 1); // 3 retries, 1 second wait
  }

  execFallback(prepRes: any, error: Error): string {
    return "Fallback response due to: " + error.message;
  }
}
```

### Parallel Batch Processing

```typescript
class ParallelProcess extends AsyncParallelBatchNode {
  async execAsync(item: any): Promise<any> {
    return await processItemAsync(item);
  }
}
```

## Examples

Run the included examples:

```bash
# Install dependencies
npm install

# Run examples
npm run example:hello-world
npm run example:workflow
npm run example:agent
npm run example:batch
npm run example:rag
```

## Project Structure

```
pocketflow-ts/
├── src/
│   └── index.ts          # Core framework (~200 lines)
├── examples/
│   ├── hello-world/      # Basic usage
│   ├── workflow/         # Sequential processing
│   ├── agent/            # Decision making
│   ├── batch/            # Map-reduce processing
│   ├── rag/              # Retrieval augmented generation
│   └── utils/
│       └── callLLM.ts    # LLM utility functions
├── package.json
├── tsconfig.json
└── README.md
```

## Comparison with Python Version

| Feature | Python | TypeScript |
|---------|--------|------------|
| Core Size | 100 lines | ~200 lines |
| Type Safety | ❌ | ✅ |
| Async Support | ✅ | ✅ |
| Zero Dependencies | ✅ | ✅ |
| Operator Overloading | ✅ (`>>`) | ⚠️ (methods) |

### Syntax Differences

**Python:**
```python
node_a >> node_b
node_a - "action" >> node_c
```

**TypeScript:**
```typescript
chain(nodeA, nodeB)
branch(nodeA, "action", nodeC)
// or
nodeA.rshift(nodeB)
nodeA.sub("action").rshift(nodeC)
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Related Projects

- [PocketFlow (Python)](https://github.com/The-Pocket/PocketFlow) - Original Python implementation
- [PocketFlow Documentation](https://the-pocket.github.io/PocketFlow/) - Comprehensive guides and examples

---

Built with ❤️ for the LLM community


