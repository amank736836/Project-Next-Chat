import { notFound } from "next/navigation";
import SocketPlayground from "./SocketPlayground";

export const metadata = {
  title: "Socket diagnostics · Chat Champ",
};

/**
 * Dev-only harness for the realtime connection. In production builds the route
 * simply 404s so it can never ship as a public surface.
 */
export default function DevSocketPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <SocketPlayground />;
}
