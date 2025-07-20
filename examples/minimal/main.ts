import { Node, Flow, SharedStore } from '../../src/index';

// Minimal example with zero external dependencies
class SimpleNode extends Node {
  prep(shared: SharedStore): string {
    return shared.input || "Hello";
  }

  exec(input: string): string {
    return `Processed: ${input.toUpperCase()}`;
  }

  post(shared: SharedStore, prepRes: string, execRes: string): string {
    shared.output = execRes;
    console.log(execRes);
    return "default";
  }
}

// Usage without any external dependencies
async function main() {
  const node = new SimpleNode();
  const flow = new Flow(node);

  const shared: SharedStore = {
    input: "world",
    output: null
  };

  console.log("🚀 Running minimal example (zero dependencies)...");
  flow.run(shared);
  console.log("✅ Done!");
}

if (require.main === module) {
  main().catch(console.error);
} 