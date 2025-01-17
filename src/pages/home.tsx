import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain,
  Target,
  Trophy,
  Users,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';

// Types
interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
}

interface ColorShiftingCircleProps {
  className?: string;
  delay?: number;
}

interface FeatureCardProps {
  feature: Feature;
  index: number;
}

// Data
const features: Feature[] = [
  {
    icon: Brain,
    title: "Performance Intelligence",
    description: "Unlock your potential with AI-driven analysis that adapts to your unique athletic signature.",
    gradient: "from-blue-600/20 via-blue-600/10 to-blue-600/5"
  },
  {
    icon: Target,
    title: "Elite Training Systems",
    description: "Experience training programs that evolve with you, powered by advanced predictive analytics.",
    gradient: "from-blue-600/20 via-blue-600/10 to-blue-600/5"
  },
  {
    icon: Trophy,
    title: "Athletic Evolution",
    description: "Track your progress with real-time 3D visualization and dynamic performance metrics.",
    gradient: "from-blue-600/20 via-blue-600/10 to-blue-600/5"
  },
  {
    icon: Users,
    title: "Game Intelligence",
    description: "Optimize team dynamics and individual development with comprehensive performance insights.",
    gradient: "from-blue-600/20 via-blue-600/10 to-blue-600/5"
  }
];

const slides = [
  "Game Elevation",
  "Skill Mastery",
  "Athletic Evolution",
  "Power Potential",
  "Training Excellence",
  "Movement Mastery",
  "Peak Performance",
  "Skill Evolution",
  "Athletic Intelligence",
  "Game Mastery",
  "Power Development",
  "Elite Training",
  "Performance Insight",
  "Movement Science",
  "Technical Excellence",
  "Athletic Mastery",
  "Training Evolution",
  "Game Intelligence",
  "Skill Acceleration"
];

const ColorShiftingCircle = ({ className = "", delay = 0 }: ColorShiftingCircleProps) => {
  return (
    <div className={`relative w-6 h-6 ${className}`}>
      <style>
        {`
          @keyframes colorShift {
            0% { background: rgba(59, 130, 246, 0.8); }
            20% { background: rgba(236, 72, 153, 0.8); }
            40% { background: rgba(139, 92, 246, 0.8); }
            60% { background: rgba(52, 211, 153, 0.8); }
            80% { background: rgba(245, 158, 11, 0.8); }
            100% { background: rgba(59, 130, 246, 0.8); }
          }
        `}
      </style>
      <div 
        className="absolute inset-0 rounded-full blur-sm"
        style={{
          animation: `colorShift 10s infinite ${delay}s`,
          animationTimingFunction: "linear"
        }}
      />
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          animation: `colorShift 10s infinite ${delay}s`,
          animationTimingFunction: "linear"
        }}
      />
    </div>
  );
};

const TextSlider = () => {
  return (
    <div className="relative h-14 bg-black/40 backdrop-blur-xl overflow-hidden border-y border-blue-500/20">
      <style>
        {`
          @keyframes slide {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .sliding-text {
            animation: slide 40s linear infinite;
            will-change: transform;
          }
        `}
      </style>

      <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black z-10 pointer-events-none" />
      
      <div className="flex relative">
        <div className="flex sliding-text whitespace-nowrap">
          {[...slides, ...slides].map((slide, idx) => (
            <div
              key={idx}
              className="flex items-center mx-8"
            >
              <span className="text-lg font-bold tracking-wider text-white flex items-center gap-3">
                {slide}
                <ChevronRight className="h-4 w-4 text-blue-400" />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ feature, index }: FeatureCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.15 }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-500/10 rounded-xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
      <Card className="relative h-full bg-background/50 backdrop-blur-sm border border-white/10 p-8 space-y-6 transition-all duration-500 hover:translate-y-[-8px] hover:shadow-2xl hover:shadow-blue-500/20">
        <motion.div 
          className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/30 to-blue-500/20 flex items-center justify-center"
          whileHover={{ scale: 1.1, rotate: 10 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <feature.icon className="h-7 w-7 text-blue-400" />
        </motion.div>
        <h3 className="font-bold text-2xl text-white group-hover:text-blue-400 transition-colors duration-300">
          {feature.title}
        </h3>
        <p className="text-gray-400 leading-relaxed text-lg">{feature.description}</p>
        <motion.div 
          className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          whileHover={{ scale: 1.2, x: 5 }}
        >
          <ArrowRight className="h-6 w-6 text-blue-400" />
        </motion.div>
      </Card>
    </motion.div>
  );
};

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Hero Section with reduced height */}
      <section className="relative min-h-[75vh] overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0">
          <motion.div 
            className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black"
            style={{ y: scrollY * 0.5 }}
          />
          <motion.div 
            className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"
            style={{ y: scrollY * 0.2 }}
          />
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl animate-ping" />
          </div>
        </div>
        
        <motion.div 
          className="relative container mx-auto px-6 flex flex-col items-center justify-center text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-10 max-w-5xl mx-auto"
          >
            <motion.div 
              className="relative"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <ColorShiftingCircle className="absolute -top-8 right-0" />
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white">
                Elevat8 Your Athletic Journey
              </h1>
              <ColorShiftingCircle className="absolute -bottom-8 left-0" delay={0.5} />
            </motion.div>
            <p className="text-xl md:text-2xl lg:text-3xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
              Experience the future of sports training with AI-powered analysis
              and real-time performance enhancement.
            </p>
          </motion.div>
        </motion.div>
      </section>

      <TextSlider />

      {/* Features Section */}
      <section className="py-32 container mx-auto px-6 relative">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl animate-pulse delay-700" />
        </div>
        
        <motion.div 
          className="relative text-center mb-20 space-y-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <motion.div className="relative inline-block">
            <ColorShiftingCircle className="absolute -left-6 -top-6" delay={1} />
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
              Why Choose Elev8?
            </h2>
            <ColorShiftingCircle className="absolute -right-6 -bottom-6" delay={1.5} />
          </motion.div>
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Our platform integrates cutting-edge AI technology with advanced sports science 
            to accelerate your athletic evolution.
          </p>
        </motion.div>

        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </section>
    </>
  );
}
