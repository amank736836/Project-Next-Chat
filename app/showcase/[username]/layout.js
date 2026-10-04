export async function generateMetadata({ params }) {
  const { username } = await params;
  const handle = String(username || '').toLowerCase();

  return {
    title: `@${handle} — Answer Showcase`,
    description: `Public wall of questions answered by @${handle}. Filter by website, link it as a live FAQ.`,
    openGraph: {
      title: `@${handle} — Answer Showcase`,
      description: `Real questions, real answers from @${handle}.`,
      type: 'website',
    },
  };
}

export default function ShowcaseLayout({ children }) {
  return children;
}
