import { analyzePage } from "./geminiVision";

export async function generateObservations(pageImages) {
  let output = "";

  for (let i = 0; i < pageImages.length; i++) {

    const pageResult = await analyzePage(
      pageImages[i],
      i + 1
    );

    output += `
=========================
PAGE ${i + 1}
=========================

${pageResult}

`;
  }

  return output.trim();
}