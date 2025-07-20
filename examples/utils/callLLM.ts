import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE_URL || 'https://aig.quaservices.com',
  timeout: 10000, // Set a timeout for requests
});

export function callLLM(prompt: string): string {
  // For demo purposes, return a mock response if no API key is set
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'YOUR_API_KEY_HERE') {
    return "Mock response: The universe will likely end in heat death, where entropy reaches maximum and no more work can be performed.";
  }

  try {
    // Note: In real usage, this should be async
    // For simplicity in this example, we're using a synchronous approach
    // In practice, you would use async/await with the OpenAI client
    throw new Error("Synchronous LLM calls not supported. Use async version.");
  } catch (error) {
    return "Error calling LLM: " + (error as Error).message;
  }
}

export async function callLLMAsync(prompt: string): Promise<string> {
  // For demo purposes, return a mock response if no API key is set
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'YOUR_API_KEY_HERE') {
    return "Mock response: The universe will likely end in heat death, where entropy reaches maximum and no more work can be performed.";
  }

  try {
    const response = await client.chat.completions.create({
      model: "openai/gpt-4.1",
      messages: [{ role: "user", content: prompt }]
    });

    return response.choices[0]?.message?.content || "No response generated";
  } catch (error) {
    throw new Error("Error calling LLM: " + (error as Error).message);
  }
}

// Example usage
if (require.main === module) {
  const prompt = "What is the meaning of life?";
  console.log(callLLM(prompt));
}