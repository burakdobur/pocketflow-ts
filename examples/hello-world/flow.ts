import { AsyncFlow, SharedStore, Action, AsyncNode } from '../../src/index';
import { callLLMAsync } from '../utils/callLLM';

// An example node and flow
class AnswerNode extends AsyncNode {
  async prepAsync(shared: SharedStore): Promise<string> {
    // Read question from shared
    return shared.question;
  }

  async execAsync(question: string): Promise<string> {
    return await callLLMAsync(question);
  }

  async postAsync(shared: SharedStore, prepRes: string, execRes: string): Promise<Action> {
    // Store the answer in shared
    shared.answer = execRes;
    return "default";
  }
}

const answerNode = new AnswerNode();
export const qaFlow = new AsyncFlow(answerNode);