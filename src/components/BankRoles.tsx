"use client";
import type { BankRole, SlimOccupation } from "@/lib/types";
import { BarChart } from "./BarChart";

export function BankRoles({ roles, selected }: { roles: BankRole[]; selected: SlimOccupation }) {
  return (
    <BarChart
      ariaLabel="Bank jobs ranked by AI exposure score"
      subInline
      data={roles.map((r) => ({
        id: r.soc2020 + r.role,
        label: r.role,
        sub: r.group,
        value: r.score,
        verdict: r.verdict,
        highlight: r.soc2020 === selected.soc,
      }))}
    />
  );
}
