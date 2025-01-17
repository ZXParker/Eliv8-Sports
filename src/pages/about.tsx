import { motion } from 'framer-motion';
import { 
  Target,
  Share2,
  LineChart,
  TrendingUp,
  Video,
  Award,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/ui/Navbar';

const features = [
  {
    icon: Video,
    title: "Advanced Video Analysis",
    description: "Frame-by-frame analysis with AI-powered feedback for perfect form and technique.",
    gradient: "from-blue-500/20 via-blue-500/10 to-blue-500/5"
  },
  {
    icon: LineChart,
    title: "Performance Tracking",
    description: "Comprehensive statistics and metrics to track your progress over time.",
    gradient: "from-green-500/20 via-green-500/10 to-green-500/5"
  },
  {
    icon: Target,
    title: "Goal Setting",
    description: "Set and track personal goals with AI-assisted improvement plans.",
    gradient: "from-purple-500/20 via-purple-500/10 to-purple-500/5"
  },
  {
    icon: Share2,
    title: "Team Collaboration",
    description: "Share progress and insights between athletes and coaches seamlessly.",
    gradient: "from-amber-500/20 via-amber-500/10 to-amber-500/5"
  }
];

const testimonials = [
  {
    quote: "This platform revolutionized how I track my athletes' progress. The insights are invaluable.",
    author: "Coach Mike Johnson",
    role: "Head Baseball Coach",
    gradient: "from-blue-500/20 via-blue-500/10 to-blue-500/5"
  },
  {
    quote: "The video analysis helped me perfect my swing. I've seen incredible improvement.",
    author: "Sarah Martinez",
    role: "Division I Athlete",
    gradient: "from-green-500/20 via-green-500/10 to-green-500/5"
  }
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative container mx-auto px-6">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-4xl mx-auto text-center space-y-8"
          >
            <motion.div variants={item}>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6">
                Elevate Your Game to New Heights
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
                Using cutting-edge AI technology and advanced analytics to transform athletic performance tracking and development.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center space-y-6"
          >
            <TrendingUp className="w-12 h-12 text-blue-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Transform Your Athletic Journey
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed">
              We believe in empowering athletes and coaches with precise data, intelligent insights, and comprehensive performance tracking. Our platform combines advanced video analysis, statistical tracking, and AI-powered recommendations to help you reach your full potential.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-500`} />
                <div className="relative bg-gray-900/50 backdrop-blur-sm p-8 rounded-xl border border-white/10">
                  <feature.icon className="w-12 h-12 text-blue-400 mb-6" />
                  <h3 className="text-xl font-semibold text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${testimonial.gradient} rounded-xl blur opacity-75`} />
                <div className="relative bg-gray-900/50 backdrop-blur-sm p-8 rounded-xl border border-white/10">
                  <p className="text-lg text-gray-300 italic mb-6">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-semibold text-white">{testimonial.author}</p>
                    <p className="text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center space-y-8"
          >
            <Award className="w-16 h-16 text-blue-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Ready to Transform Your Performance?
            </h2>
            <p className="text-lg text-gray-300">
              Join thousands of athletes and coaches who are already elevating their game with our platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button 
  size="lg" 
  className="bg-blue-500 hover:bg-blue-600 text-white px-8"
>
  <Link to="/signup" className="flex items-center gap-2">
    Get Started
    <ArrowUpRight className="w-4 h-4" />
  </Link>
</Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
