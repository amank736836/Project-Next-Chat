import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "../../lib/server/auth";

export default async function BoardPage() {
  const user = await getAuthenticatedUser();

  if (!user?.username) {
    redirect("/login");
  }

  redirect(`/u/${user.username}`);
}