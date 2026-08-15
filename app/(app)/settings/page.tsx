"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client";
import {
  Checkbox,
  Form,
  Header,
  Message,
  Segment,
} from "semantic-ui-react";
import { UPDATE_GROUP_MODULES } from "@/lib/client/mutations";
import { useGroupModules } from "@/lib/client/useGroupModules";
import { usePermissions } from "@/lib/client/usePermissions";
import type { EnabledModules } from "@/lib/client/types";
import type { StoredEnabledModules } from "@/lib/groupModules";

const MODULE_OPTIONS: Array<{
  key: keyof StoredEnabledModules;
  label: string;
  description: string;
}> = [
  {
    key: "tasks",
    label: "Tasks",
    description: "Task lists, assignments, and time availability. Also enables Skills.",
  },
  {
    key: "events",
    label: "Events",
    description: "Group events calendar and attendance.",
  },
  {
    key: "noticeBoard",
    label: "Notice board",
    description: "Dashboard and public notice posts.",
  },
  {
    key: "memberStats",
    label: "Member stats",
    description: "Section headcounts on the dashboard (Joeys, Cubs, Scouts, etc.).",
  },
];

export default function GroupSettingsPage() {
  const router = useRouter();
  const { permissions, loading: permissionsLoading } = usePermissions();
  const { enabledModules, loading: modulesLoading, refetch } = useGroupModules();
  const [draft, setDraft] = useState<StoredEnabledModules | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [updateModules, { loading: saving }] = useMutation<
    { updateGroupModules: { enabledModules: EnabledModules } },
    { modules: Partial<StoredEnabledModules> }
  >(UPDATE_GROUP_MODULES);

  const canManage = Boolean(
    permissions.canManageGroupModules || permissions.isPlatformAdmin,
  );
  const loading = permissionsLoading || modulesLoading;

  useEffect(() => {
    if (!loading && !canManage) {
      const timer = window.setTimeout(() => {
        router.replace("/dashboard");
      }, 4000);
      return () => window.clearTimeout(timer);
    }
  }, [loading, canManage, router]);

  useEffect(() => {
    if (!modulesLoading && enabledModules) {
      setDraft({
        tasks: enabledModules.tasks,
        events: enabledModules.events,
        noticeBoard: enabledModules.noticeBoard,
        memberStats: enabledModules.memberStats,
      });
    }
  }, [modulesLoading, enabledModules]);

  if (loading || !draft) {
    return (
      <Segment padded>
        <p>Loading…</p>
      </Segment>
    );
  }

  if (!canManage) {
    return (
      <Segment padded>
        <Message warning>
          <Message.Header>Group leader access required</Message.Header>
          <p>
            Only Group Leaders and Assistant Group Leaders can change which
            modules are enabled for this group.
          </p>
        </Message>
      </Segment>
    );
  }

  const onToggle = (key: keyof StoredEnabledModules, checked: boolean) => {
    setDraft((prev) => (prev ? { ...prev, [key]: checked } : prev));
    setSavedMessage(null);
    setErrorMessage(null);
  };

  const onSave = async () => {
    setSavedMessage(null);
    setErrorMessage(null);
    try {
      await updateModules({ variables: { modules: draft } });
      await refetch();
      setSavedMessage("Module settings saved.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not save module settings.",
      );
    }
  };

  return (
    <Segment padded>
      <Header as="h2">Group modules</Header>
      <p>
        Choose which parts of Compass this group uses. Disabled modules are
        hidden from everyone in the group and blocked in the API. Existing data
        is kept but inaccessible until the module is turned back on.
      </p>
      {savedMessage ? <Message positive content={savedMessage} /> : null}
      {errorMessage ? <Message negative content={errorMessage} /> : null}
      <Form onSubmit={(event) => {
        event.preventDefault();
        void onSave();
      }}>
        {MODULE_OPTIONS.map((option) => (
          <Form.Field key={option.key}>
            <Checkbox
              toggle
              checked={draft[option.key]}
              label={option.label}
              onChange={(_event, data) =>
                onToggle(option.key, Boolean(data.checked))
              }
            />
            <p style={{ marginTop: "0.35rem", color: "#555" }}>
              {option.description}
            </p>
          </Form.Field>
        ))}
        <Form.Button primary type="submit" loading={saving} disabled={saving}>
          Save
        </Form.Button>
      </Form>
    </Segment>
  );
}
