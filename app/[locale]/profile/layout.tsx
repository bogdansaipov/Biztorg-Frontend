import type { Metadata } from "next";
import ProfileLayoutClient from "@/customComponents/profile/ProfileLayoutClient";

// The whole /profile/* section is a private account area — behind a
// client-side auth check besides. Nothing here is meant to be a public
// search result, and there's no content for a crawler to usefully follow
// through to, hence follow: false as well (unlike /search, which stays
// follow: true specifically to let bots pass through to real product
// pages).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <ProfileLayoutClient>{children}</ProfileLayoutClient>;
}