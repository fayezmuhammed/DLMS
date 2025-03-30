import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Book, bookService } from '@/services/bookService';

const HomePage: React.FC = () => {
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch books from API
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const response = await bookService.getBooks();
        const books = response.data || [];
        
        // Get 3 random books or the first 3 if not enough books
        if (books.length > 3) {
          // Get 3 random books
          const randomBooks = [...books].sort(() => 0.5 - Math.random()).slice(0, 3);
          setFeaturedBooks(randomBooks);
        } else {
          // Just use whatever books we have
          setFeaturedBooks(books);
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
      {/* Hero Section - Minimalist */}
      <section className="relative h-[80vh] flex items-center justify-center bg-gradient-to-b from-indigo-50/50 to-transparent">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center space-y-8">
          <h1 className="text-6xl font-light tracking-tight text-gray-900">
            Your Gateway to
            <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-500">
              Knowledge
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover a world of books, carefully curated for your reading journey.
          </p>
          <div className="flex justify-center gap-6 pt-4">
            <Button 
              asChild
              className="bg-indigo-950 hover:bg-indigo-900 text-white px-8 py-6 text-lg rounded-full transition-all duration-300 hover:shadow-lg"
            >
              <Link to="/books">Explore Collection</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Books Section  */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light text-gray-900">Featured Books</h2>
            <div className="w-16 h-px bg-indigo-200 mx-auto mt-4"></div>
          </div>
          {loading ? (
            <div className="text-center py-8">Loading featured books...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {featuredBooks.map((book) => (
                <Link 
                  to={`/books/${book._id}`} 
                  key={book._id}
                  className="group"
                >
                  <div className="space-y-4">
                    <div className="aspect-[3/4] overflow-hidden rounded-lg bg-gray-100">
                      <img 
                        src={book.coverImage || book.imagePath || 'https://placehold.co/400x600?text=No+Cover'} 
                        alt={book.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="text-center">
                      <h3 className="font-light text-lg text-gray-900 group-hover:text-indigo-600 transition-colors">
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

      {/* Services Section  */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-indigo-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-light text-gray-900 mb-2">Physical Books</h3>
              <p className="text-gray-600">Browse our extensive collection of physical books</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-indigo-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-light text-gray-900 mb-2">Digital Library</h3>
              <p className="text-gray-600">Access our  collection of e-books</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-indigo-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-light text-gray-900 mb-2">Easy Management</h3>
              <p className="text-gray-600">Simple borrowing and return process</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 