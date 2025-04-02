import React from 'react';

interface AdminPageTitleProps {
  title: string;
  description?: string;
}

const AdminPageTitle: React.FC<AdminPageTitleProps> = ({ title, description }) => {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {description && (
        <p className="text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
};

export default AdminPageTitle; 