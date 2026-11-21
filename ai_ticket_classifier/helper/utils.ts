export const isRetryPossible = (error: unknown): boolean => {
  const err = error as { status?: unknown; name?: unknown };
  const statusCode = err.status as number;
  return (
    statusCode === 429 ||
    (statusCode >= 500 && statusCode <= 599) ||
    err?.name === "AbortError" ||
    err?.name === "TimeoutError" ||
    err?.name === "ZodError" ||
    err?.name === "SyntaxError"
  );
};

export const delay = async (attempt: number) => {
  const delayMs = 250 * 2 ** attempt + Math.floor(Math.random() * 100);
  console.log(`Waiting ${delayMs}ms before retry...`);
  await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
};
