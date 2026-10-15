/**
 * AI agents, crawlers and scripted clients never get the site. The site is meant for two people on
 * their phones, so nothing here needs to be fetched by a tool: this keeps "paste the link into an AI
 * and ask it to copy the site" from working. (A determined person can still spoof a browser; this
 * stops the easy road.)
 */
const BOT_UA =
  /claude|anthropic|gptbot|chatgpt|openai|oai-searchbot|perplexity|ccbot|bytespider|google-extended|googleother|applebot-extended|meta-externalagent|amazonbot|diffbot|cohere|youbot|ai2bot|omgili|timpibot|imagesift|petalbot|semrush|ahrefs|mj12bot|dotbot|python-requests|python-urllib|aiohttp|httpx|curl\/|wget|node-fetch|undici|axios|got \(|go-http-client|okhttp|java\/|libwww|scrapy|httrack|headlesschrome|phantomjs|playwright|puppeteer|selenium|webdriver|lighthouse/i;

export function isBot(request: Request) {
  const ua = request.headers.get('user-agent') ?? '';
  if (!ua.trim()) return true;
  if (/^vercel-cron\//i.test(ua)) return false;
  return BOT_UA.test(ua);
}

export const botResponse = () => new Response('Not available.', { status: 403, headers: { 'X-Robots-Tag': 'noindex, nofollow, noai, noimageai', 'Cache-Control': 'no-store' } });
