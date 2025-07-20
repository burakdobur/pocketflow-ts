import { AsyncNode, AsyncFlow, SharedStore, chain } from '../../src/index';
import { callLLMAsync } from '../utils/callLLM';

// Example: Article Writing Workflow
class GenerateOutline extends AsyncNode {
  async prepAsync(shared: SharedStore): Promise<string> {
    return shared.topic;
  }

  async execAsync(topic: string): Promise<string> {
    return await callLLMAsync(`Create a detailed outline for an article about ${topic}`);
  }

  async postAsync(shared: SharedStore, prepRes: string, execRes: string): Promise<string> {
    shared.outline = execRes;
    console.log("✅ Outline generated");
    return "default";
  }
}

class WriteSection extends AsyncNode {
  async prepAsync(shared: SharedStore): Promise<string> {
    return shared.outline;
  }

  async execAsync(outline: string): Promise<string> {
    return await callLLMAsync(`Write content based on this outline: ${outline}`);
  }

  async postAsync(shared: SharedStore, prepRes: string, execRes: string): Promise<string> {
    shared.draft = execRes;
    console.log("✅ Draft written");
    return "default";
  }
}

class ReviewAndRefine extends AsyncNode {
  async prepAsync(shared: SharedStore): Promise<string> {
    return shared.draft;
  }

  async execAsync(draft: string): Promise<string> {
    return await callLLMAsync(`Review and improve this draft: ${draft}`);
  }

  async postAsync(shared: SharedStore, prepRes: string, execRes: string): Promise<string> {
    shared.finalArticle = execRes;
    console.log("✅ Article refined");
    return "default";
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
  const writingFlow = new AsyncFlow(outline);

  const shared: SharedStore = {
    topic: "AI Safety",
    outline: null,
    draft: null,
    finalArticle: null
  };

  console.log("🚀 Starting article writing workflow...");
  await writingFlow.runAsync(shared);

  console.log("\n📊 Results:");
  console.log("Topic:", shared.topic);
  console.log("Outline:", shared.outline ? shared.outline.substring(0, 100) + "..." : "N/A");
  console.log("Draft:", shared.draft ? shared.draft.substring(0, 100) + "..." : "N/A");
  console.log("Final Article:", shared.finalArticle ? shared.finalArticle.substring(0, 100) + "..." : "N/A");
}

if (require.main === module) {
  main().catch(console.error);
}