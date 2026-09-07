import type { Config, Context } from "@netlify/edge-functions";
import TurndownService from "turndown";

const turndown = new TurndownService({
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  headingStyle: "atx"
});

turndown.remove(["script", "style", "noscript"]);
turndown.addRule("remove-svg", {
  filter: (node) => node.nodeName === "SVG",
  replacement: () => ""
});

function acceptsMarkdown(acceptHeader: string) {
  return acceptHeader.split(",").some((range) => {
    const [mediaType, ...parameters] = range.trim().toLowerCase().split(";");
    if (mediaType !== "text/markdown") return false;

    const quality = parameters
      .map((parameter) => parameter.trim())
      .find((parameter) => parameter.startsWith("q="));

    return quality === undefined || Number.parseFloat(quality.slice(2)) > 0;
  });
}

function addVary(headers: Headers, value: string) {
  const values = (headers.get("vary") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!values.some((item) => item.toLowerCase() === value.toLowerCase())) {
    values.push(value);
  }

  headers.set("vary", values.join(", "));
}

export default async function markdownForAgents(request: Request, context: Context) {
  if (
    !["GET", "HEAD"].includes(request.method) ||
    !acceptsMarkdown(request.headers.get("accept") || "")
  ) {
    return;
  }

  const response = await context.next();
  const contentType = response.headers.get("content-type") || "";

  if (!response.ok || !contentType.toLowerCase().includes("text/html")) {
    return response;
  }

  const html = request.method === "HEAD" ? "" : await response.text();
  const markdown = request.method === "HEAD" ? null : turndown.turndown(html);
  const headers = new Headers(response.headers);

  headers.set("content-type", "text/markdown; charset=UTF-8");
  headers.delete("content-encoding");
  headers.delete("content-length");
  headers.delete("etag");
  addVary(headers, "Accept");

  return new Response(markdown, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export const config: Config = { path: "/*" };