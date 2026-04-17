import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

const ROLE_HIERARCHY: Record<string, { value: string; label: string }[]> = {
  superadmin: [{ value: 'admin', label: 'Department Admin (HOD)' }],
  admin: [{ value: 'pi', label: 'Principal Investigator' }],
  pi: [
    { value: 'co_pi', label: 'Co-Principal Investigator' },
    { value: 'jrf', label: 'JRF' },
    { value: 'assistant', label: 'Project Assistant' },
  ],
};

const CreateUser: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: '', department_id: '', mobile_number: '', project_id: '',
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/departments');
      return response.data;
    },
  });

  // Fetch projects that the current user has access to
  const { data: projects } = useQuery({
    queryKey: ['my_projects'],
    enabled: profile?.role === 'pi' || profile?.role === 'co_pi',
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data;
    },
  });

  const allowedRoles = profile ? (ROLE_HIERARCHY[profile.role] || []) : [];

  // Show project selector when PI/Co-PI creates sub-roles
  const showProjectSelector = (profile?.role === 'pi' || profile?.role === 'co_pi') &&
    ['co_pi', 'jrf', 'assistant', 'student'].includes(formData.role);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // If project_id is 'new', we don't send it to the backend as a real ID
      const submissionData = { ...formData };
      const isNewProject = formData.project_id === 'new';
      if (isNewProject) submissionData.project_id = '';

      const response = await api.post('/users', submissionData);
      const newUser = response.data;

      toast({ title: 'Success', description: `User ${formData.name} created successfully` });

      if (isNewProject) {
        // Redirect to Add Project with the new user's info in state
        navigate('/add-project', {
          state: {
            prefillTeamMember: {
              id: newUser.id,
              name: formData.name,
              role: formData.role
            }
          }
        });
      } else {
        setFormData({ name: '', email: '', password: '', role: '', department_id: '', mobile_number: '', project_id: '' });
      }
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { error?: string } } };
      const errorMsg = apiError.response?.data?.error || 'Failed to create user';
      toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (allowedRoles.length === 0) {
    return (
      <MainLayout>
        <div className="text-center py-12 text-muted-foreground">
          <p>You do not have permission to create users.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-lg mx-auto">
        <Card className="shadow-lg border-primary/10">
          <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
            <CardTitle className="text-xl text-primary flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <UserPlus className="h-5 w-5" />
              </div>
              Create User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} required minLength={8} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={formData.role} onValueChange={v => setFormData(p => ({ ...p, role: v, project_id: '' }))}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    {allowedRoles.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {profile?.role === 'superadmin' && (
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={formData.department_id} onValueChange={v => setFormData(p => ({ ...p, department_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      {(departments ?? []).map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name} - {d.description}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {showProjectSelector && (
                <div className="space-y-2">
                  <Label>Project Association</Label>
                  <Select value={formData.project_id} onValueChange={v => setFormData(p => ({ ...p, project_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select association" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new" className="text-primary font-medium">✨ Create a NEW Project for this user</SelectItem>
                      {(projects ?? []).map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          Existing: {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Assign this user to an existing project or create a new one.
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Mobile Number</Label>
                <Input value={formData.mobile_number} onChange={e => setFormData(p => ({ ...p, mobile_number: e.target.value }))} />
              </div>
              <Button type="submit" className="w-full h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all active:scale-[0.98] text-base font-medium" disabled={isLoading || !formData.role}>
                {isLoading ? 'Creating...' : 'Create User'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default CreateUser;
