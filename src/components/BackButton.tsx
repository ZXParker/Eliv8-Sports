import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function BackButton() {
  const navigate = useNavigate();
  
  return (
    <Button 
      variant="ghost" 
      onClick={() => navigate(-1)}
      className="fixed top-4 left-4 z-50 group flex items-center gap-2 hover:gap-3 transition-all duration-300 hover:bg-accent"
    >
      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
      <span className="font-medium">Back</span>
    </Button>
  );
}
