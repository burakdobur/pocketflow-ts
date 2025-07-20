import { qaFlow } from './flow';

// Example main function
async function main() {
  const shared = {
    question: "What is the meaning of life?",
    answer: null
  };

  await qaFlow.runAsync(shared);
  console.log("Question:", shared.question);
  console.log("Answer:", shared.answer);
}

if (require.main === module) {
  main().catch(console.error);
}