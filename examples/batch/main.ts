import { BatchNode, Node, Flow, SharedStore, chain, Action } from '../../src/index';
import { callLLM } from '../utils/callLLM';

// Example: Document Summarization using Map-Reduce pattern
class SummarizeAllFiles extends BatchNode {
  prep(shared: SharedStore): [string, string][] {
    const filesDict = shared.files;
    return Object.entries(filesDict);
  }

  exec([filename, content]: [string, string]): [string, string] {
    const summary = callLLM(`Summarize the following file:\n${content}`);
    console.log(`📄 Summarized: ${filename}`);
    return [filename, summary];
  }

  post(shared: SharedStore, prepRes: [string, string][], execRes: [string, string][]): Action {
    shared.fileSummaries = Object.fromEntries(execRes);
    console.log(`✅ Processed ${execRes.length} files`);
    return; // or return null; or return someAction;
  }
}

class CombineSummaries extends Node {
  prep(shared: SharedStore): Record<string, string> {
    return shared.fileSummaries;
  }

  exec(fileSummaries: Record<string, string>): string {
    const textList: string[] = [];
    for (const [fname, summary] of Object.entries(fileSummaries)) {
      textList.push(`${fname} summary:\n${summary}\n`);
    }
    const bigText = textList.join("\n---\n");

    return callLLM(`Combine these file summaries into one final summary:\n${bigText}`);
  }

  post(shared: SharedStore, prepRes: Record<string, string>, finalSummary: string): Action {
    shared.allFilesSummary = finalSummary;
    console.log("✅ Combined all summaries");
    return; // or return null; or return someAction;    
  }
}

async function main() {
  // Create nodes
  const batchNode = new SummarizeAllFiles();
  const combineNode = new CombineSummaries();

  // Connect nodes
  chain(batchNode, combineNode);

  // Create flow
  const mapReduceFlow = new Flow(batchNode);

  const shared = {
    files: {
      "document1.txt": "Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do. Once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it.",
      "document2.txt": "In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole, filled with the ends of worms and an oozy smell, nor yet a dry, bare, sandy hole with nothing in it to sit down on or to eat.",
      "document3.txt": "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity.",
      "document4.txt": "Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world."
    },
    fileSummaries: {},
    allFilesSummary: ""
  };

  console.log("🚀 Starting Map-Reduce document processing...");
  console.log("📚 Processing", Object.keys(shared.files).length, "documents");

  mapReduceFlow.run(shared);

  console.log("\n📊 Results:");
  console.log("\n📄 Individual Summaries:");
  for (const [filename, summary] of Object.entries(shared.fileSummaries)) {
    if (typeof summary === "string") {
      console.log(`${filename}: ${summary.substring(0, 100)}...`);
    } else {
      console.log(`${filename}: [summary is not a string]`);
    }
  }

  console.log("\n📋 Final Combined Summary:");
  console.log(shared.allFilesSummary);
}

if (require.main === module) {
  main().catch(console.error);
}