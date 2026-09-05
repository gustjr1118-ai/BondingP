import PromptBuilder from "@/components/prompt-builder";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, verifySession } from "@/lib/auth";

export default async function Home() {
  const cookieStore = await cookies();
  const authenticated = await verifySession(cookieStore.get(AUTH_COOKIE)?.value, process.env.SESSION_SECRET);
  if (!authenticated) redirect("/login");
  return <PromptBuilder />;
}
