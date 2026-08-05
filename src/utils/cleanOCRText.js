export function cleanOCRText(text) {
  if (!text) return "";

  return text
    // Remove carriage returns
    .replace(/\r/g, "")

    // Replace tabs with spaces
    .replace(/\t/g, " ")

    // Collapse multiple spaces
    .replace(/[ ]{2,}/g, " ")

    // Remove page numbers
    .replace(/^page\s+\d+$/gim, "")

    // Remove lines made of only symbols
    .replace(/^[^a-zA-Z0-9]{3,}$/gm, "")

    // Remove repeated punctuation
    .replace(/([.,!?])\1+/g, "$1")

    // Remove isolated random characters
    .replace(/^\s*[|\\/_\-~=]{2,}\s*$/gm, "")

    // Remove duplicate blank lines
    .replace(/\n{3,}/g, "\n\n")

    // Trim spaces around each line
    .split("\n")
    .map(line => line.trim())

    // Remove very short garbage lines
    .filter(line => {
      if (!line) return false;

      const words = line.split(" ");

      // Keep headings
      if (words.length >= 3) return true;

      // Keep lines containing numbers (MCQs, formulas, etc.)
      if (/\d/.test(line)) return true;

      // Keep reasonable words
      if (line.length > 8) return true;

      return false;
    })

    .join("\n")

    .trim();
}