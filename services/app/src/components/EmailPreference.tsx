"use client";

import { useState } from "react";
import { setEmailPreference } from "@/lib/actions";
import { Switch } from "./ui/Switch";

export function EmailPreference({ initial, disabled }: Readonly<{ initial: boolean; disabled?: boolean }>) {
  const [on, setOn] = useState(initial);
  return (
    <Switch
      checked={on}
      disabled={disabled}
      label="Email notifications"
      onChange={async (next: boolean) => { setOn(next); try { await setEmailPreference(next); } catch { setOn(!next); } }}
    />
  );
}
