import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Download, Filter } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const statusMap: Record<string, string> = {
  on_going: 'On-Going', completed: 'Completed', terminated: 'Terminated',
};

const ProjectsTable: React.FC = () => {
  const navigate = useNavigate();
  const { data: projects, isLoading } = useProjects();
  const [filters, setFilters] = useState({
    title: '', department: '', agency: '', status: '',
  });
  const [selectedDocs, setSelectedDocs] = useState({
    sanctionLetter: false, utilizationCertificates: false,
    releaseOrder: false, activitiesReports: false,
  });

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN').format(amount);
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-success';
      case 'on_going': return 'text-success';
      case 'terminated': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const filteredProjects = (projects ?? []).filter(project => {
    if (filters.title && !project.title.toLowerCase().includes(filters.title.toLowerCase())) return false;
    if (filters.department && !(project.departments?.name || '').toLowerCase().includes(filters.department.toLowerCase())) return false;
    if (filters.agency && !project.funding_agency.toLowerCase().includes(filters.agency.toLowerCase())) return false;
    if (filters.status && !(statusMap[project.status] || '').toLowerCase().includes(filters.status.toLowerCase())) return false;
    return true;
  });

  if (isLoading) {
    return <MainLayout><Skeleton className="h-96 w-full" /></MainLayout>;
  }

  return (
    <MainLayout>
      <Card>
        <CardHeader className="bg-primary text-primary-foreground rounded-t-lg flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Project Display Table</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox id="sanctionLetter" checked={selectedDocs.sanctionLetter}
                onCheckedChange={(checked) => setSelectedDocs(prev => ({ ...prev, sanctionLetter: !!checked }))}
                className="border-primary-foreground data-[state=checked]:bg-primary-foreground data-[state=checked]:text-primary" />
              <label htmlFor="sanctionLetter" className="text-sm">Sanction Letter</label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="utilizationCertificates" checked={selectedDocs.utilizationCertificates}
                onCheckedChange={(checked) => setSelectedDocs(prev => ({ ...prev, utilizationCertificates: !!checked }))}
                className="border-primary-foreground data-[state=checked]:bg-primary-foreground data-[state=checked]:text-primary" />
              <label htmlFor="utilizationCertificates" className="text-sm">Utilization Certificates</label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="releaseOrder" checked={selectedDocs.releaseOrder}
                onCheckedChange={(checked) => setSelectedDocs(prev => ({ ...prev, releaseOrder: !!checked }))}
                className="border-primary-foreground data-[state=checked]:bg-primary-foreground data-[state=checked]:text-primary" />
              <label htmlFor="releaseOrder" className="text-sm">Release Order</label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="activitiesReports" checked={selectedDocs.activitiesReports}
                onCheckedChange={(checked) => setSelectedDocs(prev => ({ ...prev, activitiesReports: !!checked }))}
                className="border-primary-foreground data-[state=checked]:bg-primary-foreground data-[state=checked]:text-primary" />
              <label htmlFor="activitiesReports" className="text-sm">Activities Reports</label>
            </div>
            <Button variant="secondary" size="sm" className="text-primary">
              <Download className="h-4 w-4 mr-1" />Get Documents
            </Button>
            <Button variant="secondary" size="sm" className="text-destructive">
              <Download className="h-4 w-4 mr-1" />Export as CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Id</TableHead>
                  <TableHead>Reference ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Duration (months)</TableHead>
                  <TableHead>Agency</TableHead>
                  <TableHead>Sanctioned Budget (₹)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sanctioned Date</TableHead>
                  <TableHead>PI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-muted/30">
                  <TableCell><Filter className="h-3 w-3 text-muted-foreground" /></TableCell>
                  <TableCell></TableCell>
                  <TableCell>
                    <Input className="h-8" placeholder="" value={filters.title}
                      onChange={(e) => setFilters(prev => ({ ...prev, title: e.target.value }))} />
                  </TableCell>
                  <TableCell>
                    <Input className="h-8" placeholder="" value={filters.department}
                      onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))} />
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell>
                    <Input className="h-8" placeholder="" value={filters.agency}
                      onChange={(e) => setFilters(prev => ({ ...prev, agency: e.target.value }))} />
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell>
                    <Input className="h-8" placeholder="" value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))} />
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>

                {filteredProjects.map((project, idx) => (
                  <TableRow key={project.id} className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/project/${project.id}`)}>
                    <TableCell className="font-medium">{idx + 1}</TableCell>
                    <TableCell className="text-primary hover:underline">{project.reference_id}</TableCell>
                    <TableCell className="text-primary hover:underline truncate max-w-[150px]">{project.title}</TableCell>
                    <TableCell>{project.departments?.name}</TableCell>
                    <TableCell>{project.duration_months}</TableCell>
                    <TableCell>{project.funding_agency}</TableCell>
                    <TableCell>{formatCurrency(Number(project.sanctioned_budget))}</TableCell>
                    <TableCell>
                      <span className={cn('font-medium', getStatusColor(project.status))}>
                        {statusMap[project.status] || project.status}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(project.sanctioned_date)}</TableCell>
                    <TableCell>{project.profiles?.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default ProjectsTable;
