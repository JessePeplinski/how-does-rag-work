# Prompt Engineering

## What is Prompt Engineering?

Prompt engineering is the practice of designing and optimizing inputs to large language models to elicit desired outputs. It is both an art and a science: understanding how models interpret instructions allows you to get more accurate, relevant, and useful responses without modifying the model itself.

## Key Techniques

### Zero-Shot Prompting
Asking the model to perform a task without providing any examples. The model relies entirely on its pre-trained knowledge and the instructions given.

Example: "Classify the following review as positive or negative: 'The food was amazing but the service was slow.'"

### Few-Shot Prompting
Providing a small number of examples (typically 2-5) before the actual task. This helps the model understand the expected format and reasoning pattern.

Example:
- Review: "Great product, fast shipping!" -> Positive
- Review: "Broke after one day." -> Negative
- Review: "The food was amazing but the service was slow." -> ?

Few-shot prompting significantly improves performance on tasks where the desired output format or reasoning style isn't obvious from the instruction alone.

### Chain-of-Thought (CoT)
Encouraging the model to show its reasoning step by step before arriving at a final answer. This technique dramatically improves performance on mathematical, logical, and multi-step reasoning tasks.

Simply adding "Let's think step by step" to a prompt can improve accuracy on reasoning tasks. More structured CoT prompts explicitly demonstrate the reasoning process in few-shot examples.

### System Prompts
A system prompt sets the overall behavior, personality, and constraints for the model. It typically includes:
- The model's role (e.g., "You are a helpful medical assistant")
- Behavioral constraints (e.g., "Never provide specific medical diagnoses")
- Output format requirements (e.g., "Always respond in JSON")
- Context about the task or domain

System prompts are processed before user messages and have strong influence over all subsequent interactions.

### Structured Output
Requesting responses in a specific format (JSON, XML, markdown tables) to make outputs programmatically parseable. Modern LLMs are highly reliable at following format instructions when clearly specified. Many AI frameworks now support structured output with schema validation.

## Advanced Techniques

### Retrieval-Augmented Generation (RAG)
Rather than relying on the model's internal knowledge, RAG injects relevant retrieved documents into the prompt. This grounds the model's responses in factual, up-to-date information. The prompt typically includes instructions on how to use the provided context and when to acknowledge uncertainty.

### Prompt Chaining
Breaking complex tasks into a series of simpler prompts, where the output of one becomes the input of the next. This allows each step to be optimized independently and makes the overall system more reliable and debuggable.

### Self-Consistency
Running the same prompt multiple times with temperature > 0 and taking the majority answer. This reduces random errors and improves reliability on reasoning tasks.

## Common Pitfalls

- **Ambiguous instructions**: Models follow instructions literally. Vague prompts produce vague responses.
- **Overloaded prompts**: Asking the model to do too many things at once degrades quality on each individual task.
- **Missing constraints**: Without explicit constraints, models may produce overly verbose, off-topic, or incorrectly formatted responses.
- **Ignoring model strengths**: Different models excel at different tasks. Prompt strategies should be tailored to the specific model being used.

## Prompt Engineering in Production

In production systems, prompts are treated as code: version-controlled, tested, and monitored. A/B testing different prompt variations, tracking output quality metrics, and iterating based on real user interactions are standard practices.
