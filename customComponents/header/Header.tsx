import { fetchRegionsServer } from "@/lib/server-api";
import TopBar from "./TopBar";
import MainHeader from "./MainHeader";

export default async function Header() {
  // Fetched once here (server-side, on every navigation that re-renders
  // the layout) and handed down to TopBar — avoids TopBar needing its
  // own client-side fetch just to know the full region list for its
  // picker.
  const regions = await fetchRegionsServer();

  return (
    <>
      <TopBar regions={regions} />
      <MainHeader />
    </>
  );
}