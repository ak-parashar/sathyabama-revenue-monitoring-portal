import React from 'react';
import { Project } from '@/types';
import { Building2, Clock, IndianRupee, MessageSquare, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'text-success';
      case 'On-Going':
        return 'text-success';
      case 'Terminated':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN').format(amount);
  };

  return (
    <div
      className="flex rounded-md overflow-hidden bg-card border shadow-sm hover:shadow-md transition-shadow cursor-pointer animate-fade-in"
      onClick={onClick}
    >
      {/* Left maroon section with title */}
      <div className="w-64 bg-primary p-4 flex flex-col justify-center">
        <h3 className="font-semibold text-primary-foreground text-base leading-tight line-clamp-2">
          {project.title}
        </h3>
        <p className="text-primary-foreground/70 text-xs mt-1">
          # {project.referenceId}
        </p>
      </div>

      {/* Right section with details */}
      <div className="flex-1 flex items-center justify-between px-6 py-4">
        {/* Agency */}
        <div className="flex items-center gap-2 min-w-[100px]">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{project.fundingAgency}</span>
        </div>

        {/* Department */}
        <div className="flex items-center gap-2 min-w-[80px]">
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{project.department}</span>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-2 min-w-[120px]">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{project.duration}</span>
        </div>

        {/* Budget */}
        <div className="flex items-center gap-2 min-w-[100px]">
          <IndianRupee className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{formatCurrency(project.sanctionedBudget)}</span>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 min-w-[100px]">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className={cn('text-sm font-medium', getStatusColor(project.status))}>
            {project.status}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
