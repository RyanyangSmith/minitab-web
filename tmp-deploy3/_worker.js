export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    let path = url.pathname;
    if (path === "/" || path === "") path = "/index.html";
    
    // Try to serve from static assets
    const asset = await env.ASSETS.fetch(new Request(url.origin + path, request));
    if (asset.status !== 404) return asset;
    
    // Fallback to index.html for SPA routing
    return env.ASSETS.fetch(new Request(url.origin + "/index.html", request));
  }
}
