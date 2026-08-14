import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GroupPublicView from "@/components/GroupPublicView";
import { findGroupBySlug } from "@/lib/tenancy";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const group = await findGroupBySlug(slug);
  if (!group) {
    return { title: "Group not found" };
  }
  return {
    title: `${group.name} · Compass Organiser`,
    description: `Public notices and events for ${group.name}.`,
  };
}

export default async function GroupPublicPage({ params }: PageProps) {
  const { slug } = await params;
  const group = await findGroupBySlug(slug);
  if (!group) {
    notFound();
  }

  return <GroupPublicView groupName={group.name} groupSlug={group.slug} />;
}
