function replaceFractions(value: string) {
  let nextValue = value;

  for (let index = 0; index < 4; index += 1) {
    nextValue = nextValue.replace(
      /\\frac\{([^{}]+)\}\{([^{}]+)\}/g,
      "$1/$2",
    );
  }

  return nextValue;
}

function cleanMathToken(value: string) {
  return replaceFractions(value)
    .replace(/\\cdot/g, "×")
    .replace(/\\times/g, "×")
    .replace(/\\div/g, "÷")
    .replace(/\\pm/g, "±")
    .replace(/\\leq/g, "≤")
    .replace(/\\geq/g, "≥")
    .replace(/\\neq/g, "≠")
    .replace(/\\left|\\right/g, "")
    .replace(/\\,/g, " ")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatMatrix(body: string) {
  const rows = body
    .trim()
    .split(/\\\\/)
    .map((row) =>
      row
        .split("&")
        .map((cell) => cleanMathToken(cell))
        .filter(Boolean),
    )
    .filter((row) => row.length > 0);

  if (rows.length === 0) {
    return "";
  }

  return [
    "행렬",
    ...rows.map((row, index) => `${index + 1}행: ${row.join(" | ")}`),
  ].join("\n");
}

export function makeMathReadable(value: string) {
  if (!value) {
    return "";
  }

  return replaceFractions(value)
    .replace(/\$\$/g, "\n")
    .replace(/\\\[/g, "\n")
    .replace(/\\\]/g, "\n")
    .replace(/\\\(/g, "")
    .replace(/\\\)/g, "")
    .replace(
      /\\begin\{(?:p|b)?matrix\}([\s\S]*?)\\end\{(?:p|b)?matrix\}/g,
      (_match, body: string) => `\n${formatMatrix(body)}\n`,
    )
    .replace(/\\cdot/g, "×")
    .replace(/\\times/g, "×")
    .replace(/\\div/g, "÷")
    .replace(/\\pm/g, "±")
    .replace(/\\leq/g, "≤")
    .replace(/\\geq/g, "≥")
    .replace(/\\neq/g, "≠")
    .replace(/\\left|\\right/g, "")
    .replace(/\\,/g, " ")
    .replace(/\\\\/g, "\n")
    .replace(/&/g, " | ")
    .replace(/\\[a-zA-Z]+/g, "")
    .replace(/[{}]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
