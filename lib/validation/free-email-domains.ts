// Free / public / disposable mailbox domains rejected by the lead form (brief: business email only).
// Shared by the browser and /api/lead.

/** Exact domains. */
const FREE_DOMAINS = new Set([
  // Google
  "gmail.com",
  "googlemail.com",
  // Yahoo (country variants are matched by FREE_PROVIDER_PATTERN)
  "ymail.com",
  "rocketmail.com",
  // Microsoft
  "msn.com",
  "passport.com",
  // Apple
  "icloud.com",
  "me.com",
  "mac.com",
  // AOL
  "aol.com",
  "aim.com",
  // Proton
  "proton.me",
  "protonmail.com",
  "protonmail.ch",
  "pm.me",
  // Indian providers
  "rediffmail.com",
  "rediff.com",
  "sify.com",
  // Zoho personal mail
  "zohomail.com",
  "zohomail.in",
  "zoho.com",
  // Others
  "mail.com",
  "email.com",
  "usa.com",
  "inbox.com",
  "hushmail.com",
  "tutanota.com",
  "tutanota.de",
  "tuta.io",
  "fastmail.com",
  "fastmail.fm",
  "hey.com",
  "ya.ru",
  "mail.ru",
  "bk.ru",
  "list.ru",
  "qq.com",
  "163.com",
  "126.com",
  "sina.com",
  "naver.com",
  "web.de",
  "libero.it",
  "orange.fr",
  "laposte.net",
  // Disposable
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "temp-mail.org",
  "yopmail.com",
  "trashmail.com",
  "getnada.com",
  "sharklasers.com",
]);

/**
 * Providers that use many country domains (yahoo.co.in, outlook.in, hotmail.co.uk, live.com.au,
 * gmx.de, yandex.ru …): reject the provider name followed by any public-suffix-like ending.
 */
const FREE_PROVIDER_PATTERN = /^(yahoo|outlook|hotmail|live|windowslive|gmx|yandex)\.[a-z]{2,3}(\.[a-z]{2})?$/;

/** True when the address is on a free/public/disposable mailbox domain (subdomains included). */
export function isFreeEmailDomain(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@").pop() ?? "";
  if (!domain) return false;
  // Check the domain and each parent (e.g. "mail.yahoo.co.in" → "yahoo.co.in").
  const labels = domain.split(".");
  for (let i = 0; i < labels.length - 1; i++) {
    const candidate = labels.slice(i).join(".");
    if (FREE_DOMAINS.has(candidate) || FREE_PROVIDER_PATTERN.test(candidate)) return true;
  }
  return false;
}
