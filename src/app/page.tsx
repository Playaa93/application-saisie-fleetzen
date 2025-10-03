import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-fleetzen-teal via-fleetzen-blue to-fleetzen-teal-dark flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl p-8 max-w-md w-full text-center">
        <div className="flex items-center justify-center mb-2">
          <svg className="w-10 h-10 text-fleetzen-teal-dark mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h1 className="text-3xl font-bold text-fleetzen-teal-dark">FleetZen</h1>
        </div>
        <p className="text-muted-foreground mb-8">Suivi des interventions</p>

        <div className="space-y-4">
          <Link
            href="/nouvelle-intervention"
            className="flex items-center justify-center gap-2 w-full bg-fleetzen-teal text-white py-3 rounded-lg font-medium hover:bg-fleetzen-teal-dark transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle intervention
          </Link>

          <Link
            href="/interventions"
            className="flex items-center justify-center gap-2 w-full bg-secondary text-secondary-foreground py-3 rounded-lg font-medium hover:bg-secondary/80 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Voir les interventions
          </Link>
        </div>
      </div>
    </div>
  );
}
