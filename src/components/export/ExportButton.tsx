import { useState } from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExportModal } from './ExportModal';

interface ExportButtonProps {
  dashboardData?: any[];
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export const ExportButton = ({ 
  dashboardData = [], 
  variant = 'outline',
  size = 'sm',
  className 
}: ExportButtonProps) => {
  const [showExportModal, setShowExportModal] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowExportModal(true)}
        className={className}
      >
        <FileText className="w-4 h-4 mr-2" />
        Export PDF
      </Button>
      
      <ExportModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        dashboardData={dashboardData}
      />
    </>
  );
};