import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Compass Organiser",
  description: "How to reach the Compass team or find your group's public page.",
};

export default function ContactPage() {
  return (
    <div className="ui padded segment">
      <h1 className="ui header">Contact</h1>
      <p>
        Compass is the product, not a single scout group. How you get in touch
        depends on what you need.
      </p>

      <h2 className="ui header">Your own group</h2>
      <p>
        Notices, event questions, fees, and volunteering are handled by that
        group — not from this page.
      </p>
      <ul className="ui bulleted list">
        <li className="item">
          Public notices and events: open the group page at{" "}
          <code>/groups/your-group-slug</code>. The sample group is{" "}
          <Link href="/groups/default">/groups/default</Link>.
        </li>
        <li className="item">
          Members: use <strong>Log in</strong> in the header (Clerk) to reach
          the dashboard, tasks, and private events.
        </li>
      </ul>

      <h2 className="ui header">The Compass product</h2>
      <p>
        For bugs, access issues, or ideas about the software itself, open an
        issue on the project repository:
      </p>
      <p>
        <a
          href="https://github.com/mlewis89/Compass-Organiser"
          target="_blank"
          rel="noreferrer"
        >
          github.com/mlewis89/Compass-Organiser
        </a>
      </p>
      <p>
        There is no separate support inbox yet. If you already have a member
        login and cannot reach your group, say so on the issue and include the
        group slug, not your password.
      </p>
    </div>
  );
}
