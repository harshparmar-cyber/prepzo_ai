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

Generate 20 multiple-choice questions ONLY from the uploaded document.

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