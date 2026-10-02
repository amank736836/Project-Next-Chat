import { notFound } from "next/navigation";
import SocketPlayground from "./SocketPlayground";

export const metadata = {
  title: "Socket diagnostics · Chat Champ",
};

/**
 * Dev-only harness for the realtime connection.
 *
 * `force-dynamic` matters here: with static prerendering, `notFound()` thrown at
 * build time produces an empty page served as HTTP 200. Rendering per request
 * makes production return a real 404 instead.
 *
 * Production builds can opt back in with ENABLE_DEV_TOOLS=true — useful for
 * diagnosing socket/CORS/cookie behaviour from a real deployed origin.
 */
export const dynamic = "force-dynamic";

export default function DevSocketPage() {
  const enabled =
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_DEV_TOOLS === "true";

  if (!enabled) {
    notFound();
  }

  return <SocketPlayground />;
}
