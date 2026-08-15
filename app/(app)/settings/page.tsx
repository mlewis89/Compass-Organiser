"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApolloError, useMutation } from "@apollo/client";
import {
  Button,
  Checkbox,
  Form,
  Header,
  Message,
  Segment,
} from "semantic-ui-react";
import { UPDATE_GROUP_MODULES } from "@/lib/client/mutations";
import { QUERY_MY_GROUPS } from "@/lib/client/queries";
import { useGroupModules } from "@/lib/client/useGroupModules";
import { usePermissions } from "@/lib/client/usePermissions";
import type { GroupSummary } from "@/lib/client/types";
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

function mutationErrorMessage(error: unknown): string {
  if (error instanceof ApolloError) {
    const fromGraphQL = error.graphQLErrors[0]?.message;
    if (fromGraphQL) {
      return fromGraphQL;
    }
    if (error.networkError) {
      return error.networkError.message;
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Could not save module settings.";
}

export default function GroupSettingsPage() {
  const router = useRouter();
  const { permissions, loading: permissionsLoading } = usePermissions();
  const { enabledModules, loading: modulesLoading, refetch } = useGroupModules();
  const [draft, setDraft] = useState<StoredEnabledModules | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [updateModules, { loading: saving }] = useMutation<
    { updateGroupModules: GroupSummary },
    { modules: StoredEnabledModules }
  >(UPDATE_GROUP_MODULES, {
    refetchQueries: [{ query: QUERY_MY_GROUPS }],
    awaitRefetchQueries: true,
  });

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

  // Sync from server only when loaded values change — not on every render.
  useEffect(() => {
    if (modulesLoading) {
      return;
    }
    setDraft({
      tasks: enabledModules.tasks,
      events: enabledModules.events,
      noticeBoard: enabledModules.noticeBoard,
      memberStats: enabledModules.memberStats,
    });
  }, [
    modulesLoading,
    enabledModules.tasks,
    enabledModules.events,
    enabledModules.noticeBoard,
    enabledModules.memberStats,
  ]);

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
    if (!draft || saving) {
      return;
    }
    setSavedMessage(null);
    setErrorMessage(null);
    try {
      const result = await updateModules({ variables: { modules: draft } });
      if (result.errors?.length) {
        setErrorMessage(result.errors[0]?.message ?? "Could not save module settings.");
        return;
      }
      if (!result.data?.updateGroupModules) {
        setErrorMessage("Could not save module settings.");
        return;
      }
      await refetch();
      setSavedMessage("Module settings saved.");
    } catch (error) {
      setErrorMessage(mutationErrorMessage(error));
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
      <Form
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          void onSave();
        }}
      >
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
        <Button
          primary
          type="button"
          loading={saving}
          disabled={saving}
          onClick={() => {
            void onSave();
          }}
        >
          Save
        </Button>
      </Form>
    </Segment>
  );
}
