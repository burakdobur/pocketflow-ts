import { Node, Flow, SharedStore } from '../../src/index';
import { callLLM } from '../utils/callLLM';

// An example node and flow
class AnswerNode extends Node {
  prep(shared: SharedStore): string {
    // Read question from shared
    return shared.question;
  }

  exec(question: string): string {
    return callLLM(question);
  }

  post(shared: SharedStore, prepRes: string, execRes: string): string {
    // Store the answer in shared
    shared.answer = execRes;
    return "default";
  }
}

const answerNode = new AnswerNode();
export const qaFlow = new Flow(answerNode);