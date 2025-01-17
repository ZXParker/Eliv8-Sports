import { motion } from 'framer-motion';
import { Navbar } from '@/components/ui/Navbar';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Target,
  BarChart3,
  ArrowUpRight,
  Flag,
  Compass,
  Gauge
} from 'lucide-react';

const features = [
  {
    icon: Compass,
    title: "Ball Control",
    description: "Advanced AI analysis of dribbling, passing, and ball handling techniques with real-time precision feedback.",
    gradient: "from-green-500/20 via-green-500/10 to-green-500/5"
  },
  {
    icon: Target,
    title: "Shot Mechanics",
    description: "Comprehensive tracking of shooting technique, ball trajectory, power generation, and accuracy.",
    gradient: "from-emerald-500/20 via-emerald-500/10 to-emerald-500/5"
  },
  {
    icon: BarChart3,
    title: "Performance Metrics",
    description: "Detailed analytics including speed, agility, endurance, and position-specific performance indicators.",
    gradient: "from-lime-500/20 via-lime-500/10 to-lime-500/5"
  },
  {
    icon: Gauge,
    title: "Tactical Insights",
    description: "AI-powered game strategy analysis, positioning optimization, and team coordination tracking.",
    gradient: "from-teal-500/20 via-teal-500/10 to-teal-500/5"
  }
];

const categories = [
  {
    title: "Technical Skills",
    features: [
      "Ball control",
      "Passing accuracy",
      "Dribbling technique",
      "First touch",
      "Shooting mechanics",
      "Defensive skills",
      "Tactical positioning",
      "One-on-one skills",
      "Movement off the ball"
    ]
  },
  {
    title: "Game Performance",
    features: [
      "Field awareness",
      "Strategic decision-making",
      "Team coordination",
      "Position-specific skills",
      "Scoring efficiency",
      "Defensive resilience",
      "Offensive creativity",
      "Player communication",
      "Performance consistency"
    ]
  },
  {
    title: "Physical Conditioning",
    features: [
      "Speed metrics",
      "Endurance tracking",
      "Agility assessment",
      "Strength analysis",
      "Recovery monitoring",
      "Power output",
      "Stamina development",
      "Injury prevention",
      "Conditioning progression"
    ]
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

export default function SoccerAbout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
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
                Master Your Soccer Performance
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
                Advanced analytics and AI-powered training to elevate every aspect of your soccer game.
              </p>
            </motion.div>
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
                  <feature.icon className="w-12 h-12 text-green-400 mb-6" />
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

      {/* Categories Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-500" />
                <div className="relative bg-gray-900/50 backdrop-blur-sm p-8 rounded-xl border border-white/10">
                  <h3 className="text-xl font-semibold text-white mb-6">
                    {category.title}
                  </h3>
                  <ul className="space-y-3">
                    {category.features.map((feature, idx) => (
                      <li key={idx} className="text-gray-300 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
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
            <Flag className="w-16 h-16 text-green-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Elevate Your Soccer Skills
            </h2>
            <p className="text-lg text-gray-300">
              Join soccer players who are already using our platform to transform their game.
            </p>
            <Button 
  size="lg" 
  className="bg-blue-500 hover:bg-blue-600 text-white px-8"
>
  <Link to="/signup" className="flex items-center gap-2">
    Get Started
    <ArrowUpRight className="w-4 h-4" />
  </Link>
</Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
