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
You are an expert university professor creating a quiz from a student's PDF.

Generate exactly 10 multiple-choice questions based ONLY on the provided PDF content.

IMPORTANT RULES:

1. Generate exactly 10 questions.
2. Each question must have exactly 4 options.
3. Options must be ordered A, B, C, D.
4. The "answer" field MUST contain ONLY the letter:
   A
   B
   C
   or
   D

5. NEVER return undefined.
6. NEVER return null.
7. NEVER put the answer text inside the answer field.
8. Every question MUST have a valid answer.
9. The correct answer MUST correspond to one of the four options.
10. Do not create questions whose answer cannot be determined from the PDF.

Return ONLY valid JSON.

Use exactly this structure:

[
  {
    "question": "Question text",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "answer": "A"
  }
]

PDF CONTENT:

${safePdfText}
`;

  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: prompt,
  });

  let text = response.text.trim();

  // Remove accidental markdown code fences
  text = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  let questions;

  try {
    questions = JSON.parse(text);
  } catch (error) {
    console.error(
      "Quiz JSON parsing error:",
      error
    );

    console.error(
      "Gemini response:",
      text
    );

    throw new Error(
      "AI returned invalid quiz data."
    );
  }

  if (
    !Array.isArray(questions) ||
    questions.length !== 10
  ) {
    throw new Error(
      "AI did not generate exactly 10 questions."
    );
  }

  // Validate every question
  questions.forEach((question, index) => {
    if (!question.question) {
      throw new Error(
        `Question ${index + 1} is missing.`
      );
    }

    if (
      !Array.isArray(question.options) ||
      question.options.length !== 4
    ) {
      throw new Error(
        `Question ${index + 1} must have 4 options.`
      );
    }

    if (
      !["A", "B", "C", "D"].includes(
        question.answer?.toUpperCase()
      )
    ) {
      throw new Error(
        `Question ${index + 1} has an invalid correct answer.`
      );
    }
  });

  return questions.map((question) => ({
    question: question.question.trim(),

    options: question.options.map(
      (option) => option.toString().trim()
    ),

    answer:
      question.answer
        .toUpperCase()
        .trim(),
  }));
}