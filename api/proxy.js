// api/proxy.js
export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const target = searchParams.get("url");

    if (!target) {
      return new Response("Missing ?url=", { status: 400 });
    }

    const res = await fetch(target);
    const contentType = res.headers.get("content-type") || "text/plain";
    const text = await res.text();

    return new Response(text, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return new Response("Error", { status: 500 });
  }
}
