import { qaFlow } from './flow';

// Example main function
async function main() {
  const shared = {
    question: "What is the meaning of life?",
    answer: null
  };

  const result = await qaFlow.runAsync(shared);
  shared.answer = result.answer;
  console.log(shared.answer);
}

if (require.main === module) {
  main().catch(console.error);
}