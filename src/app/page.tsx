import { redirect } from "next/navigation";
import { currentPrincipal } from "@/server/auth/session";

export default async function Home() {
  redirect((await currentPrincipal()) ? "/orgs" : "/sign-in");
}
