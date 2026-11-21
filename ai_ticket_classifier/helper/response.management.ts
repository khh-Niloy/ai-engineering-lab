type RequestContext = {
  requestId: string;
  modelUsed: string;
  startTime: number;
  usedFallback: boolean;
};

type Usage = {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  thoughtsTokenCount?: number;
  totalTokenCount?: number;
};

function successResponse({
  requestId,
  modelUsed,
  startTime,
  usage,
  usedFallback,
  finishReason,
}: RequestContext & { usage?: Usage; finishReason?: string }) {
  console.log(
    JSON.stringify({
      event: "llm_request",
      requestId,
      model: modelUsed,
      latencyMs: Math.round(performance.now() - startTime),
      promptTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
      thinkingTokens: usage?.thoughtsTokenCount ?? 0,
      totalTokens: usage?.totalTokenCount ?? 0,
      usedFallback,
      finishReason,
      status: "success",
    }),
  );
  //   return {
  //     status: "success",
  //     data,
  //   };
}

function errorResponse({
  requestId,
  modelUsed,
  startTime,
  usedFallback,
  error,
}: RequestContext & { error: unknown }) {
  const errorDetails =
    error instanceof Error
      ? { name: error.name, message: error.message }
      : { message: String(error) };

  console.error(
    JSON.stringify({
      event: "llm_request",
      requestId,
      model: modelUsed,
      latencyMs: Math.round(performance.now() - startTime),
      usedFallback,
      status: "failed",
      error: errorDetails,
    }),
  );

  return {
    status: "error",
    error: errorDetails,
  };
}

export const responseManager = {
  successResponse,
  errorResponse,
};
