import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PlaceholderPageProps = {
  title: string;
  description: string;
  phase?: string;
};

export function PlaceholderPage({ title, description, phase = "Phase 3+" }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Đang phát triển</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Module này sẽ được triển khai trong {phase}.
        </CardContent>
      </Card>
    </div>
  );
}
