import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axios from 'axios';

// Interface for Book type
interface Book {
  _id: string;
  title: string;
  author: string;
  ISBN: string;
  category: {
    _id: string;
    name: string;
  };
  imagePath?: string;
  status: 'Available' | 'Reserved' | 'Issued' | 'Lost';
  description?: string;
}

// Interface for Category type
interface Category {
  _id: string;
  name: string;
  description?: string;
}

// Mock books data with realistic book information
const mockBooks: Book[] = [
  {
    _id: 'book1',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    ISBN: '9780061120084',
    category: {
      _id: 'cat1',
      name: 'Fiction'
    },
    imagePath: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1553383690i/2657.jpg',
    status: 'Available',
    description: 'The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it.'
  },
  {
    _id: 'book2',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    ISBN: '9780743273565',
    category: {
      _id: 'cat1',
      name: 'Fiction'
    },
    imagePath: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1490528560i/4671.jpg',
    status: 'Reserved',
    description: 'A true classic of twentieth-century literature about the American Dream and its corruption.'
  },
  {
    _id: 'book3',
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    ISBN: '9780062316097',
    category: {
      _id: 'cat2',
      name: 'Non-Fiction'
    },
    imagePath: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1420585954i/23692271.jpg',
    status: 'Available',
    description: 'How Homo sapiens became Earth\'s dominant species, exploring history from the Stone Age to the Silicon Age.'
  },
  {
    _id: 'book4',
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    ISBN: '9780062315007',
    category: {
      _id: 'cat1',
      name: 'Fiction'
    },
    imagePath: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1654371463i/18144590.jpg',
    status: 'Issued',
    description: 'A magical story about following your dreams and listening to your heart.'
  },
  {
    _id: 'book5',
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    author: 'Robert C. Martin',
    ISBN: '9780132350884',
    category: {
      _id: 'cat3',
      name: 'Technology'
    },
    imagePath: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1436202607i/3735293.jpg',
    status: 'Available',
    description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees.'
  },
  {
    _id: 'book6',
    title: 'Atomic Habits',
    author: 'James Clear',
    ISBN: '9780735211292',
    category: {
      _id: 'cat4',
      name: 'Self-Help'
    },
    imagePath: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1535115320i/40121378.jpg',
    status: 'Available',
    description: 'Tiny changes, remarkable results: An easy & proven way to build good habits & break bad ones.'
  },
  {
    _id: 'book7',
    title: '1984',
    author: 'George Orwell',
    ISBN: '9780451524935',
    category: {
      _id: 'cat1',
      name: 'Fiction'
    },
    imagePath: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1657781256i/61439040.jpg',
    status: 'Available',
    description: 'A startling vision of a dystopian future where government surveillance controls every aspect of citizens\' lives.'
  },
  {
    _id: 'book8',
    title: 'Think and Grow Rich',
    author: 'Napoleon Hill',
    ISBN: '9781585424337',
    category: {
      _id: 'cat4',
      name: 'Self-Help'
    },
    imagePath: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1463241782i/30186948.jpg',
    status: 'Reserved',
    description: 'The classic bestseller on using the power of positive thinking to achieve success.'
  }
];

// Mock categories data
const mockCategories: Category[] = [
  { _id: 'cat1', name: 'Fiction', description: 'Fictional literature including novels and short stories' },
  { _id: 'cat2', name: 'Non-Fiction', description: 'Educational and informative books including biographies, history, and science' },
  { _id: 'cat3', name: 'Technology', description: 'Books about computer science, programming, and technology' },
  { _id: 'cat4', name: 'Self-Help', description: 'Personal development and motivational books' }
];

const BooksPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');

  // Fetch books and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch books
        const booksResponse = await axios.get('http://localhost:5001/api/books');
        
        // If the response doesn't contain books or is empty, use mock data
        if (!booksResponse.data.books || booksResponse.data.books.length === 0) {
          setBooks(mockBooks);
        } else {
          setBooks(booksResponse.data.books);
        }
        
        // Fetch categories
        const categoriesResponse = await axios.get('http://localhost:5001/api/categories');
        
        // If the response doesn't contain categories or is empty, use mock data
        if (!categoriesResponse.data.categories || categoriesResponse.data.categories.length === 0) {
          setCategories(mockCategories);
        } else {
          setCategories(categoriesResponse.data.categories);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        // Use mock data when API fails
        setBooks(mockBooks);
        setCategories(mockCategories);
        setError(''); // Clear error since we're showing mock data
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter books based on search term, category, and availability
  const filteredBooks = books.filter(book => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.description && book.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
      (book.category && book.category._id === selectedCategory);
    
    const matchesAvailability = availabilityFilter === 'all' || 
      (availabilityFilter === 'available' && book.status === 'Available') ||
      (availabilityFilter === 'borrowed' && book.status !== 'Available');
    
    return matchesSearch && matchesCategory && matchesAvailability;
  });

  if (loading) {
    return <div className="text-center py-12">Loading books...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Library Books</h1>
        <p className="text-muted-foreground">Browse our collection of books available for borrowing</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div>
          <Input
            placeholder="Search by title, author, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category._id} value={category._id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Books</SelectItem>
              <SelectItem value="available">Available Only</SelectItem>
              <SelectItem value="borrowed">Borrowed/Reserved Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Books Grid */}
      {filteredBooks.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No Books Found</h2>
          <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setSelectedCategory('all');
            setAvailabilityFilter('all');
          }}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredBooks.map(book => (
            <Card key={book._id} className="overflow-hidden flex flex-col h-full">
              <div className="aspect-[3/4] relative">
                <img 
                  src={book.imagePath || 'https://placehold.co/400x600?text=No+Cover'} 
                  alt={book.title} 
                  className="object-cover w-full h-full"
                />
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    book.status === 'Available' 
                      ? 'bg-green-100 text-green-800' 
                      : book.status === 'Reserved' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }`}>
                    {book.status}
                  </span>
                </div>
              </div>
              <CardContent className="p-4 flex-grow flex flex-col">
                <h3 className="font-semibold line-clamp-1 mb-1">{book.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">by {book.author}</p>
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                  {book.description || 'No description available.'}
                </p>
                <div className="mt-auto">
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/books/${book._id}`}>View Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BooksPage; 