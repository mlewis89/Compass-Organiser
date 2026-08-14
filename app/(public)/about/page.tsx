import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Compass Organiser",
  description:
    "Why Compass exists and how it helps scout groups run tasks, events, and members in one place.",
};

export default function AboutPage() {
  return (
    <div className="ui padded segment">
      <h1 className="ui header">About Compass</h1>
      <p>
        Compass Organiser started from a familiar problem in scout groups:
        planning, maintenance, and weekly programs are spread across ad-hoc
        tools. Each group ends up with its own spreadsheets, and the person at
        the top is left chasing jobs that never quite get delegated.
      </p>
      <p>
        The aim is a single system for <strong>one group at a time</strong>,
        with room for many groups on the same platform. Leaders can see what is
        happening. Members can see where they can help.
      </p>

      <h2 className="ui header">What it is built to do</h2>
      <ul className="ui bulleted list">
        <li className="item">
          Give the group a public face for notices and events they choose to
          share.
        </li>
        <li className="item">
          Keep a members-only dashboard for the notice board, upcoming events,
          and tasks that match a person&apos;s skills and available time.
        </li>
        <li className="item">
          Show the members a leader is responsible for — youth sections,
          committee roles, and helpers.
        </li>
        <li className="item">
          Record events with attendees and the details needed to run them.
        </li>
      </ul>

      <h2 className="ui header">How groups are separated</h2>
      <p>
        Compass is not one shared calendar for every scout group. Each group
        has its own members, events, tasks, and notice board. Public visitors
        open a group page such as{" "}
        <Link href="/groups/default">/groups/default</Link>. Members log in and
        work inside their group only.
      </p>

      <h2 className="ui header">Who it is for</h2>
      <p>
        Group leaders who want the group moving forward instead of maintaining
        fragmented systems. Youth members, parents, and adult helpers who can
        take a task when they have the skill and a couple of hours.
      </p>
      <p>
        Compass is a volunteer project. It is not an official Scouts Australia
        product.
      </p>
    </div>
  );
}
