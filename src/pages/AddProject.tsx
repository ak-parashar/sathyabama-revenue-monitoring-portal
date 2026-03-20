import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Upload, Plus, Trash2, Loader2, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const AGENCIES = [
  'MoE', 'DST', 'DBT', 'MOES', 'MOEF & CC', 'ISRO', 'DRDO', 'ICMR', 'UGC', 'AICTE'
];

const AddProject: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check for prefilled team member from redirect
  const prefill = location.state?.prefillTeamMember;

  const [formData, setFormData] = useState({
    reference_id: '',
    title: '',
    department_id: profile?.department_id || '',
    duration_months: '',
    funding_agency: '',
    sanctioned_date: undefined as Date | undefined,
    sanctioned_budget: '',
    pi_id: profile?.role === 'pi' ? profile.id : '',
    team_members: prefill ? [prefill.id] : [] as string[],
  });

  const [files, setFiles] = useState<{
    sanction_letter: File | null;
    release_order: File | null;
  }>({
    sanction_letter: null,
    release_order: null,
  });

  // Fetch departments
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/departments');
      return response.data;
    },
  });

  // Fetch PIs
  const { data: piProfiles } = useQuery({
    queryKey: ['pi_profiles'],
    queryFn: async () => {
      const response = await api.get('/profiles?role=pi'); // We'll need to implement this filter in backend
      return response.data ?? [];
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'sanction_letter' | 'release_order') => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [type]: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSubmitting(true);
    try {
      // Create Project via local API
      const response = await api.post('/projects', {
        ...formData,
        duration_months: parseInt(formData.duration_months),
        sanctioned_budget: parseFloat(formData.sanctioned_budget),
        created_by: profile.id,
        status: 'on_going',
      });

      const project = response.data;

      toast({
        title: 'Success',
        description: 'Project created successfully',
      });

      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate(`/project/${project.id}`);
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create project',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Add New Project</h1>
          <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
        </div>

        <Card className="shadow-lg border-primary/10">
          <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
            <CardTitle className="text-xl text-primary flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Plus className="h-5 w-5" />
              </div>
              Project Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="reference_id">Reference ID</Label>
                  <Input
                    id="reference_id"
                    placeholder="e.g. DST/SERB/2024/001"
                    value={formData.reference_id}
                    onChange={e => setFormData(p => ({ ...p, reference_id: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter full project title"
                    value={formData.title}
                    onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select
                    value={formData.department_id}
                    onValueChange={v => setFormData(p => ({ ...p, department_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {(departments ?? []).map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (Months)</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="e.g. 36"
                    value={formData.duration_months}
                    onChange={e => setFormData(p => ({ ...p, duration_months: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Funding Agency</Label>
                  <Select
                    value={formData.funding_agency}
                    onValueChange={v => setFormData(p => ({ ...p, funding_agency: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Agency" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGENCIES.map(agency => (
                        <SelectItem key={agency} value={agency}>{agency}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sanction Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.sanctioned_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.sanctioned_date ? format(formData.sanctioned_date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.sanctioned_date}
                        onSelect={d => setFormData(p => ({ ...p, sanctioned_date: d }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Sanctioned Budget (₹)</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="Enter amount"
                    value={formData.sanctioned_budget}
                    onChange={e => setFormData(p => ({ ...p, sanctioned_budget: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Principal Investigator (PI)</Label>
                  <Select
                    value={formData.pi_id}
                    onValueChange={v => setFormData(p => ({ ...p, pi_id: v }))}
                    disabled={profile?.role === 'pi'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select PI" />
                    </SelectTrigger>
                    <SelectContent>
                      {(piProfiles ?? []).map(pi => (
                        <SelectItem key={pi.id} value={pi.id}>{pi.name} ({pi.email})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {prefill && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserPlus className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Associated Team Member</p>
                      <p className="text-xs text-muted-foreground">{prefill.name} ({prefill.role.toUpperCase()})</p>
                    </div>
                  </div>
                  <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    Will be added to team
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">Project Documents (Year 1)</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Sanction Letter</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        onChange={e => handleFileChange(e, 'sanction_letter')}
                        className="cursor-pointer"
                        accept=".pdf,.doc,.docx"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Release Order</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        onChange={e => handleFileChange(e, 'release_order')}
                        className="cursor-pointer"
                        accept=".pdf,.doc,.docx"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <Button
                  type="submit"
                  className="px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : 'Create Project'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AddProject;
