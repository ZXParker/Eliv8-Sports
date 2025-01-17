// src/components/auth/AuthLayout.tsx
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-screen overflow-hidden bg-gradient-to-b from-background via-background/95 to-accent/20 flex items-center justify-center p-4">
      {/* Animated Background Gradients */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-[100rem] h-[100rem] opacity-30 bg-gradient-radial from-primary/20 via-transparent to-transparent blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -left-1/2 w-[100rem] h-[100rem] opacity-30 bg-gradient-radial from-primary/20 via-transparent to-transparent blur-3xl animate-pulse" />
      </div>
      
      {/* Content Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-lg mx-auto mt-16 sm:mt-0"
      >
        {/* Card Glow Effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-primary/30 rounded-lg blur opacity-75" />
        
        {/* Main Card */}
        <Card className="relative w-full p-6 sm:p-8 backdrop-blur-sm bg-background/95">
          <div className="space-y-6">
            {/* Title Section */}
            <div className="space-y-2 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/90 to-primary/70">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm sm:text-base text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
            
            {/* Form Content */}
            {children}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
