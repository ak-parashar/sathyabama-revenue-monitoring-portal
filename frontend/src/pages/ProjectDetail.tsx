import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Building2, GraduationCap, IndianRupee, Calendar, Clock,
  Download, FileText, UserPlus, Trash2, Check, File, Plus, ChevronDown
} from 'lucide-react';
import { useProject, useProjectDocuments, useProjectTeam, useProjectActivities, useAddDocument, useAddTeamMember, useUpdateProjectStatus, useAddReportRequest, useAddTransaction, useDeleteProject, useDepartments } from '@/hooks/useProjects';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { TeamMember, Department, AddTeamMemberInput } from '@/types/project';

const statusMap: Record<string, string> = {
  on_going: 'On-Going', completed: 'Completed', terminated: 'Terminated',
};

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();

  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const { data: project, isLoading } = useProject(id);
  const { data: documents = [] } = useProjectDocuments(id);
  const { data: teamMembers = [] } = useProjectTeam(id);
  const { data: activities = [] } = useProjectActivities(id);

  const { data: departments = [] } = useDepartments();
  const addDocumentMutation = useAddDocument();
  const addTeamMemberMutation = useAddTeamMember();
  const updateStatusMutation = useUpdateProjectStatus();
  const addReportRequestMutation = useAddReportRequest();
  const addTransactionMutation = useAddTransaction();
  const deleteProjectMutation = useDeleteProject();

  if (isLoading) {
    return <MainLayout><Skeleton className="h-96 w-full" /></MainLayout>;
  }

  if (!project) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Project not found</p>
          <Button onClick={() => navigate('/home')} className="mt-4">Go Back</Button>
        </div>
      </MainLayout>
    );
  }

  const API_BASE_URL = 'http://localhost:5000'; // Should ideally be in env

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN').format(amount);
  const formatDate = (dateString: string, includeTime = true) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const d = String(date.getDate()).padStart(2, '0');
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const y = date.getFullYear();
      if (!includeTime) return `${d}-${m}-${y}`;
      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');
      return `${d}-${m}-${y} ${hh}:${mm}`;
    } catch (e) {
      return dateString;
    }
  };

  const sanctioned = Number(project.sanctioned_budget);
  const received = Number(project.received_budget);
  const utilized = Number(project.utilized_budget);
  const balanceToGet = sanctioned - received;
  const availableBudget = received - utilized;

  const canUpdate = profile?.role === 'jrf' || profile?.role === 'assistant';
  const isPIOfProject = profile?.role === 'pi' && project.pi_id === profile?.id;
  const canUpdateStatus = profile?.role === 'superadmin' || profile?.role === 'admin' || isPIOfProject;

  const getDownloadUrl = (path: string | null) => {
    if (!path) return null;
    return `${API_BASE_URL}/${path.replace(/\\/g, '/')}`;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-foreground text-background';
      case 'on_going': return 'bg-success text-success-foreground';
      case 'terminated': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const investigators = teamMembers.filter(t => ['PI', 'Co-PI'].includes(t.role_on_project));
  const manpower = teamMembers.filter(t => !['PI', 'Co-PI'].includes(t.role_on_project));

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Project Header */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">{project.title}</h1>
            <p className="text-sm text-muted-foreground"># {project.reference_id}</p>
          </div>
          <div className="flex items-center gap-2">
            {canUpdateStatus ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0 h-auto hover:bg-transparent" disabled={updateStatusMutation.isPending}>
                    <Badge className={cn(getStatusBadgeClass(project.status), "cursor-pointer flex items-center gap-1 hover:opacity-80 transition-opacity")}>
                      {statusMap[project.status] || project.status}
                      <ChevronDown className="h-3 w-3" />
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ projectId: id!, status: 'on_going' })}>
                    <Badge className={cn(getStatusBadgeClass('on_going'), "mr-2 w-2 h-2 p-0 rounded-full")} /> On-Going
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ projectId: id!, status: 'completed' })}>
                    <Badge className={cn(getStatusBadgeClass('completed'), "mr-2 w-2 h-2 p-0 rounded-full")} /> Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ projectId: id!, status: 'terminated' })}>
                    <Badge className={cn(getStatusBadgeClass('terminated'), "mr-2 w-2 h-2 p-0 rounded-full")} /> Terminated
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Badge className={getStatusBadgeClass(project.status)}>
                {statusMap[project.status] || project.status}
              </Badge>
            )}
          </div>
          {(profile?.role === 'superadmin' || profile?.role === 'admin') && (
            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-2">
                    <Trash2 className="h-4 w-4" /> Delete Project
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                      This action will soft-delete the project. It will no longer appear in the project list, but the data will remain in the database for archival purposes.
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => {}}>Cancel</Button>
                    <Button 
                      variant="destructive" 
                      onClick={async () => {
                        try {
                          await deleteProjectMutation.mutateAsync(id!);
                          toast({ title: 'Success', description: 'Project deleted successfully' });
                          navigate('/home');
                        } catch (err) {
                          toast({ title: 'Error', description: 'Failed to delete project', variant: 'destructive' });
                        }
                      }}
                      disabled={deleteProjectMutation.isPending}
                    >
                      {deleteProjectMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {/* Project Info Grid */}
        <Card className="overflow-hidden border-none shadow-md bg-card/50 backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="grid grid-cols-5 divide-x">
              <div className="p-4 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 transition-colors group cursor-default">
                <div className="p-3 bg-primary/10 rounded-full group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300 shadow-sm">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-center">{project.funding_agency}</span>
              </div>
              <div className="p-4 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 transition-colors group cursor-default">
                <div className="p-3 bg-primary/10 rounded-full group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300 shadow-sm">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-center text-balance">{project.departments?.name}</span>
              </div>
              <div className="p-4 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 transition-colors group cursor-default">
                <div className="p-3 bg-primary/10 rounded-full group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300 shadow-sm">
                  <IndianRupee className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-center">{formatCurrency(sanctioned)}</span>
              </div>
              <div className="p-4 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 transition-colors group cursor-default">
                <div className="p-3 bg-primary/10 rounded-full group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300 shadow-sm">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-center">{formatDate(project.sanctioned_date, false)}</span>
              </div>
              <div className="p-4 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 transition-colors group cursor-default">
                <div className="p-3 bg-primary/10 rounded-full group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300 shadow-sm">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-center">{project.duration_months} months</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Information */}
        <Card className="border-t-4 border-t-primary shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-3 bg-muted/30">
            <CardTitle className="text-lg text-primary flex items-center justify-between w-full">
              <span className="flex items-center gap-2"><IndianRupee className="h-5 w-5" /> Financial Overview</span>
              {canUpdateStatus && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                       Record Transaction
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Record Financial Transaction</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const data = {
                        type: formData.get('type') as 'received' | 'spent' | 'stipend',
                        amount: Number(formData.get('amount')),
                        description: String(formData.get('description') ?? '')
                      };
                      try {
                        await addTransactionMutation.mutateAsync({ projectId: id!, data });
                        toast({ title: 'Success', description: 'Transaction recorded successfully' });
                      } catch (err: unknown) {
                        const apiErr = err as { response?: { data?: { error?: string } } };
                        toast({ title: 'Error', description: apiErr.response?.data?.error || 'Failed to record transaction', variant: 'destructive' });
                      }
                    }} className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">Transaction Type</Label>
                        <select name="type" id="type" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" required>
                          <option value="spent">Expense (Spent)</option>
                          <option value="stipend">Stipend Released</option>
                          <option value="received">Fund Received</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount (₹)</Label>
                        <Input id="amount" name="amount" type="number" step="0.01" required placeholder="0.00" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" placeholder="e.g. Equipment Purchase, Student Monthly Stipend" required />
                      </div>
                      <Button type="submit" className="w-full" disabled={addTransactionMutation.isPending}>
                        {addTransactionMutation.isPending ? 'Recording...' : 'Record Transaction'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="flex flex-col gap-1 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                <span className="text-sm text-muted-foreground font-medium">Utilized Budget</span>
                <div className="flex items-center gap-1 text-xl font-bold">
                  <IndianRupee className="h-5 w-5 text-muted-foreground" />
                  {formatCurrency(utilized)}
                </div>
              </div>
              <div className="flex flex-col gap-1 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                <span className="text-sm text-muted-foreground font-medium">Received Budget</span>
                <div className="flex items-center gap-1 text-xl font-bold">
                  <IndianRupee className="h-5 w-5 text-muted-foreground" />
                  {formatCurrency(received)}
                </div>
              </div>
              <div className="flex flex-col gap-1 p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors border border-orange-100 dark:border-orange-900/30">
                <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">Balance to get</span>
                <div className="flex items-center gap-1 text-xl font-bold text-orange-700 dark:text-orange-300">
                  <IndianRupee className="h-5 w-5" />
                  {formatCurrency(balanceToGet)}
                </div>
              </div>
              <div className="flex flex-col gap-1 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors border border-emerald-100 dark:border-emerald-900/30">
                <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Available budget</span>
                <div className="flex items-center gap-1 text-xl font-bold text-emerald-700 dark:text-emerald-300">
                  <IndianRupee className="h-5 w-5" />
                  <span className={cn(availableBudget < 0 ? 'text-destructive' : '')}>
                    {formatCurrency(availableBudget)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Documents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg text-primary">Project Documents</CardTitle>
            <div className="flex gap-2">
              {canUpdate && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Plus className="h-4 w-4" /> Add Update
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add Project Update / Document</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      try {
                        await addDocumentMutation.mutateAsync({ projectId: id!, data: formData });
                        toast({ title: 'Success', description: 'Update added successfully' });
                      } catch (err: unknown) {
                        const apiErr = err as { response?: { data?: { error?: string } } };
                        toast({ title: 'Error', description: apiErr.response?.data?.error || 'Failed to add update', variant: 'destructive' });
                      }
                    }} className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="year">Project Year</Label>
                          <Input id="year" name="year" type="number" required placeholder="e.g. 2" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="fund">Fund Received (₹)</Label>
                          <Input id="fund" name="fund" type="number" step="0.01" placeholder="0.00" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="remarks">Remarks</Label>
                        <Input id="remarks" name="remarks" placeholder="Enter status/remarks" />
                      </div>
                      <div className="space-y-2">
                        <Label>Release Order</Label>
                        <Input type="file" name="release_order" />
                      </div>
                      <div className="space-y-2">
                        <Label>Sanction Letter</Label>
                        <Input type="file" name="sanction_letter" />
                      </div>
                      <div className="space-y-2">
                        <Label>Utilization Certificate</Label>
                        <Input type="file" name="utilization_certificate" />
                      </div>
                      <Button type="submit" className="w-full" disabled={addDocumentMutation.isPending}>
                        {addDocumentMutation.isPending ? 'Uploading...' : 'Submit Update'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
              {isPIOfProject && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={async () => {
                    try {
                      await addReportRequestMutation.mutateAsync({
                        project_id: id,
                        type: 'summary',
                        description: `General summary report request for ${project.title}`
                      });
                      toast({ title: 'Success', description: 'Report request submitted' });
                    } catch (_err: unknown) {
                      toast({ title: 'Error', description: 'Failed to request report', variant: 'destructive' });
                    }
                  }}
                  disabled={addReportRequestMutation.isPending}
                >
                  <FileText className="h-4 w-4" /> 
                  {addReportRequestMutation.isPending ? 'Requesting...' : 'Request Report'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Year</TableHead>
                  <TableHead>Release Order</TableHead>
                  <TableHead>Sanction Letter</TableHead>
                  <TableHead>Utilization Certificates</TableHead>
                  <TableHead>Fund</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.length > 0 ? documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.year}</TableCell>
                    <TableCell>
                      {doc.release_order ? (
                        <Button asChild variant="default" size="sm" className="h-7 text-xs">
                          <a href={getDownloadUrl(doc.release_order) || '#'} target="_blank" rel="noopener noreferrer">
                            <Download className="h-3 w-3 mr-1" />Attachment
                          </a>
                        </Button>
                      ) : <span className="text-destructive text-sm">No Attachment</span>}
                    </TableCell>
                    <TableCell>
                      {doc.sanction_letter ? (
                        <Button asChild variant="default" size="sm" className="h-7 text-xs">
                          <a href={getDownloadUrl(doc.sanction_letter) || '#'} target="_blank" rel="noopener noreferrer">
                            <Download className="h-3 w-3 mr-1" />Attachment
                          </a>
                        </Button>
                      ) : <span className="text-destructive text-sm">No Attachment</span>}
                    </TableCell>
                    <TableCell>
                      {doc.utilization_certificate ? (
                        <Button asChild variant="default" size="sm" className="h-7 text-xs">
                          <a href={getDownloadUrl(doc.utilization_certificate) || '#'} target="_blank" rel="noopener noreferrer">
                            <Download className="h-3 w-3 mr-1" />Attachment
                          </a>
                        </Button>
                      ) : <span className="text-destructive text-sm">No Attachment</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <IndianRupee className="h-3 w-3" />{formatCurrency(Number(doc.fund))}
                      </div>
                    </TableCell>
                    <TableCell>{doc.remarks || 'NIL'}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No documents uploaded yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Team */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg text-primary">Team</CardTitle>
            {(profile?.role === 'pi' || profile?.role === 'co_pi' || profile?.role === 'admin' || profile?.role === 'superadmin') && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/20">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const memberData = Object.fromEntries(formData) as unknown as AddTeamMemberInput;
                    try {
                      await addTeamMemberMutation.mutateAsync({
                        projectId: id!,
                        data: memberData,
                      });
                      toast({ title: 'Success', description: 'Team member added successfully' });
                    } catch (err: unknown) {
                      const apiErr = err as { response?: { data?: { error?: string } } };
                      toast({ title: 'Error', description: apiErr.response?.data?.error || 'Failed to add team member', variant: 'destructive' });
                    }
                  }} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" name="email" type="email" required placeholder="user@ssn.edu" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role on Project</Label>
                      <select name="role" id="role" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" required>
                        <option value="co_pi">Co-PI</option>
                        <option value="jrf">JRF</option>
                        <option value="assistant">Assistant</option>
                        <option value="student">Student</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department_id">Department</Label>
                      <select name="department_id" id="department_id" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" required>
                        <option value="">Select Department</option>
                        {departments.map((dept: Department) => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stipend">Stipend / Month (₹)</Label>
                      <Input id="stipend" name="stipend" type="number" step="0.01" defaultValue="0" />
                    </div>
                    <Button type="submit" className="w-full" disabled={addTeamMemberMutation.isPending}>
                      {addTeamMemberMutation.isPending ? 'Adding...' : 'Add Member'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-secondary/50">Name</TableHead>
                  <TableHead className="bg-secondary/50">Email</TableHead>
                  <TableHead className="bg-secondary/50">Role</TableHead>
                  <TableHead className="bg-secondary/50">Department</TableHead>
                  <TableHead className="bg-secondary/50">Stipend</TableHead>
                  <TableHead className="bg-secondary/50">Mobile Number</TableHead>
                  <TableHead className="bg-secondary/50">Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investigators.length > 0 && (
                  <>
                    <TableRow>
                      <TableCell colSpan={7} className="bg-muted/50 text-center font-medium py-2">Investigators</TableCell>
                    </TableRow>
                    {investigators.map((member: TeamMember) => {
                      const p = member.profiles;
                      return (
                        <TableRow 
                          key={member.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setSelectedMember(member)}
                        >
                          <TableCell>{p?.name}</TableCell>
                          <TableCell>{p?.email}</TableCell>
                          <TableCell>{member.role_on_project}</TableCell>
                          <TableCell>{p?.departments?.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <IndianRupee className="h-3 w-3" />{member.stipend ?? 0}
                            </div>
                          </TableCell>
                          <TableCell>{p?.mobile_number}</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      );
                    })}
                  </>
                )}
                {manpower.length > 0 && (
                  <>
                    <TableRow>
                      <TableCell colSpan={7} className="bg-muted/50 text-center font-medium py-2">Man Power</TableCell>
                    </TableRow>
                    {manpower.map((member: TeamMember) => {
                      const p = member.profiles;
                      return (
                        <TableRow 
                          key={member.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setSelectedMember(member)}
                        >
                          <TableCell>{p?.name}</TableCell>
                          <TableCell>{p?.email}</TableCell>
                          <TableCell>{member.role_on_project}</TableCell>
                          <TableCell>{p?.departments?.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <IndianRupee className="h-3 w-3" />{formatCurrency(Number(member.stipend ?? 0))}
                            </div>
                          </TableCell>
                          <TableCell>{p?.mobile_number}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </>
                )}
                {teamMembers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No team members added yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Profile Dialog */}
        <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
          <DialogContent className="sm:max-w-md overflow-hidden p-0 border-none shadow-2xl">
            <div className="h-32 w-full bg-gradient-to-r from-primary/80 via-primary to-primary/80 relative">
              <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
            </div>
            <DialogHeader className="sr-only">
              <DialogTitle>Team Member Profile</DialogTitle>
            </DialogHeader>
            {selectedMember && (
              <div className="flex flex-col items-center px-6 pb-8 relative">
                <Avatar className="h-28 w-28 ring-4 ring-background shadow-xl absolute -top-14 transition-transform hover:scale-105 duration-300">
                  <AvatarImage src={selectedMember.profiles?.avatar_url ? getDownloadUrl(selectedMember.profiles?.avatar_url) : undefined} className="object-cover" />
                  <AvatarFallback className="text-4xl font-bold bg-muted text-primary">
                    {selectedMember.profiles?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="text-center space-y-2 mt-16 w-full">
                  <h3 className="text-2xl font-bold tracking-tight">{selectedMember.profiles?.name}</h3>
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="secondary" className="px-3 py-1 font-semibold uppercase tracking-wider text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                      {selectedMember.role_on_project}
                    </Badge>
                  </div>
                </div>

                <div className="w-full space-y-4 mt-8 bg-muted/30 p-5 rounded-2xl border border-border/50">
                  <div className="flex items-center justify-between text-sm group">
                    <span className="text-muted-foreground font-medium flex items-center gap-2"><UserPlus className="h-4 w-4 text-muted-foreground/70" /> Email</span>
                    <span className="font-semibold truncate max-w-[200px]" title={selectedMember.profiles?.email}>{selectedMember.profiles?.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm group">
                    <span className="text-muted-foreground font-medium flex items-center gap-2"><GraduationCap className="h-4 w-4 text-muted-foreground/70" /> Department</span>
                    <span className="font-semibold text-right">{selectedMember.profiles?.departments?.name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm group">
                    <span className="text-muted-foreground font-medium flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground/70" /> Mobile</span>
                    <span className="font-semibold">{selectedMember.profiles?.mobile_number || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm group">
                    <span className="text-muted-foreground font-medium flex items-center gap-2"><IndianRupee className="h-4 w-4 text-muted-foreground/70" /> Stipend</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                      <IndianRupee className="h-3 w-3 mr-[1px]" />
                      {formatCurrency(Number(selectedMember.stipend ?? 0))}
                      <span className="text-xs font-normal text-muted-foreground ml-1">/ mo</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm group pt-3 border-t border-border/50">
                    <span className="text-muted-foreground font-medium flex items-center gap-2"><Check className="h-4 w-4 text-muted-foreground/70" /> Active Projects</span>
                    <span className="font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                      {selectedMember.project_count || 1}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Activities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg text-primary">Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-secondary/50">Type</TableHead>
                  <TableHead className="bg-secondary/50">Description</TableHead>
                  <TableHead className="bg-secondary/50">Revenue Information</TableHead>
                  <TableHead className="bg-secondary/50">
                    <Clock className="h-4 w-4" />
                  </TableHead>
                  <TableHead className="bg-secondary/50">Attachment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.type.replace(/_/g, ' ')}</TableCell>
                    <TableCell>{activity.description}</TableCell>
                    <TableCell>
                      {activity.amount != null && (
                        <div className={cn(
                          'inline-flex items-center gap-1 px-3 py-1 rounded text-sm font-medium',
                          Number(activity.amount) >= 0 ? 'revenue-positive' : 'revenue-negative'
                        )}>
                          <IndianRupee className="h-3 w-3" />
                          {formatCurrency(Math.abs(Number(activity.amount)))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(activity.created_at)}
                    </TableCell>
                    <TableCell>
                      {activity.attachment ? (
                        <Button asChild variant="default" size="sm" className="h-7 text-xs">
                          <a href={getDownloadUrl(activity.attachment) || '#'} target="_blank" rel="noopener noreferrer">
                            <Download className="h-3 w-3 mr-1" />Attachment
                          </a>
                        </Button>
                      ) : (
                        <span className="text-destructive text-sm">No Attachment</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {activities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No activities recorded yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ProjectDetail;
