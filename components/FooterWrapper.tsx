import { fetchRegionsServer } from "@/lib/server-api";
import Footer from "./Footer";

export default async function FooterWrapper() {
  const regions = await fetchRegionsServer();
  return <Footer regions={regions} />;
}