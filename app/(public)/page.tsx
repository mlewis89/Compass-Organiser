import Link from "next/link";

const sampleGroupSlug = process.env.DEFAULT_GROUP_SLUG || "default";

export default function HomePage() {
  return (
    <div className="ui padded segment landing-panel">
      <h1 className="ui huge header">
        Compass Organiser
        <div className="sub header">
          A shared workspace for scout groups and volunteer organisations — so
          the running of the group is not stuck in someone&apos;s spreadsheet.
        </div>
      </h1>
      <p className="landing-lead">
        Compass helps a group leader see the notice board, upcoming events, and
        the tasks that still need a pair of hands. Members pick up work that
        matches their skills and the time they actually have.
      </p>
      <p>
        Each group has its own space. Public notices and events live on that
        group&apos;s page. Members log in for the dashboard, private details,
        and task allocation.
      </p>
      <Link className="ui primary button" href={`/groups/${sampleGroupSlug}`}>
        View a sample group page
      </Link>
      <Link className="ui button" href="/about">
        How Compass works
      </Link>

      <h2 className="ui header">What groups get</h2>
      <div className="ui three stackable cards">
        <div className="card">
          <div className="content">
            <div className="header">Notice board</div>
            <div className="description">
              One place for fees, working bees, and last-minute calls for help.
              Public posts appear on the group page; private posts stay with
              members.
            </div>
          </div>
        </div>
        <div className="card">
          <div className="content">
            <div className="header">Events</div>
            <div className="description">
              Camps, BBQs, and weekly programs with dates, location, and who is
              organising. Each group only sees its own calendar.
            </div>
          </div>
        </div>
        <div className="card">
          <div className="content">
            <div className="header">Skill-matched tasks</div>
            <div className="description">
              Delegate work by required skills and available hours, so the load
              is not left on the group leader by default.
            </div>
          </div>
        </div>
      </div>

      <div className="ui stackable two column grid landing-split">
        <div className="column">
          <h3 className="ui header">For families and the public</h3>
          <p>
            Open your group&apos;s public page to see notices and events they
            have chosen to share. You do not need an account for that.
          </p>
        </div>
        <div className="column">
          <h3 className="ui header">For members and leaders</h3>
          <p>
            Log in to manage tasks, see private events, update your skills and
            time, and work from a dashboard that matches your role in the
            group.
          </p>
        </div>
      </div>
    </div>
  );
}
