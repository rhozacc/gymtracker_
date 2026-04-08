"use client";

export function SetupGuide() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-lg font-medium text-accent">Database not connected</h1>
        <p className="text-muted text-sm">
          Your app is deployed but needs a Postgres database. Follow these steps:
        </p>
        <ol className="text-sm space-y-3 list-decimal list-inside text-accent">
          <li>
            Go to the{" "}
            <a
              href="https://vercel.com/marketplace/neon"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-muted"
            >
              Vercel Marketplace
            </a>{" "}
            and add <strong>Neon Postgres</strong>
          </li>
          <li>Link the database to this project</li>
          <li>
            Push the schema:
            <code className="block mt-1 bg-surface border border-border rounded px-3 py-2 text-xs text-muted">
              npx vercel env pull .env.local && npx prisma db push
            </code>
          </li>
          <li>Redeploy the project</li>
        </ol>
        <p className="text-muted text-xs">
          The database connection strings are set automatically when you link Neon to your project.
        </p>
      </div>
    </div>
  );
}
