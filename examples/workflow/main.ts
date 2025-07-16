import { Node, Flow, SharedStore, chain } from '../../src/index';
import { callLLM } from '../utils/callLLM';

// Example: Article Writing Workflow
class GenerateOutline extends Node {
  prep(shared: SharedStore): string {
    return shared.topic;
  }

  exec(topic: string): string {
    return callLLM(`Create a detailed outline for an article about ${topic}`);
  }

  post(shared: SharedStore, prepRes: string, execRes: string): void {
    shared.outline = execRes;
    console.log("✅ Outline generated");
  }
}

class WriteSection extends Node {
  prep(shared: SharedStore): string {
    return shared.outline;
  }

  exec(outline: string): string {
    return callLLM(`Write content based on this outline: ${outline}`);
  }

  post(shared: SharedStore, prepRes: string, execRes: string): void {
    shared.draft = execRes;
    console.log("✅ Draft written");
  }
}

class ReviewAndRefine extends Node {
  prep(shared: SharedStore): string {
    return shared.draft;
  }

  exec(draft: string): string {
    return callLLM(`Review and improve this draft: ${draft}`);
  }

  post(shared: SharedStore, prepRes: string, execRes: string): void {
    shared.finalArticle = execRes;
    console.log("✅ Article refined");
  }
}

async function main() {
  // Create nodes
  const outline = new GenerateOutline();
  const write = new WriteSection();
  const review = new ReviewAndRefine();

  // Connect nodes using the chain helper function
  chain(outline, write, review);

  // Create and run flow
  const writingFlow = new Flow(outline);
  
  const shared = {
    topic: "AI Safety",
    outline: null,
    draft: null,
    finalArticle: null
  };

  console.log("🚀 Starting article writing workflow...");
  writingFlow.run(shared);

  console.log("\n📊 Results:");
  console.log("Topic:", shared.topic);
  console.log("Outline:", shared.outline?.substring(0, 100) + "...");
  console.log("Draft:", shared.draft?.substring(0, 100) + "...");
  console.log("Final Article:", shared.finalArticle?.substring(0, 100) + "...");
}

if (require.main === module) {
  main().catch(console.error);
}