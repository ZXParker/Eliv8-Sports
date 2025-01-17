import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative mt-auto bg-gradient-to-b from-gray-900/50 to-black backdrop-blur-lg">
      <div className="absolute inset-0">
        <div className="absolute w-full h-full bg-[radial-gradient(circle_500px_at_50%_-100px,rgba(59,130,246,0.1),transparent)]" />
      </div>

      <div className="relative container mx-auto px-6 py-16">
        <motion.div 
          className="flex flex-col md:flex-row justify-between items-center gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Brand */}
          <div className="text-center md:text-left">
            <Link to="/" className="text-4xl font-bold text-white hover:text-blue-400 transition-colors">
              Elev8
            </Link>
            <p className="mt-2 text-gray-400 max-w-md">
              Transform your athletic potential with AI-powered training
            </p>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-8">
            <Link 
              to="/about" 
              className="text-white hover:text-blue-400 transition-colors text-lg"
            >
              About
            </Link>
            <Link 
  to="/signup"
  className="group flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-white transition-all duration-300"
>
  Get Started
  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
</Link>

          </div>
        </motion.div>

        {/* Copyright */}
        <div className="mt-16 pt-8 border-t border-white/10 text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Elev8. All rights reserved.
          </p>
        </div>
      </div>

      {/* Decorative borders */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      </div>
    </footer>
  );
}
