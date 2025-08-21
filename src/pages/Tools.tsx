export function ToolsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tools</h1>
        <p className="text-muted-foreground">Manage your data sources and triggers.</p>
      </div>

      <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
        <h3 className="text-lg font-medium mb-2">Tools Coming Soon</h3>
        <p className="text-muted-foreground mb-4">
          Company management, topic creation, and data import tools will be available here.
        </p>
        <p className="text-sm text-muted-foreground">
          Next: We'll add forms for companies, topics, and file uploads.
        </p>
      </div>
    </div>
  )
}