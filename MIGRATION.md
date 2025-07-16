# Migration Guide: Python to TypeScript

This guide helps you migrate from PocketFlow Python to PocketFlow TypeScript.

## Installation

**Python:**
```bash
pip install pocketflow
```

**TypeScript:**
```bash
npm install pocketflow-ts
# or
yarn add pocketflow-ts
```

## Basic Imports

**Python:**
```python
from pocketflow import Node, Flow, BatchNode
```

**TypeScript:**
```typescript
import { Node, Flow, BatchNode, SharedStore } from 'pocketflow-ts';
```

## Node Definition

**Python:**
```python
class MyNode(Node):
    def prep(self, shared):
        return shared["input"]
    
    def exec(self, prep_res):
        return f"processed: {prep_res}"
    
    def post(self, shared, prep_res, exec_res):
        shared["output"] = exec_res
        return "next"
```

**TypeScript:**
```typescript
class MyNode extends Node {
  prep(shared: SharedStore): string {
    return shared.input;
  }

  exec(prepRes: string): string {
    return `processed: ${prepRes}`;
  }

  post(shared: SharedStore, prepRes: string, execRes: string): string {
    shared.output = execRes;
    return "next";
  }
}
```

## Flow Creation and Chaining

**Python:**
```python
node_a >> node_b >> node_c
flow = Flow(start=node_a)
```

**TypeScript:**
```typescript
import { chain } from 'pocketflow-ts';

chain(nodeA, nodeB, nodeC);
// or manually:
nodeA.rshift(nodeB).rshift(nodeC);

const flow = new Flow(nodeA);
```

## Conditional Branching

**Python:**
```python
decide - "success" >> success_node
decide - "error" >> error_node
```

**TypeScript:**
```typescript
import { branch } from 'pocketflow-ts';

branch(decide, "success", successNode);
branch(decide, "error", errorNode);
// or manually:
decide.sub("success").rshift(successNode);
decide.sub("error").rshift(errorNode);
```

## Running Flows

**Python:**
```python
shared = {"input": "test"}
flow.run(shared)
```

**TypeScript:**
```typescript
const shared = { input: "test" };
flow.run(shared);
```

## Async Nodes

**Python:**
```python
class AsyncNode(AsyncNode):
    async def exec_async(self, prep_res):
        return await call_llm_async(prep_res)
        
flow = AsyncFlow(start=async_node)
await flow.run_async(shared)
```

**TypeScript:**
```typescript
class MyAsyncNode extends AsyncNode {
  async execAsync(prepRes: string): Promise<string> {
    return await callLLMAsync(prepRes);
  }
}

const flow = new AsyncFlow(asyncNode);
await flow.runAsync(shared);
```

## Batch Processing

**Python:**
```python
class BatchProcessor(BatchNode):
    def prep(self, shared):
        return shared["items"]
    
    def exec(self, item):
        return process_item(item)
    
    def post(self, shared, prep_res, exec_res_list):
        shared["results"] = exec_res_list
```

**TypeScript:**
```typescript
class BatchProcessor extends BatchNode {
  prep(shared: SharedStore): string[] {
    return shared.items;
  }

  exec(item: string): string {
    return processItem(item);
  }

  post(shared: SharedStore, prepRes: string[], execRes: string[]): void {
    shared.results = execRes;
  }
}
```

## Error Handling and Retries

**Python:**
```python
class ReliableNode(Node):
    def __init__(self):
        super().__init__(max_retries=3, wait=1)
    
    def exec_fallback(self, prep_res, exc):
        return "fallback result"
```

**TypeScript:**
```typescript
class ReliableNode extends Node {
  constructor() {
    super(3, 1); // max_retries, wait
  }

  execFallback(prepRes: any, error: Error): string {
    return "fallback result";
  }
}
```

## LLM Integration

**Python:**
```python
from openai import OpenAI

def call_llm(prompt):
    client = OpenAI(api_key="YOUR_API_KEY")
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content
```

**TypeScript:**
```typescript
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function callLLM(prompt: string): Promise<string> {
  const response = await client.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }]
  });
  return response.choices[0]?.message?.content || "";
}
```

## Key Differences

### 1. Operator Overloading
- **Python**: Uses `>>` and `-` operators
- **TypeScript**: Uses helper functions `chain()` and `branch()` or manual methods

### 2. Type Safety
- **Python**: Dynamic typing
- **TypeScript**: Static typing with interfaces

### 3. Async Handling
- **Python**: Uses `asyncio`
- **TypeScript**: Uses native `async/await`

### 4. Shared Store Access
- **Python**: Dictionary-style access `shared["key"]`
- **TypeScript**: Object property access `shared.key`

### 5. Method Naming
- **Python**: Snake case (`exec_async`, `prep_async`)
- **TypeScript**: Camel case (`execAsync`, `prepAsync`)

## Example Migration

**Python:**
```python
from pocketflow import Node, Flow
from utils.call_llm import call_llm

class SummarizeNode(Node):
    def prep(self, shared):
        return shared["text"]
    
    def exec(self, text):
        return call_llm(f"Summarize: {text}")
    
    def post(self, shared, prep_res, exec_res):
        shared["summary"] = exec_res

node = SummarizeNode()
flow = Flow(start=node)
shared = {"text": "Long text here..."}
flow.run(shared)
```

**TypeScript:**
```typescript
import { Node, Flow, SharedStore } from 'pocketflow-ts';
import { callLLM } from './utils/callLLM';

class SummarizeNode extends Node {
  prep(shared: SharedStore): string {
    return shared.text;
  }

  exec(text: string): string {
    return callLLM(`Summarize: ${text}`);
  }

  post(shared: SharedStore, prepRes: string, execRes: string): void {
    shared.summary = execRes;
  }
}

const node = new SummarizeNode();
const flow = new Flow(node);
const shared = { text: "Long text here..." };
flow.run(shared);
```

## Testing Your Migration

1. **Run the examples**: Use `npm run example:*` to test different patterns
2. **Check types**: TypeScript will catch type errors at compile time
3. **Test async flows**: Ensure proper `await` usage with async nodes
4. **Verify shared store**: Check that data flows correctly between nodes

## Common Pitfalls

1. **Forgetting `await`**: Async nodes must be awaited
2. **Type mismatches**: Ensure proper typing of prep/exec return values
3. **Missing imports**: Don't forget to import helper functions
4. **Shared store structure**: Use object properties instead of dictionary keys

This migration guide should help you successfully transition your PocketFlow applications from Python to TypeScript!