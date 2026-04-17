import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
  Project,
  AddTeamMemberInput,
  AddAnnouncementInput,
  AddReportRequestInput,
  AddTransactionInput,
} from '@/types/project';

export const useProjects = () => {
  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data;
    },
  });
};

export const useProject = (id: string | undefined) => {
  return useQuery({
    queryKey: ['project', id],
    enabled: !!id,
    queryFn: async () => {
      const response = await api.get(`/projects/${id}`);
      return response.data;
    },
  });
};

export const useProjectDocuments = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ['project_years', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const response = await api.get(`/projects/${projectId}`);
      return response.data.years ?? [];
    },
  });
};

export const useProjectTeam = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ['team_members', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const response = await api.get(`/projects/${projectId}`);
      return response.data.team ?? [];
    },
  });
};

export const useProjectActivities = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ['activity_logs', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const response = await api.get(`/projects/${projectId}`);
      return response.data.activities ?? [];
    },
  });
};

export const useReportRequests = () => {
  return useQuery({
    queryKey: ['report_requests'],
    queryFn: async () => {
      const response = await api.get('/report-requests');
      return response.data;
    },
  });
};

export const useDashboardStats = () => {
  const { data: projects, ...rest } = useProjects();

  const stats = projects ? {
    totalProjects: projects.length,
    ongoingProjects: projects.filter((p) => p.status === 'on_going').length,
    completedProjects: projects.filter((p) => p.status === 'completed').length,
    terminatedProjects: projects.filter((p) => p.status === 'terminated').length,
    totalSanctioned: projects.reduce((s, p) => s + Number(p.sanctioned_budget), 0),
    totalReceived: projects.reduce((s, p) => s + Number(p.received_budget), 0),
    totalUtilized: projects.reduce((s, p) => s + Number(p.utilized_budget), 0),
    balanceToGet: projects.reduce((s, p) => s + Number(p.sanctioned_budget) - Number(p.received_budget), 0),
    availableBudget: projects.reduce((s, p) => s + Number(p.received_budget) - Number(p.utilized_budget), 0),
  } : null;

  const agencyStats = projects ? (() => {
    const agencies = [...new Set(projects.map((p) => p.funding_agency))];
    return agencies.map(agency => {
      const ap = projects.filter((p) => p.funding_agency === agency);
      return {
        agency,
        total: ap.length,
        completed: ap.filter((p) => p.status === 'completed').length,
        terminated: ap.filter((p) => p.status === 'terminated').length,
        ongoing: ap.filter((p) => p.status === 'on_going').length,
      };
    });
  })() : [];

  return { projects, stats, agencyStats, ...rest };
};

export const useAddDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: FormData }) => {
      const response = await api.post(`/projects/${projectId}/documents`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project_years', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['activity_logs', variables.projectId] });
    },
  });
};

export const useAddTeamMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: AddTeamMemberInput }) => {
      const response = await api.post(`/projects/${projectId}/team`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team_members', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['activity_logs', variables.projectId] });
    },
  });
};

export const useUpdateProjectStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, status }: { projectId: string; status: string }) => {
      const response = await api.put(`/projects/${projectId}/status`, { status });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['activity_logs', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useAnnouncements = () => {
  return useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const response = await api.get('/announcements');
      return response.data;
    },
  });
};

export const useAddAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AddAnnouncementInput) => {
      const response = await api.post('/announcements', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
};

export const useDeleteAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/announcements/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
};

export const useAddReportRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AddReportRequestInput) => {
      const response = await api.post('/report-requests', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report_requests'] });
    },
  });
};

export const useAddTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: AddTransactionInput }) => {
      const response = await api.post(`/projects/${projectId}/transactions`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['activity_logs', variables.projectId] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/projects/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useDepartments = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/departments');
      return response.data;
    },
  });
};
