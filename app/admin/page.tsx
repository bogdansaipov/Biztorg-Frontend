import { redirect } from "next/navigation";

// The real analytics dashboard (Image 1/3-style stat cards + chart) isn't
// built yet — that's a later step, same as its backend module. Until then,
// the most urgent screen (moderation queue) is what admins land on.
export default function AdminHomePage() {
  redirect("/products");
}