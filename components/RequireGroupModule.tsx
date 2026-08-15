"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Segment } from "semantic-ui-react";
import { useGroupModules } from "@/lib/client/useGroupModules";
import type { ModuleKey } from "@/lib/groupModules";

type Props = {
  module: ModuleKey;
  children: React.ReactNode;
};

/** Redirects to dashboard when the active group has this module disabled. */
export default function RequireGroupModule({ module, children }: Props) {
  const router = useRouter();
  const { enabledModules, loading } = useGroupModules();

  useEffect(() => {
    if (!loading && !enabledModules[module]) {
      router.replace("/dashboard");
    }
  }, [loading, enabledModules, module, router]);

  if (loading) {
    return (
      <Segment padded>
        <p>Loading…</p>
      </Segment>
    );
  }

  if (!enabledModules[module]) {
    return null;
  }

  return <>{children}</>;
}
