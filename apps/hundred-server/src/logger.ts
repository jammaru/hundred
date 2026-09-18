const SECRET = /key|token|secret|authorization|password/i;

export const createLogger = () => {
  const redact = (value: unknown): unknown => {
    if (!value || typeof value !== 'object') {
      return value;
    }
    const entries = Object.entries(value as Record<string, unknown>).map(([key, item]) => {
      if (SECRET.test(key)) {
        return [key, '[redacted]'];
      }
      return [key, item];
    });
    return Object.fromEntries(entries);
  };

  return {
    info(message: string, data?: Record<string, unknown>) {
      if (data) {
        console.info(`[hundred] ${message}`, redact(data));
        return;
      }
      console.info(`[hundred] ${message}`);
    },
    warn(message: string, data?: Record<string, unknown>) {
      if (data) {
        console.warn(`[hundred] ${message}`, redact(data));
        return;
      }
      console.warn(`[hundred] ${message}`);
    },
    error(message: string, data?: Record<string, unknown>) {
      if (data) {
        console.error(`[hundred] ${message}`, redact(data));
        return;
      }
      console.error(`[hundred] ${message}`);
    },
  };
};

export type Logger = ReturnType<typeof createLogger>;
