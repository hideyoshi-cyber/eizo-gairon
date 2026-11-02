/** Markdown本文の最初の「# 見出し」を返す */
export const h1Of = (body: string | undefined, fallback = '') => body?.match(/^# (.+)$/m)?.[1].trim() ?? fallback;
