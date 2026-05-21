import { Store } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export default function StorefrontPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Storefront</h1>
      <Card>
        <CardHeader><CardTitle>Storefront Settings</CardTitle></CardHeader>
        <CardContent className="text-center py-12 text-muted-foreground">
          <Store className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Storefront builder coming soon.</p>
          <p className="text-sm mt-1">Customize your public creator page with a unique URL, banner, and theme.</p>
        </CardContent>
      </Card>
    </div>
  );
}
