import { BatchNode, Node, Flow, SharedStore, chain } from '../../src/index';
import { callLLM } from '../utils/callLLM';

// Mock embedding function (in real usage, you'd use a proper embedding model)
function getEmbedding(text: string): number[] {
  // Return a mock embedding vector
  const hash = text.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  // Generate a mock 3-dimensional embedding based on the hash
  return [
    Math.sin(hash) * 0.5 + 0.5,
    Math.cos(hash) * 0.5 + 0.5,
    Math.sin(hash * 2) * 0.5 + 0.5
  ];
}

// Mock index creation and search functions
interface VectorIndex {
  embeddings: number[][];
  chunks: string[];
}

function createIndex(embeddings: number[][]): VectorIndex {
  return { embeddings, chunks: [] };
}

function searchIndex(index: VectorIndex, queryEmbedding: number[], topK: number = 1): { indices: number[]; distances: number[] } {
  const distances = index.embeddings.map((emb, idx) => {
    // Simple cosine similarity
    const dotProduct = emb.reduce((sum, val, i) => sum + val * queryEmbedding[i], 0);
    const normA = Math.sqrt(emb.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(queryEmbedding.reduce((sum, val) => sum + val * val, 0));
    return { index: idx, distance: dotProduct / (normA * normB) };
  });

  distances.sort((a, b) => b.distance - a.distance);
  
  return {
    indices: distances.slice(0, topK).map(d => d.index),
    distances: distances.slice(0, topK).map(d => d.distance)
  };
}

// Stage 1: Offline Indexing

class ChunkDocs extends BatchNode {
  prep(shared: SharedStore): string[] {
    return shared.files;
  }

  exec(filepath: string): string[] {
    // Mock file reading - in real usage, read from actual files
    const mockContent: Record<string, string> = {
      "doc1.txt": "Artificial Intelligence is transforming the world. Machine learning algorithms can process vast amounts of data to find patterns and make predictions.",
      "doc2.txt": "Climate change is one of the biggest challenges of our time. Rising temperatures and extreme weather events are affecting ecosystems worldwide.",
      "doc3.txt": "Space exploration has led to many technological advances. Satellites and space missions help us understand our universe better."
    };

    const text = mockContent[filepath] || `Content of ${filepath}`;
    
    // Chunk by sentences (simplified)
    const sentences = text.split('. ');
    return sentences.map(s => s.trim()).filter(s => s.length > 0);
  }

  post(shared: SharedStore, prepRes: string[], execRes: string[][]): string {
    const allChunks: string[] = [];
    for (const chunkList of execRes) {
      allChunks.push(...chunkList);
    }
    shared.allChunks = allChunks;
    console.log(`📝 Created ${allChunks.length} chunks`);
    return "default";
  }
}

class EmbedDocs extends BatchNode {
  prep(shared: SharedStore): string[] {
    return shared.allChunks;
  }

  exec(chunk: string): number[] {
    return getEmbedding(chunk);
  }

  post(shared: SharedStore, prepRes: string[], execRes: number[][]): string {
    shared.allEmbeds = execRes;
    console.log(`🔢 Generated ${execRes.length} embeddings`);
    return "default";
  }
}

class StoreIndex extends Node {
  prep(shared: SharedStore): { allEmbeds: number[][]; allChunks: string[] } {
    return { allEmbeds: shared.allEmbeds, allChunks: shared.allChunks };
  }

  exec({ allEmbeds, allChunks }: { allEmbeds: number[][]; allChunks: string[] }): VectorIndex {
    const index = createIndex(allEmbeds);
    index.chunks = allChunks;
    return index;
  }

  post(shared: SharedStore, prepRes: { allEmbeds: number[][]; allChunks: string[] }, index: VectorIndex): string {
    shared.index = index;
    console.log("🗃️ Vector index created");
    return "default";
  }
}

// Stage 2: Online Query & Answer

class EmbedQuery extends Node {
  prep(shared: SharedStore): string {
    return shared.question;
  }

  exec(question: string): number[] {
    return getEmbedding(question);
  }

  post(shared: SharedStore, prepRes: string, qEmb: number[]): string {
    shared.qEmb = qEmb;
    return "default";
  }
}

class RetrieveDocs extends Node {
  prep(shared: SharedStore): [number[], VectorIndex, string[]] {
    return [shared.qEmb, shared.index, shared.allChunks];
  }

  exec([qEmb, index, chunks]: [number[], VectorIndex, string[]]): string {
    const { indices } = searchIndex(index, qEmb, 1);
    const bestId = indices[0];
    const relevantChunk = chunks[bestId];
    return relevantChunk;
  }

  post(shared: SharedStore, prepRes: any, relevantChunk: string): string {
    shared.retrievedChunk = relevantChunk;
    console.log("🔍 Retrieved chunk:", relevantChunk.substring(0, 60) + "...");
    return "default";
  }
}

class GenerateAnswer extends Node {
  prep(shared: SharedStore): [string, string] {
    return [shared.question, shared.retrievedChunk];
  }

  exec([question, chunk]: [string, string]): string {
    const prompt = `Question: ${question}\nContext: ${chunk}\nAnswer:`;
    return callLLM(prompt);
  }

  post(shared: SharedStore, prepRes: any, answer: string): string {
    shared.answer = answer;
    console.log("💡 Answer:", answer);
    return "default";
  }
}

async function main() {
  console.log("🚀 Starting RAG Pipeline...");
  
  // Stage 1: Offline Indexing
  console.log("\n📚 Stage 1: Offline Indexing");
  
  const chunkNode = new ChunkDocs();
  const embedNode = new EmbedDocs();
  const storeNode = new StoreIndex();

  chain(chunkNode, embedNode, storeNode);
  const offlineFlow = new Flow(chunkNode);

  const shared: SharedStore = {
    files: ["doc1.txt", "doc2.txt", "doc3.txt"],
    allChunks: [],
    allEmbeds: [],
    index: null,
    question: "What is artificial intelligence?",
    qEmb: [],
    retrievedChunk: "",
    answer: ""
  };

  offlineFlow.run(shared);

  // Stage 2: Online Query & Answer
  console.log("\n🔎 Stage 2: Online Query & Answer");
  
  const embedQNode = new EmbedQuery();
  const retrieveNode = new RetrieveDocs();
  const generateNode = new GenerateAnswer();

  chain(embedQNode, retrieveNode, generateNode);
  const onlineFlow = new Flow(embedQNode);

  console.log("❓ Question:", shared.question);
  onlineFlow.run(shared);

  console.log("\n📊 Final Results:");
  console.log("Question:", shared.question);
  console.log("Retrieved Context:", shared.retrievedChunk);
  console.log("Final Answer:", shared.answer);
}

if (require.main === module) {
  main().catch(console.error);
}