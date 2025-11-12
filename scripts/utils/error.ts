export function summarizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message || error.name;
  }

  if (error && typeof error === 'object') {
    const maybeMessage = (error as { message?: unknown }).message;
    const maybeCode = (error as { code?: unknown }).code;
    const maybeDetails = (error as { details?: unknown }).details;
    const maybeHint = (error as { hint?: unknown }).hint;

    const parts: string[] = [];

    if (typeof maybeMessage === 'string' && maybeMessage.trim().length > 0) {
      parts.push(maybeMessage.trim());
    }
    if (typeof maybeCode === 'string' && maybeCode.trim().length > 0) {
      parts.push(`code: ${maybeCode.trim()}`);
    }
    if (typeof maybeDetails === 'string' && maybeDetails.trim().length > 0) {
      parts.push(`details: ${maybeDetails.trim()}`);
    }
    if (typeof maybeHint === 'string' && maybeHint.trim().length > 0) {
      parts.push(`hint: ${maybeHint.trim()}`);
    }

    if (parts.length > 0) {
      return parts.join(' | ');
    }

    try {
      return JSON.stringify(error);
    } catch {
      // fall through to generic string conversion below
    }
  }

  return String(error);
}

export function serializeError(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack || undefined;
  }

  if (error && typeof error === 'object') {
    try {
      const serialized = JSON.stringify(error, null, 2);
      return serialized === '{}' ? undefined : serialized;
    } catch {
      return undefined;
    }
  }

  return undefined;
}
