import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

export async function generateSmartNotes(pdfText, focus, mode) {
  // Keep within free-tier limits
  const safePdfText = pdfText ? pdfText.slice(0, 15000) : "";

  let prompt = "";

  // ================= SMART NOTES =================

  if (mode === "notes") {
    prompt = `
You are Prepzo AI, an expert university professor.

Convert the uploaded PDF into clean, easy-to-understand study notes.

you are only allowed to use the text provided to you no extra things you neeed to answer.

Focus:
${focus || "Generate complete study notes."}

DOCUMENT:
${safePdfText}

Rules:

- Explain in simple English.
- No Markdown (#, ##, **, etc.).
- No LaTeX.
- No HTML.
- Use headings.
- Use bullet points.
- Explain difficult concepts simply.

Format exactly like this:

==================================================

📘 TOPIC NAME

Introduction

(2-3 paragraphs)

----------------------------------------

📌 Important Concepts

• Concept

Explanation

----------------------------------------

⭐ Key Formulas (if available)

Formula

Meaning

Example

----------------------------------------

📝 Important Points

• Point

• Point

• Point

----------------------------------------

💡 Simple Example

Explain one real-world example.

----------------------------------------

🎯 Exam Tips

• Tip

• Tip

----------------------------------------

📖 Quick Revision

Write 8-10 one-line revision points.

==================================================

Return ONLY the notes.
`;
  }

  // ================= MCQs =================

  else if (mode === "mcq") {
    prompt = `
You are an experienced university examiner.

You are an expert university professor.

You are ONLY allowed to use the text provided below.

ABSOLUTE RULES

1. NEVER use outside knowledge.

2. NEVER add information that is not written.

3. NEVER invent facts.

4. Every question MUST come directly from the uploaded document.

5. If the document doesn't contain enough information,
generate fewer questions.

6. Do NOT guess.

7. Questions must test understanding of THIS document only.

8. Every question MUST include the exact sentence or paragraph it was created from.

Output format:

Question 1

Options

Correct Answer

Explanation

Source:
(copy the sentence from the uploaded document)

DOCUMENT

${safePdfText}

Focus:
${focus || "Entire document"}

DOCUMENT:
${safePdfText}

Rules:

- Questions should cover the complete document.
- Difficulty: University exam level.
- Four options.
- Mention the correct answer.
- Give a one-line explanation.
- No markdown.
- No HTML.
- No LaTeX.

Format:

==================================================

Question 1

Question

A)

B)

C)

D)

Correct Answer:

Explanation:

----------------------------------------

Question 2

...

Repeat until Question 20.

==================================================
`;
  }

  // ================= VIVA =================

  else if (mode === "viva") {
    prompt = `
You are a university viva examiner.

Generate 20 viva questions from the uploaded document.

you are only allowed to use the text provided to you no extra things you neeed to answer.

Focus:
${focus || "Entire document"}

DOCUMENT:
${safePdfText}

Rules:

- Start with easy questions.
- Gradually increase difficulty.
- Give detailed answers.
- Add follow-up questions.
- Give viva tips.
- No Markdown.
- No HTML.
- No LaTeX.

Format:

==================================================

Question 1

Answer

Possible Follow-up Question

Viva Tip

----------------------------------------

Question 2

...

Repeat until Question 20.

==================================================
`;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export async function generateQuizQuestions(pdfText) {

  const safePdfText = pdfText
    ? pdfText.slice(0, 15000)
    : "";

  const prompt = `
You are an expert university quiz creator.

Generate EXACTLY 10 multiple-choice questions
from ONLY the document provided below.

STRICT RULES:

1. Use ONLY information present in the document.
2. Do NOT use outside knowledge.
3. Do NOT invent information.
4. Every question must be answerable from the document.
5. Create exactly 4 options for every question.
6. Only ONE option can be correct.
7. Questions should test understanding, not just memorization.
8. Keep the questions relevant to the uploaded PDF.
9. Return ONLY valid JSON.
10. Do not use Markdown.
11. Do not add explanations outside the JSON.

Return exactly this structure:

[
  {
    "question": "Question here",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "answer": "Option A"
  }
]

DOCUMENT:

${safePdfText}
`;

  try {

    const response =
      await ai.models.generateContent({

        model: "gemini-flash-latest",

        contents: prompt,

      });

    let text = response.text.trim();

    // Remove accidental Markdown code fences
    text = text
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/i, "")
      .trim();

    const questions = JSON.parse(text);

    if (
      !Array.isArray(questions) ||
      questions.length !== 10
    ) {
      throw new Error(
        "Gemini did not generate exactly 10 questions."
      );
    }

    return questions;

  } catch (error) {

    console.error(
      "Quiz Generation Error:",
      error
    );

    throw error;
  }
}