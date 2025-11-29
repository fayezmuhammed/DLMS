import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Book, bookService } from '@/services/bookService';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

// Import Google Fonts in your main index.html or add here if using CSS-in-JS

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const slideUp = {
  hidden: { y: 30, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  }
};

const HomePage: React.FC = () => {
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [newArrivals, setNewArrivals] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  
  // Text animations
  const [letterIndex, setLetterIndex] = useState(0);
  const wordArray = ['Knowledge', 'Adventure', 'Inspiration', 'Imagination'];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLetterIndex((prev) => (prev + 1) % wordArray.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Check if user is logged in and get their role
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }

    // Fetch books from API
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const response = await bookService.getBooks();
        const books = response.data || [];
        
        if (books.length > 0) {
          // Get featured books (random selection)
          if (books.length > 3) {
            const randomBooks = [...books].sort(() => 0.5 - Math.random()).slice(0, 3);
            setFeaturedBooks(randomBooks);
          } else {
            setFeaturedBooks(books);
          }
          
          // Get newest books by creation date
          const sorted = [...books].sort((a, b) => 
            new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
          ).slice(0, 4);
          setNewArrivals(sorted);
        }
      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Modern with illustration */}
      <motion.section 
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-b from-indigo-50 to-white"
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]"></div>
          <motion.div 
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.3, 0.4, 0.3] 
            }}
            transition={{ 
              duration: 8, 
              ease: "easeInOut", 
              repeat: Infinity 
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-[500px] bg-indigo-100 rounded-full blur-[120px] opacity-30"
          ></motion.div>
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3] 
            }}
            transition={{ 
              duration: 10, 
              ease: "easeInOut", 
              repeat: Infinity 
            }}
            className="absolute left-1/4 top-1/4 w-96 h-96 bg-blue-100 rounded-full blur-[120px] opacity-30"
          ></motion.div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="flex-1 space-y-8 text-center lg:text-left"
            >
              <motion.div variants={slideUp}>
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-gray-900 font-['Playfair_Display',serif]">
                  <span className="block">Discover Your Next</span>
                  <motion.span 
                    key={letterIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600"
                  >
                    {wordArray[letterIndex]}
                  </motion.span>
                </h1>
              </motion.div>
              
              <motion.p 
                variants={slideUp}
                className="text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0 font-['Inter',sans-serif] leading-relaxed"
              >
                Explore our vast collection of books, e-books, and resources to fuel your imagination and expand your knowledge.
              </motion.p>
              
              <motion.div 
                variants={slideUp}
                className="flex flex-wrap gap-4 justify-center lg:justify-start"
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    asChild
                    size="lg"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 rounded-full text-lg"
                  >
                    <Link to="/books">Explore Collection</Link>
                  </Button>
                </motion.div>
                
                {!user && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      asChild
                      variant="outline"
                      size="lg"
                      className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-8 rounded-full text-lg"
                    >
                      <Link to="/login">Sign In</Link>
                    </Button>
                  </motion.div>
                )}
                
                {user?.role?.toLowerCase() === 'admin' && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      asChild
                      variant="outline"
                      size="lg"
                      className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-8 rounded-full text-lg"
                    >
                      <Link to="/admin">Admin Dashboard</Link>
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="flex-1 relative"
            >
              <motion.div 
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
                className="relative aspect-square max-w-md mx-auto"
              >
                <img 
                  src="/images/library-illustration.jpeg" 
                  alt="Carmel College of Engineering" 
                  className="object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://placehold.co/600x600?text=Library+Illustration";
                  }}
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Stats Section */}
      {/* <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard icon={BookOpen} value={stats.totalBooks} label="Total Books" />
            <StatCard icon={Users} value={stats.totalMembers} label="Active Members" />
            <StatCard icon={LibraryBig} value={stats.availableBooks} label="Available Books" />
          </div>
        </div>
      </section> */}

      {/* Featured Books Section - Card Layout */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-16 px-4 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 font-['Playfair_Display',serif]">Featured Books</h2>
            <div className="w-20 h-1 bg-indigo-600 mt-2 mb-3 rounded-full"></div>
            {/* <p className="text-gray-600 mt-2 font-['Inter',sans-serif]">Handpicked selections from our collection</p> */}
          </motion.div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-indigo-200 h-12 w-12"></div>
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-indigo-200 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-indigo-200 rounded"></div>
                    <div className="h-4 bg-indigo-200 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {featuredBooks.map((book) => (
                <motion.div 
                  key={book._id}
                  variants={slideUp}
                  whileHover={{ y: -10 }}
                >
                  <Link 
                    to={`/books/${book._id}`} 
                    className="group block"
                  >
                    <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full border-0 shadow-md">
                      <div className="aspect-[3/4] relative overflow-hidden">
                        <motion.img 
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.5 }}
                          src={book.coverImage || book.image || book.imagePath || 'https://placehold.co/400x600?text=No+Cover'} 
                          alt={book.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {book.status === 'Available' && (
                          <div className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                            Available
                          </div>
                        )}
                      </div>
                      <CardContent className="py-6">
                        <div className="mb-3">
                          <span className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">
                            {typeof book.category === 'object' && book.category?.name ? book.category.name : 'General'}
                          </span>
                        </div>
                        <h3 className="font-bold text-xl text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1 font-['Inter',sans-serif]">
                          {book.title}
                        </h3>
                        <p className="text-gray-600 mt-1 mb-4 font-['Inter',sans-serif]">{book.author}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">{book.copies} copies</span>
                          <span className="text-indigo-600 group-hover:text-indigo-500 flex items-center gap-1 text-sm font-medium">
                            View Details <ArrowRight className="w-4 h-4" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-12 text-center"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                asChild
                variant="outline"
                className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-8 py-6 rounded-full"
              >
                <Link to="/books">View All Books</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* New Arrivals Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900">New Arrivals</h2>
            {/* <p className="text-gray-600 mt-2">The latest additions to our library</p> */}
          </div>
          
          {loading ? (
            <div className="text-center py-8">Loading new arrivals...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {newArrivals.map((book) => (
                <Link 
                  to={`/books/${book._id}`} 
                  key={book._id}
                  className="group block"
                >
                  <div className="space-y-3">
                    <div className="aspect-[3/4] overflow-hidden rounded-lg bg-gray-100 relative">
                      <img 
                        src={book.coverImage || book.image || book.imagePath || 'https://placehold.co/400x600?text=No+Cover'} 
                        alt={book.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-2 left-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
                        New
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-base text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {book.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{book.author}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Services Section */}
      {/* <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-16 px-4 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 font-['Playfair_Display',serif]">Our Services</h2>
            <div className="w-20 h-1 bg-indigo-600 mt-2 mb-3 mx-auto rounded-full"></div>
            <p className="text-gray-600 mt-2 max-w-2xl mx-auto font-['Inter',sans-serif]">
              Discover all the ways our library can help enhance your reading experience
            </p>
          </motion.div>
          
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <motion.div variants={slideUp} whileHover={{ y: -10 }}>
              <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-8 text-center">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className="w-16 h-16 mx-auto mb-6 rounded-full bg-indigo-100 flex items-center justify-center"
                  >
                    <BookOpen className="w-8 h-8 text-indigo-600" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 font-['Playfair_Display',serif]">Physical Books</h3>
                  <p className="text-gray-600 font-['Inter',sans-serif]">Browse our extensive collection of physical books spanning all genres and interests.</p>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={slideUp} whileHover={{ y: -10 }}>
              <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-8 text-center">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className="w-16 h-16 mx-auto mb-6 rounded-full bg-indigo-100 flex items-center justify-center"
                  >
                    <Bookmark className="w-8 h-8 text-indigo-600" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 font-['Playfair_Display',serif]">Digital Library</h3>
                  <p className="text-gray-600 font-['Inter',sans-serif]">Access our growing collection of e-books and digital resources from anywhere.</p>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={slideUp} whileHover={{ y: -10 }}>
              <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-8 text-center">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className="w-16 h-16 mx-auto mb-6 rounded-full bg-indigo-100 flex items-center justify-center"
                  >
                    <Clock3 className="w-8 h-8 text-indigo-600" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 font-['Playfair_Display',serif]">Easy Management</h3>
                  <p className="text-gray-600 font-['Inter',sans-serif]">Enjoy a simplified borrowing and returning process for all library materials.</p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </motion.section> */}

      {/* CTA Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-16 px-4"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-indigo-600 rounded-2xl overflow-hidden"
          >
            <div className="relative px-8 py-16 md:px-16 md:py-20 text-center md:text-left">
              <motion.div 
                initial={{ backgroundPositionX: "0%" }}
                animate={{ backgroundPositionX: "100%" }}
                transition={{ duration: 30, ease: "linear", repeat: Infinity }}
                className="absolute inset-0 bg-[url('/images/pattern-dots.svg')] opacity-10"
              ></motion.div>
              <motion.div 
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="relative z-10 max-w-lg mx-auto md:mx-0"
              >
                <motion.h2 
                  className="text-white text-3xl md:text-4xl font-bold font-['Playfair_Display',serif]"
                >
                  Ready to start reading?
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="text-indigo-100 mt-4 mb-8 font-['Inter',sans-serif]"
                >
                  {/* Join our community of readers today and gain access to thousands of books. */}
                </motion.p>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="flex flex-wrap gap-4 justify-center md:justify-start"
                >
                  {user ? (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        asChild
                        size="lg"
                        className="bg-white text-indigo-600 hover:bg-indigo-50 px-8 rounded-full"
                      >
                        <Link to="/books">Browse Books</Link>
                      </Button>
                    </motion.div>
                  ) : (
                    <>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button 
                          asChild
                          size="lg"
                          className="bg-white text-indigo-600 hover:bg-indigo-50 px-8 rounded-full"
                        >
                          <Link to="/register">Sign Up Now</Link>
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button 
                          asChild
                          variant="outline"
                          size="lg"
                          className="border-2 border-white text-white hover:bg-indigo-700 px-8 rounded-full"
                        >
                          <Link to="/login">Login</Link>
                        </Button>
                      </motion.div>
                    </>
                  )}
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default HomePage; 