import { useAuthStore } from '../../store/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>First Name</Label><Input defaultValue={user?.firstName} className="mt-1" /></div>
                <div><Label>Last Name</Label><Input defaultValue={user?.lastName} className="mt-1" /></div>
              </div>
              <div><Label>Email</Label><Input defaultValue={user?.email} disabled className="mt-1 bg-gray-50" /></div>
              <Button className="bg-indigo-600 hover:bg-indigo-700">Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Current Password</Label><Input type="password" className="mt-1" /></div>
              <div><Label>New Password</Label><Input type="password" className="mt-1" /></div>
              <div><Label>Confirm New Password</Label><Input type="password" className="mt-1" /></div>
              <Button className="bg-indigo-600 hover:bg-indigo-700">Update Password</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
