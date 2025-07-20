# PocketFlow TypeScript

A 100-line minimalist LLM framework for TypeScript/Node.js - **Zero dependencies core**, Agents, Task Decomposition, RAG, etc.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- TypeScript 5.0+

### Installation
```bash
npm install
```

### Environment Setup

1. **Run the setup script:**
   ```bash
   npm run setup
   ```

2. **Edit `.env` with your API credentials:**
   ```env
   OPENAI_API_KEY=your-actual-api-key-here
   OPENAI_API_BASE_URL=https://aig.quaservices.com
   OPENAI_API_TIMEOUT=10000
   ```

3. **Run examples:**
   ```bash
   npm run example:hello-world
   npm run example:workflow
   npm run example:agent
   ```

## 📚 Examples

### Minimal (Zero Dependencies)
```bash
npm run example:minimal
```

### Hello World
```bash
npm run example:hello-world
```

### Workflow
```bash
npm run example:workflow
```

### Agent
```bash
npm run example:agent
```

## 🔧 Development

### Build
```bash
npm run build
```

### Type Checking
```bash
npm run type-check
npm run type-check:examples
```

### Tests
```bash
npm test
```

## 📦 Dependencies

### Core Library
The core library has **zero external dependencies** - it only uses built-in Node.js APIs. This makes it:
- 🚀 **Lightweight**: Minimal bundle size
- 🔒 **Secure**: No external dependencies to audit
- 🎯 **Flexible**: Works with any LLM client
- ⚡ **Fast**: No dependency resolution overhead

### Development Dependencies
For development and examples, the following dependencies are used:
- `openai`: LLM client for examples
- `dotenv`: Environment variable management
- `typescript`, `ts-node`: TypeScript compilation and execution
- `jest`: Testing framework

### Using Your Own LLM Client
Since the core has zero dependencies, you can use any LLM client:

```typescript
import { Node, Flow } from 'pocketflow-ts';
import OpenAI from 'openai'; // or any other client

class MyLLMNode extends Node {
  exec(input: string): string {
    // Use your preferred LLM client here
    return "Your LLM response";
  }
}
```

## 📖 Documentation

See the `docs/` directory for detailed documentation on:
- Core abstractions (Node, Flow, etc.)
- Design patterns (RAG, Agent, etc.)
- Utility functions
- Best practices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.


