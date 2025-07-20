import { Flow, SharedStore, Action, AsyncNode } from '../../src/index';
import { callLLMAsync } from '../utils/callLLM';

// An example node and flow
class AnswerNode extends AsyncNode {
  prep(shared: SharedStore): string {
    // Read question from shared
    return shared.question;
  }

  async exec(question: string): Promise<string> {
    return await callLLMAsync(question);
  }

  post(shared: SharedStore, prepRes: string, execRes: string): Action {
    // Store the answer in shared
    shared.answer = execRes;
    return "default";
  }
}

const answerNode = new AnswerNode();
export const qaFlow = new Flow(answerNode);