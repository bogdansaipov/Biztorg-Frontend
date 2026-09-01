"use client"

import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"

// DataTable + data.json (the fake "Cover page"/"Eddie Lake" rows from the
// shadcn block) dropped — they don't map onto anything Biztorg actually
// has. If you want a real table here later (recent reports, recent
// approvals, etc.) that's a separate, deliberate addition rather than
// forcing real data into a shape built for something else.
export default function Page() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
    </div>
  )
}