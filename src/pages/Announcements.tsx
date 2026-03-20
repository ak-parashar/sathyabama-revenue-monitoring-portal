import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Megaphone } from 'lucide-react';

const Announcements: React.FC = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-primary">Announcements</h1>
        
        <Card>
          <CardContent className="p-12 text-center">
            <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No announcements at this time</p>
            <p className="text-sm text-muted-foreground mt-2">
              Check back later for important updates and notifications
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Announcements;
