import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

export async function analyzePage(pageImage, pageNumber) {
  const base64 = pageImage.split(",")[1];

  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",

    contents: [
      {
        inlineData: {
          mimeType: "image/png",
          data: base64,
        },
      },
      {
        text: `
You are Prepzo AI, an expert software engineering professor and lab evaluator.

You are analyzing PAGE ${pageNumber} of a student's PDF.

IMPORTANT INSTRUCTIONS

• This page may contain multiple screenshots.
• Ignore all normal document text, headings, captions and page numbers.
• ONLY analyze screenshots or images.
• Detect every screenshot on the page.
• Treat each screenshot independently.
• Keep the observations in the same order as the screenshots appear (top to bottom, left to right).
• Never merge multiple screenshots into one observation.
• Do NOT OCR or rewrite the text present in the screenshot unless it is essential for understanding the observation.

For EVERY screenshot, generate ONE observation in the following format:

Observation 1

Write a single paragraph (3-5 sentences) describing:

• The purpose of the screenshot.
• What process or operation is being performed.
• What can be understood from the screenshot.
• The outcome, result, success message, warning or error (if visible).

The paragraph should read naturally like a lab observation.

Example:

Observation 1

The screenshot illustrates the implementation of the user authentication process where login credentials are being validated before granting access to the application. It demonstrates the execution of the authentication workflow and verifies that the entered information is processed correctly. The successful completion of the operation confirms that the login functionality has been integrated properly and is working as expected.

----------------------------------------

Observation 2

The screenshot demonstrates the installation of the required project dependencies for the application. It shows that the necessary packages are being added successfully without any visible errors. This confirms that the development environment has been configured correctly and is ready for further implementation.

IMPORTANT RULES

• Do NOT mention software names.
• Do NOT mention application names.
• Do NOT mention editor names.
• Do NOT mention browser names.
• Do NOT use headings like Purpose, Observation or Result.
• Do NOT write bullet points.
• Do NOT add introductions or conclusions.
• Return ONLY Observation 1, Observation 2, Observation 3, etc.
`,
      },
    ],
  });

  return response.text;
}