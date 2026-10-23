"use client";
import { useState } from "react";
import type { BankRole, SlimOccupation } from "@/lib/types";
import { BarChart } from "./BarChart";
import { ShowMore } from "./ShowMore";

const SHORT = 5;

export function BankRoles({ roles, selected }: { roles: BankRole[]; selected: SlimOccupation }) {
  const [open, setOpen] = useState(false);
  // Keep the reader's own bank job visible even when the list is cut to five.
  const rows = open ? roles : roles.filter((r, i) => i < SHORT || r.soc2020 === selected.soc);
  return (
    <>
      <BarChart
        ariaLabel="Bank jobs ranked by AI exposure score"
        compact
        data={rows.map((r) => ({
          id: r.soc2020 + r.role,
          label: r.role,
          sub: r.group,
          value: r.score,
          verdict: r.verdict,
          highlight: r.soc2020 === selected.soc,
        }))}
      />
      {!open && rows.length < roles.length ? <ShowMore onClick={() => setOpen(true)}>Show all ten</ShowMore> : null}
    </>
  );
}
