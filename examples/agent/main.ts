import { Node, Flow, SharedStore, branch } from '../../src/index';
import { callLLM } from '../utils/callLLM';

interface SearchResult {
  term: string;
  result: string;
}

// Mock web search function
function searchWeb(term: string): string {
  const mockResults: Record<string, string> = {
    "Nobel Prize Physics 2024": "The 2024 Nobel Prize in Physics was awarded to John Hopfield and Geoffrey Hinton for foundational discoveries in machine learning.",
    "universe end": "Current theories suggest the universe will end in heat death, where entropy reaches maximum.",
    "default": `Search results for "${term}": Mock result showing relevant information.`
  };
  
  return mockResults[term] || mockResults["default"];
}

class DecideAction extends Node {
  prep(shared: SharedStore): [string, SearchResult[]] {
    const context = shared.context || [];
    const query = shared.query;
    return [query, context];
  }

  exec([query, context]: [string, SearchResult[]]): any {
    const contextStr = context.length > 0 
      ? context.map(r => `${r.term}: ${r.result}`).join('\n')
      : "No previous search";

    const prompt = `
Given input: ${query}
Previous search results: ${contextStr}

Should I: 1) Search web for more info 2) Answer with current knowledge

Output in JSON format:
{
  "action": "search" or "answer",
  "reason": "why this action",
  "search_term": "search phrase if action is search"
}`;

    const response = callLLM(prompt);
    
    // Parse mock response
    try {
      return JSON.parse(response);
    } catch {
      // Fallback for mock responses
      if (context.length === 0) {
        return {
          action: "search",
          reason: "Need more information",
          search_term: query
        };
      } else {
        return {
          action: "answer",
          reason: "Have enough context to answer"
        };
      }
    }
  }

  post(shared: SharedStore, prepRes: any, execRes: any): string {
    if (execRes.action === "search") {
      shared.searchTerm = execRes.search_term;
    }
    return execRes.action;
  }
}

class SearchWeb extends Node {
  prep(shared: SharedStore): string {
    return shared.searchTerm;
  }

  exec(searchTerm: string): string {
    return searchWeb(searchTerm);
  }

  post(shared: SharedStore, prepRes: string, execRes: string): string {
    const prevSearches = shared.context || [];
    shared.context = [
      ...prevSearches,
      { term: shared.searchTerm, result: execRes }
    ];
    console.log(`🔍 Searched for: ${shared.searchTerm}`);
    return "decide";
  }
}

class DirectAnswer extends Node {
  prep(shared: SharedStore): [string, SearchResult[]] {
    return [shared.query, shared.context || []];
  }

  exec([query, context]: [string, SearchResult[]]): string {
    const contextStr = context.map(r => `${r.term}: ${r.result}`).join('\n');
    return callLLM(`Context: ${contextStr}\nAnswer this question: ${query}`);
  }

  post(shared: SharedStore, prepRes: any, execRes: string): void {
    console.log(`💡 Answer: ${execRes}`);
    shared.answer = execRes;
  }
}

async function main() {
  // Create nodes
  const decide = new DecideAction();
  const search = new SearchWeb();
  const answer = new DirectAnswer();

  // Connect nodes with branching logic
  branch(decide, "search", search);
  branch(decide, "answer", answer);
  branch(search, "decide", decide); // Loop back for more searches

  // Create and run flow
  const searchAgentFlow = new Flow(decide);
  
  const shared = {
    query: "Who won the Nobel Prize in Physics 2024?",
    context: [],
    answer: null,
    searchTerm: null
  };

  console.log("🤖 Starting search agent...");
  console.log("❓ Question:", shared.query);
  
  searchAgentFlow.run(shared);

  console.log("\n📊 Final Results:");
  console.log("Question:", shared.query);
  console.log("Answer:", shared.answer);
  console.log("Search History:", shared.context?.map(r => r.term).join(", "));
}

if (require.main === module) {
  main().catch(console.error);
}