import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, Clock, Building2, GraduationCap, Calendar } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const statusMap: Record<string, string> = {
  on_going: 'On-Going',
  completed: 'Completed',
  terminated: 'Terminated',
};

const FacultyHome: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: projects, isLoading } = useProjects();

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-foreground text-background';
      case 'on_going': return 'bg-success text-success-foreground';
      case 'terminated': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN').format(amount);
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const d = String(date.getDate()).padStart(2, '0');
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const y = date.getFullYear();
      return `${d}-${m}-${y}`;
    } catch (e) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </MainLayout>
    );
  }

  const userProjects = projects ?? [];

  return (
    <MainLayout>
      <div className="space-y-4">
        {userProjects.map((project) => (
          <Card
            key={project.id}
            className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden border-border/50 group bg-card/80 backdrop-blur-sm"
            onClick={() => navigate(`/project/${project.id}`)}
          >
            <CardContent className="p-0">
              <div className="flex relative">
                {/* Gradient side stripe */}
                <div className={cn(
                  "w-2.5 shrink-0 transition-colors",
                  project.status === 'completed' ? 'bg-gradient-to-b from-slate-700 to-slate-500' :
                  project.status === 'on_going' ? 'bg-gradient-to-b from-success to-emerald-400' :
                  project.status === 'terminated' ? 'bg-gradient-to-b from-destructive to-red-400' :
                  'bg-gradient-to-b from-primary via-primary/80 to-primary/60'
                )} />

                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground">{project.title}</h3>
                      <p className="text-xs text-muted-foreground">#{project.reference_id}</p>
                    </div>
                    <Badge className={getStatusBadgeClass(project.status)}>
                      {statusMap[project.status] || project.status}
                    </Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-5 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>{project.funding_agency}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      <span>{(project.departments as any)?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{formatCurrency(Number(project.sanctioned_budget))}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Date: {formatDate(project.sanctioned_date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{project.duration_months} months</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {userProjects.length === 0 && (
          <Card className="border-dashed bg-muted/30">
            <CardContent className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Calendar className="h-6 w-6 opacity-50" />
              </div>
              <p className="text-sm font-medium">No projects found.</p>
              {profile?.role === 'pi' && (
                <p className="text-xs">Click "Add Project" to create one.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default FacultyHome;
