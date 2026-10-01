# ai-engineering-lab

A collection of small-to-medium AI engineering projects built while learning practical AI/LLM engineering.

## Projects

### AI Ticket Classifier

![AI Ticket Classifier Demo](./images/ai_ticket_classifier.png)

<details>
<summary><b>Project Details</b></summary>
<br>

**What it does**  
A Node.js command-line tool that uses the Gemini API to automatically categorize and prioritize customer support tickets, providing a structured JSON response.

**Key concepts/technologies**  
* TypeScript / Node.js
* `@google/genai` SDK
* Structured JSON Output (JSON Schema)
* System Instructions / Prompt Engineering

**Examples**

**Input:** `I was charged twice for the same order.`
**Output:**
```json
{
  "category": "PAYMENT",
  "priority": "HIGH",
  "reason": "Customer was charged twice for the same order."
}
```

**Input:** `I forgot my password and cannot log into my account.`
**Output:**
```json
{
  "category": "ACCOUNT",
  "priority": "MEDIUM",
  "reason": "User cannot log into their account due to a forgotten password."
}
```

**Input:** `The app crashes every time I try to upload a profile picture.`
**Output:**
```json
{
  "category": "TECHNICAL",
  "priority": "MEDIUM",
  "reason": "The app crashes every time the user tries to upload a profile picture, indicating a software defect."
}
```

**Input:** `My order was supposed to arrive yesterday, but I still haven't received it.`
**Output:**
```json
{
  "category": "SHIPPING",
  "priority": "MEDIUM",
  "reason": "Order was supposed to arrive yesterday but hasn't been received."
}
```

**Input:** `I returned the product 7 days ago, but I haven't received my refund yet.`
**Output:**
```json
{
  "category": "REFUND",
  "priority": "MEDIUM",
  "reason": "Customer has not received a refund 7 days after returning the product."
}
```
</details>
