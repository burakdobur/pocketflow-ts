import OpenAI from 'openai';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Helper function to check if we have a valid API key
function hasValidApiKey(): boolean {
  const apiKey = process.env.OPENAI_API_KEY;
  return Boolean(apiKey && apiKey.trim() !== '' && apiKey !== 'YOUR_API_KEY_HERE');
}

// Create client only when needed
function createClient(): OpenAI | null {
  if (!hasValidApiKey()) {
    return null;
  }
  
  try {
    return new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
      baseURL: process.env.OPENAI_API_BASE_URL || 'https://aig.quaservices.com',
      timeout: parseInt(process.env.OPENAI_API_TIMEOUT || '10000'), // Set a timeout for requests
    });
  } catch (error) {
    console.error('Failed to create OpenAI client:', error);
    return null;
  }
}

export function callLLM(prompt: string): string {
  // For demo purposes, return a mock response if no API key is set
  if (!hasValidApiKey()) {
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
  if (!hasValidApiKey()) {
    console.log('🔍 Debug: No valid API key found, using mock response');
    console.log('   Set OPENAI_API_KEY environment variable to use real LLM');
    return "Mock response: The universe will likely end in heat death, where entropy reaches maximum and no more work can be performed.";
  }

  console.log('🔍 Debug: API key found, attempting real LLM call');
  const client = createClient();
  if (!client) {
    console.log('🔍 Debug: Failed to create client, using mock response');
    return "Mock response: The universe will likely end in heat death, where entropy reaches maximum and no more work can be performed.";
  }

  try {
    console.log('🔍 Debug: Making real LLM API call...');
    const response = await client.chat.completions.create({
      model: "openai/gpt-4.1",
      messages: [{ role: "user", content: prompt }]
    });

    const result = response.choices[0]?.message?.content || "No response generated";
    console.log('🔍 Debug: LLM call successful');
    return result;
  } catch (error) {
    console.error('❌ LLM API call failed:', error);
    return "Error calling LLM: " + (error as Error).message;
  }
}

// Example usage
if (require.main === module) {
  const prompt = "What is the meaning of life?";
  console.log(callLLM(prompt));
}