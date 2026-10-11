export async function generateMetadata({ params }) {
  const { username } = await params;
  return { title: `@${String(username || "").toLowerCase()} · Message board` };
}

export default function Layout({ children }) {
  return children;
}
