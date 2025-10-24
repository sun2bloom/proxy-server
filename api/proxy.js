// api/proxy.js
export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const target = searchParams.get("url");

    if (!target) {
      return new Response("Missing ?url=", { status: 400 });
    }

    // Validate scheme
    if (!/^https?:\/\//i.test(target)) {
      return new Response("Invalid URL scheme", { status: 400 });
    }

    console.log("Fetching:", target);

    // Fetch the page
    const fetched = await fetch(target, {
      headers: {
        "User-Agent": "ProxyBrowser/1.0",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const contentType = fetched.headers.get("content-type") || "";

    // Handle non-HTML content (like images, css)
    if (!contentType.includes("text/html")) {
      const bytes = await fetched.arrayBuffer();
      return new Response(bytes, {
        status: fetched.status,
        headers: {
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Get HTML text
    let html = await fetched.text();

    // (Optional) Rewrite href/src links to go through proxy
    html = html.replace(
      /(?:href|src)=["'](https?:\/\/[^"']+)["']/gi,
      (match, group1) =>
        match.replace(group1, `/api/proxy?url=${encodeURIComponent(group1)}`)
    );

    // Return the HTML with CORS header
    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return new Response("Internal Error", { status: 500 });
  }
}
