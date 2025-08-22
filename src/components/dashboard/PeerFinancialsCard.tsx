import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";

interface PeerRow {
  company: string;
  ticker: string;
  rev: string;
  margin: string;
  yoy: string;
}

interface PeerFinancialsCardProps {
  group?: string;
  rows?: PeerRow[];
  as_of?: string;
}

export const PeerFinancialsCard = ({ 
  group = "Industry Peers", 
  rows = [], 
  as_of 
}: PeerFinancialsCardProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Loading...";
    return new Date(dateString).toLocaleDateString();
  };

  const getTrendIcon = (value: string) => {
    if (value.includes('+')) return <TrendingUp className="w-3 h-3 text-green-600" />;
    if (value.includes('-')) return <TrendingDown className="w-3 h-3 text-red-600" />;
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Peer Comparison
        </CardTitle>
        <CardDescription>{group} financial comparison</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Margin</TableHead>
                  <TableHead>YoY Growth</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{row.company}</span>
                        {row.ticker && (
                          <Badge variant="outline" className="text-xs font-mono">
                            {row.ticker}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{row.rev}</TableCell>
                    <TableCell className="font-medium">{row.margin}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{row.yoy}</span>
                        {getTrendIcon(row.yoy)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Financial data is being loaded...</p>
          </div>
        )}
        
        <div className="mt-4 text-xs text-muted-foreground">
          Last updated: {formatDate(as_of)}
        </div>
      </CardContent>
    </Card>
  );
};