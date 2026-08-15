import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { syncUserFromClerk } from "@/lib/auth/syncUser";
import { isPlatformAdmin } from "@/lib/authz";
import {
  findGroupBySlug,
  hasActiveMembership,
  setActiveGroupCookie,
} from "@/lib/tenancy";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { slug?: string } | null;
  const slug = body?.slug?.trim();
  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const user = await syncUserFromClerk();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const group = await findGroupBySlug(slug);
  if (!group || group.status !== "active") {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const allowed =
    isPlatformAdmin(user.email) ||
    (await hasActiveMembership(user._id, group.id));
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await setActiveGroupCookie(slug);
  return NextResponse.json({
    ok: true,
    group: { _id: group.id, name: group.name, slug: group.slug },
  });
}
