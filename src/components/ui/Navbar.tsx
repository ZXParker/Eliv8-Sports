import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Menu, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const sports = [
  { name: 'Baseball', path: '/sports/baseball' },
  { name: 'Basketball', path: '/sports/basketball' },
  { name: 'Biking', path: '/sports/biking' },
  { name: 'Bowling', path: '/sports/bowling' },
  { name: 'Cheer', path: '/sports/cheer' },
  { name: 'Dance', path: '/sports/dance' },
  { name: 'Fitness', path: '/sports/fitness' },
  { name: 'Football', path: '/sports/football' },
  { name: 'Golf', path: '/sports/golf' },
  { name: 'Gymnastics', path: '/sports/gymnastics' },
  { name: 'Hockey', path: '/sports/hockey' },
  { name: 'Lacrosse', path: '/sports/lacrosse' },
  { name: 'Pickleball', path: '/sports/pickleball' },
  { name: 'Rugby', path: '/sports/rugby' },
  { name: 'Soccer', path: '/sports/soccer' },
  { name: 'Softball', path: '/sports/softball' },
  { name: 'Swimming', path: '/sports/swimming' },
  { name: 'Tennis', path: '/sports/tennis' },
  { name: 'Track & Field', path: '/sports/track-and-field' },
  { name: 'Volleyball', path: '/sports/volleyball' }
].sort((a, b) => a.name.localeCompare(b.name));

export function Navbar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lastScrollTop, setLastScrollTop] = useState(0);

  const handleScroll = useCallback(() => {
    const currentScrollTop = window.scrollY;
    setScrolled(currentScrollTop > 20);
    setLastScrollTop(currentScrollTop);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    const handleResize = () => window.innerWidth >= 768 && setIsOpen(false);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleNavigation = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(path);
    setIsOpen(false);
  };

  const handleSportNavigation = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/about${path}`);
    setIsOpen(false);
  };

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled 
          ? "bg-gray-900/95 backdrop-blur-xl border-b border-blue-500/20 shadow-lg shadow-blue-500/5" 
          : "bg-transparent"
      )}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-blue-500/10 animate-pulse" />
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      </div>

      <div className="container flex h-16 md:h-20 items-center relative z-10">
        <Link to="/" className="flex items-center space-x-2 pl-4 md:pl-6">
          <motion.span 
            whileHover={{ scale: 1.05 }}
            className="text-xl md:text-2xl font-bold text-white"
          >
            Elev8 Sports
          </motion.span>
        </Link>

        <div className="hidden md:flex items-center justify-end flex-1 pr-6">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger 
                  className="text-white hover:text-blue-400 transition-colors bg-transparent"
                >
                  All Sports
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-gray-900/95 backdrop-blur-xl border border-blue-500/20">
                  <div className="grid w-[400px] gap-3 p-6 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {sports.map((sport) => (
                      <motion.div
                        key={sport.path}
                        whileHover={{ x: 5, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                      >
                        <a
                          href={`/about${sport.path}`}
                          onClick={handleSportNavigation(sport.path)}
                          className="block select-none rounded-md p-3 text-white hover:text-blue-400 transition-colors group"
                        >
                          <span className="flex items-center justify-between">
                            {sport.name}
                            <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
                          </span>
                        </a>
                      </motion.div>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <a 
                  href="/about"
                  onClick={handleNavigation('/about')}
                  className="inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-white hover:text-blue-400 transition-colors"
                >
                  About
                </a>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center space-x-4 border-l border-blue-500/20 pl-6 ml-6">
            <Button 
              variant="ghost"
              onClick={handleNavigation('/login')}
              className="text-white hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-300"
            >
              Login
            </Button>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Button 
                onClick={handleNavigation('/signup')}
                className="bg-blue-500/20 hover:bg-blue-500/30 text-white group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </motion.div>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden ml-auto mr-4 p-2 text-white hover:bg-blue-500/20 rounded-lg transition-colors"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Menu className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-b border-blue-500/20 md:hidden"
            >
              <nav className="container py-6">
                <div className="space-y-4">
                  <div className="flex space-x-4 pb-4 border-b border-blue-500/20">
                    <Button
                      variant="ghost"
                      className="flex-1 justify-center text-white hover:text-blue-400 hover:bg-blue-500/10"
                      onClick={handleNavigation('/login')}
                    >
                      Sign In
                    </Button>
                    <Button
                      className="flex-1 justify-center bg-blue-500/20 hover:bg-blue-500/30 text-white"
                      onClick={handleNavigation('/signup')}
                    >
                      Get Started
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    className="w-full justify-start text-white hover:text-blue-400 hover:bg-blue-500/10"
                    onClick={handleNavigation('/about')}
                  >
                    About
                  </Button>

                  <div className="pt-4 border-t border-blue-500/20">
                    <div className="text-sm text-gray-400 mb-2 px-4">Sports</div>
                    <div className="grid grid-cols-2 gap-2">
                      {sports.map((sport) => (
                        <Button
                          key={sport.path}
                          variant="ghost"
                          className="justify-start text-white hover:text-blue-400 hover:bg-blue-500/10"
                          onClick={handleSportNavigation(sport.path)}
                        >
                          {sport.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
