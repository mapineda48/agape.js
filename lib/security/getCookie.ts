/**
 * Extracts auth token from cookie header.
 */
export default function getCookie(header?: string): string | undefined {
  if (!header) {
    return;
  }

  const [, token] = header.match(/auth_token=([^;]+)/) ?? [];

  return token;
}
