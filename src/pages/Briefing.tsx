export function BriefingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Briefing</h1>
        <p className="text-muted-foreground">Your top 5 most important updates.</p>
      </div>

      <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
        <h3 className="text-lg font-medium mb-2">Briefing Coming Soon</h3>
        <p className="text-muted-foreground mb-4">
          Your personalized briefing with top 5 cards will appear here.
        </p>
        <p className="text-sm text-muted-foreground">
          Next: We'll add briefing API integration and card displays.
        </p>
      </div>
    </div>
  )
}