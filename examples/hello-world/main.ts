import { qaFlow } from './flow';

// Example main function
async function main() {
  const shared = {
    question: "In one sentence, what's the end of universe?",
    answer: null
  };

  qaFlow.run(shared);
  console.log("Question:", shared.question);
  console.log("Answer:", shared.answer);
}

if (require.main === module) {
  main().catch(console.error);
}