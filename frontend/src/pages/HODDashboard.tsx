import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { LayoutGrid, Clock, CheckCircle, XCircle, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useDashboardStats } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { Project } from '@/types/project';

const statusMap: Record<string, string> = {
  on_going: 'On-Going', completed: 'Completed', terminated: 'Terminated',
};

const HODDashboard: React.FC = () => {
  const [selectedPI, setSelectedPI] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedAgency, setSelectedAgency] = useState<string>('all');
  const { profile } = useAuth();
  const { projects: allProjects, isLoading } = useDashboardStats();

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN').format(amount);
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  };

  if (isLoading || !allProjects) {
    return (
      <MainLayout>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      </MainLayout>
    );
  }

  // Filter projects
  const filteredProjects = allProjects.filter((p: Project) => {
    if (selectedDept !== 'all' && p.departments?.name !== selectedDept) return false;
    if (selectedPI !== 'all' && p.profiles?.name !== selectedPI) return false;
    if (selectedAgency !== 'all' && p.funding_agency !== selectedAgency) return false;
    return true;
  });

  // Calculate local stats
  const stats = {
    totalProjects: filteredProjects.length,
    ongoingProjects: filteredProjects.filter((p: Project) => p.status === 'on_going').length,
    completedProjects: filteredProjects.filter((p: Project) => p.status === 'completed').length,
    terminatedProjects: filteredProjects.filter((p: Project) => p.status === 'terminated').length,
    totalSanctioned: filteredProjects.reduce((s: number, p: Project) => s + Number(p.sanctioned_budget), 0),
    totalReceived: filteredProjects.reduce((s: number, p: Project) => s + Number(p.received_budget), 0),
    totalUtilized: filteredProjects.reduce((s: number, p: Project) => s + Number(p.utilized_budget), 0),
    balanceToGet: filteredProjects.reduce((s: number, p: Project) => s + Number(p.sanctioned_budget) - Number(p.received_budget), 0),
    availableBudget: filteredProjects.reduce((s: number, p: Project) => s + Number(p.received_budget) - Number(p.utilized_budget), 0),
  };

  const agencyNames = [...new Set(filteredProjects.map((p: Project) => p.funding_agency))].filter(Boolean) as string[];
  const agencyStats = agencyNames.map(agency => {
    const ap = filteredProjects.filter((p: Project) => p.funding_agency === agency);
    return {
      name: agency,
      'Total Projects': ap.length,
      'Completed': ap.filter((p: Project) => p.status === 'completed').length,
      'Terminated': ap.filter((p: Project) => p.status === 'terminated').length,
      'On-Going': ap.filter((p: Project) => p.status === 'on_going').length,
    };
  });

  const pieData = [
    { name: 'On-Going', value: stats.ongoingProjects, color: 'hsl(199, 89%, 48%)' },
    { name: 'Completed', value: stats.completedProjects, color: 'hsl(24, 95%, 53%)' },
    { name: 'Terminated', value: stats.terminatedProjects, color: 'hsl(0, 72%, 51%)' },
  ];

  const recentProjects = {
    completed: filteredProjects.filter((p: Project) => p.status === 'completed').slice(0, 3),
    ongoing: filteredProjects.filter((p: Project) => p.status === 'on_going').slice(0, 3),
    terminated: filteredProjects.filter((p: Project) => p.status === 'terminated').slice(0, 3),
  };

  const piNames = [...new Set(allProjects.map((p: Project) => p.profiles?.name))].filter(Boolean) as string[];
  const deptNames = [...new Set(allProjects.map((p: Project) => p.departments?.name))].filter(Boolean) as string[];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Filter */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {profile?.role === 'superadmin' && (
              <Select value={selectedDept} onValueChange={setSelectedDept}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {deptNames.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={selectedAgency} onValueChange={setSelectedAgency}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Agency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agencies</SelectItem>
                {agencyNames.map((agency: string) => (
                  <SelectItem key={agency} value={agency}>{agency}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPI} onValueChange={setSelectedPI}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select PI" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All PIs</SelectItem>
                {piNames.map((name: string) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm">Apply</Button>
          </div>
          <Button variant="ghost" size="icon"><Filter className="h-4 w-4" /></Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-chart-4/5 overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-chart-4" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-chart-4/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
            <CardContent className="p-5 flex items-center gap-4 relative z-10">
              <div className="h-12 w-12 rounded-xl bg-chart-4/10 flex items-center justify-center shadow-inner group-hover:bg-chart-4/20 transition-colors">
                <LayoutGrid className="h-6 w-6 text-chart-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Number of projects</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.totalProjects}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-chart-5/5 overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-chart-5" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-chart-5/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
            <CardContent className="p-5 flex items-center gap-4 relative z-10">
              <div className="h-12 w-12 rounded-xl bg-chart-5/10 flex items-center justify-center shadow-inner group-hover:bg-chart-5/20 transition-colors">
                <Clock className="h-6 w-6 text-chart-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">On-going Projects</p>
                <p className="text-xl font-bold">
                  <span className="text-chart-5 text-2xl">{stats.ongoingProjects}</span>
                  <span className="text-muted-foreground text-sm ml-1">/{stats.totalProjects}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-success/5 overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-success" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-success/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
            <CardContent className="p-5 flex items-center gap-4 relative z-10">
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center shadow-inner group-hover:bg-success/20 transition-colors">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Projects</p>
                <p className="text-xl font-bold">
                  <span className="text-success text-2xl">{stats.completedProjects}</span>
                  <span className="text-muted-foreground text-sm ml-1">/{stats.totalProjects}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-destructive/5 overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-destructive" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-destructive/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
            <CardContent className="p-5 flex items-center gap-4 relative z-10">
              <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center shadow-inner group-hover:bg-destructive/20 transition-colors">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Terminated Projects</p>
                <p className="text-xl font-bold">
                  <span className="text-destructive text-2xl">{stats.terminatedProjects}</span>
                  <span className="text-muted-foreground text-sm ml-1">/{stats.totalProjects}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-primary">Revenue Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-sm font-medium">Received Budget</p>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(stats.totalReceived)}</span>
                  <span>{formatCurrency(stats.totalSanctioned)}</span>
                </div>
                <Progress value={stats.totalSanctioned > 0 ? (stats.totalReceived / stats.totalSanctioned) * 100 : 0} className="h-2" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Balance Budget</p>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(stats.balanceToGet)}</span>
                  <span>{formatCurrency(stats.totalReceived)}</span>
                </div>
                <Progress value={stats.totalReceived > 0 ? (stats.balanceToGet / stats.totalReceived) * 100 : 0} className="h-2" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Available Budget</p>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(stats.availableBudget)}</span>
                  <span>{formatCurrency(stats.totalReceived)}</span>
                </div>
                <Progress value={stats.totalReceived > 0 ? (stats.availableBudget / stats.totalReceived) * 100 : 0} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-center">Number of Projects from Agency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agencyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Total Projects" fill="hsl(0, 72%, 51%)" />
                    <Bar dataKey="Completed" fill="hsl(172, 66%, 50%)" />
                    <Bar dataKey="Terminated" fill="hsl(262, 83%, 40%)" />
                    <Bar dataKey="On-Going" fill="hsl(24, 95%, 53%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-primary">Project Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value"
                      label={({ percent }) => `${(percent * 100).toFixed(1)}%`}>
                      {pieData.map((entry: { name: string; value: number; color: string }, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Project Status */}
        <Card className="border-none shadow-md bg-gradient-to-br from-primary/5 via-primary/10 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Project Status</CardTitle>
          </CardHeader>
          <CardContent>
            {(['completed', 'ongoing', 'terminated'] as const).map(status => (
              <div key={status} className="mt-4 space-y-2">
                <p className="text-sm font-medium text-center text-muted-foreground capitalize">{statusMap[status === 'ongoing' ? 'on_going' : status]}</p>
                {recentProjects[status].map((project: Project) => (
                  <div key={project.id} className={cn(
                    "grid grid-cols-5 gap-4 text-sm p-2 rounded",
                    status === 'terminated' ? 'bg-destructive/10' : 'bg-background/50'
                  )}>
                    <div className="truncate">{project.title}</div>
                    <div>{project.funding_agency}</div>
                    <div>{project.profiles?.email}</div>
                    <div>{formatDate(project.sanctioned_date)}</div>
                    <div>{formatCurrency(Number(project.sanctioned_budget))}</div>
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Projects Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg text-primary">Department Projects</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">ID</th>
                    <th className="text-left p-3 font-medium">Title</th>
                    <th className="text-left p-3 font-medium">PI Name</th>
                    <th className="text-left p-3 font-medium">Department</th>
                    <th className="text-left p-3 font-medium">Agency</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Sanctioned</th>
                    <th className="text-left p-3 font-medium">Sanctioned Date</th>
                    <th className="text-left p-3 font-medium">Progress in Budget</th>
                    <th className="text-left p-3 font-medium">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project: Project, idx: number) => (
                    <tr key={project.id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => window.location.href = `/project/${project.id}`}>
                      <td className="p-3">{idx + 1}</td>
                      <td className="p-3 truncate max-w-[150px] font-medium text-primary">{project.title}</td>
                      <td className="p-3">{project.profiles?.name}</td>
                      <td className="p-3">{project.departments?.name}</td>
                      <td className="p-3">{project.funding_agency}</td>
                      <td className="p-3">
                        <span className={cn(
                          project.status === 'completed' && 'text-success',
                          project.status === 'on_going' && 'text-success',
                          project.status === 'terminated' && 'text-destructive'
                        )}>
                          {statusMap[project.status] || project.status}
                        </span>
                      </td>
                      <td className="p-3">₹ {formatCurrency(Number(project.sanctioned_budget))}</td>
                      <td className="p-3">{formatDate(project.sanctioned_date)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div className={cn("h-full", Number(project.utilized_budget) >= Number(project.sanctioned_budget) ? "bg-destructive" : "bg-success")}
                              style={{ width: `${Math.min((Number(project.utilized_budget) / Number(project.sanctioned_budget)) * 100, 100)}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            ₹{formatCurrency(Number(project.utilized_budget))}/{formatCurrency(Number(project.sanctioned_budget))}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">{project.duration_months}m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default HODDashboard;
