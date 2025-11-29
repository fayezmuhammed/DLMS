import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import axios from 'axios';
import { bookService, Book } from '@/services/bookService';
import api from '@/utils/api';
import { User, userService } from '../../services/userService';
import { ebookService, EBook } from '@/services/ebookService';

interface StatsData {
  totalBooks: number;
  totalEbooks: number;
  totalUsers: number;
  activeTransactions: number;
  overdueTransactions: number;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsData>({
    totalBooks: 0,
    totalEbooks: 0,
    totalUsers: 0,
    activeTransactions: 0,
    overdueTransactions: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [popularBooks, setPopularBooks] = useState<Book[]>([]);
  const [popularEbooks, setPopularEbooks] = useState<EBook[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [ebooks, setEbooks] = useState<EBook[]>([]);

  // State for quick action modals
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showIssueBookModal, setShowIssueBookModal] = useState(false);

  // New user form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Student',
    department: '',
    password: ''
  });

  // New book form state
  const [newBook, setNewBook] = useState<Omit<Book, '_id' | 'addedOn'>>({
    title: '',
    author: '',
    ISBN: '',
    bookNo: '',
    category: '',
    status: 'Available',
    copies: 1,
    coverImage: ''
  });

  // State for issue book
  const [issueBookData, setIssueBookData] = useState({
    bookId: '',
    userId: '',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 14)) // Default due date is 14 days from now
  });

  // State for return book
  const [returnBookId, setReturnBookId] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch real statistics from the backend API
        const response = await api.get('/admin/dashboard');
        
        if (response.data && response.data.success) {
          setStats(response.data.data);
          console.log('Dashboard stats:', response.data.data);
        } else {
          console.error('Invalid dashboard response:', response.data);
          setError('Failed to load dashboard data: Invalid response format');
        }

        // Fetch recent books data using the dedicated endpoint
        try {
          // First fetch the popular books for the horizontal scroll
          const booksResponse = await bookService.getBooks();
          if (booksResponse.success && booksResponse.data) {
            // Take the first 8 books as popular books
            setPopularBooks(booksResponse.data.slice(0, 8));
          }
          
          // Now fetch recent books for the table
          const recentBooksResponse = await api.get('/admin/recent-books');
          if (recentBooksResponse.data && recentBooksResponse.data.success) {
            setBooks(recentBooksResponse.data.data);
          }
        } catch (err) {
          console.error('Error fetching books:', err);
        }
        
        // Fetch e-books data
        try {
          // First fetch all e-books for the horizontal scroll
          const ebooksResponse = await ebookService.getEBooks();
          if (ebooksResponse.success && ebooksResponse.data) {
            // Take the first 8 e-books as popular e-books
            setPopularEbooks(ebooksResponse.data.slice(0, 8));
          }
          
          // Fetch recent e-books for a potential table
          const recentEbooksResponse = await api.get('/admin/recent-ebooks');
          if (recentEbooksResponse.data && recentEbooksResponse.data.success) {
            setEbooks(recentEbooksResponse.data.data);
          }
        } catch (err) {
          console.error('Error fetching e-books:', err);
        }

        // Fetch recent users data using the dedicated endpoint
        try {
          const topUsersResponse = await api.get('/admin/top-users');
          if (topUsersResponse.data && topUsersResponse.data.success) {
            setUsers(topUsersResponse.data.data);
          }
        } catch (err) {
          console.error('Error fetching users:', err);
        }

        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(`Failed to load dashboard data: ${err.message || 'Unknown error'}`);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Handle issue book
  const handleIssueBook = () => {
    // In a real app, this would make an API call to issue the book
    const selectedBook = books.find(book => book._id.toString() === issueBookData.bookId);
    const selectedUser = users.find(user => user._id.toString() === issueBookData.userId);
    
    if (!selectedBook || !selectedUser) {
      alert('Please select both a book and a user');
      return;
    }
    
    console.log('Issuing book:', {
      book: selectedBook,
      user: selectedUser,
      dueDate: issueBookData.dueDate
    });
    
    // Show success message
    alert(`Book "${selectedBook.title}" has been issued to ${selectedUser.name} until ${format(issueBookData.dueDate, 'PP')}`);
    
    // Reset form and close dialog
    setIssueBookData({
      bookId: '',
      userId: '',
      dueDate: new Date(new Date().setDate(new Date().getDate() + 14))
    });
    setShowIssueBookModal(false);
    
    // Update stats
    setStats(prev => ({
      ...prev,
      activeTransactions: prev.activeTransactions + 1
    }));
  };

  // Handle return book
  const handleReturnBook = () => {
    // In a real app, this would make an API call to return the book
    if (!returnBookId) {
      alert('Please enter a transaction ID');
      return;
    }
    
    console.log('Returning book with transaction ID:', returnBookId);
    
    // Show success message
    alert(`Book with transaction ID ${returnBookId} has been returned successfully!`);
    
    // Reset form and close dialog
    setReturnBookId('');
    setShowIssueBookModal(false);
    
    // Update stats
    setStats(prev => ({
      ...prev,
      activeTransactions: Math.max(0, prev.activeTransactions - 1)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white rounded-lg shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-4xl font-bold">{stats.totalBooks}</h2>
                    <p className="text-gray-600">Total Books</p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-full text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/></svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white rounded-lg shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-4xl font-bold">{stats.activeTransactions}</h2>
                    <p className="text-gray-600">Borrowed Books</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full text-blue-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white rounded-lg shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-4xl font-bold">{stats.overdueTransactions}</h2>
                    <p className="text-gray-600">Overdue Books</p>
                  </div>
                  <div className="bg-pink-100 p-3 rounded-full text-pink-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 16v-3a2 2 0 0 0-4 0v3"/></svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white rounded-lg shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-4xl font-bold">{stats.totalUsers}</h2>
                    <p className="text-gray-600">Total Members</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full text-purple-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Popular Books Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Popular Books</h2>
              <Link to="/admin/books" className="text-blue-500 hover:underline">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <div className="flex gap-6 pb-4" style={{ minWidth: 'max-content' }}>
                {popularBooks.length > 0 ? (
                  popularBooks.map((book) => (
                    <div key={book._id} className="w-40 shrink-0">
                      <div className="mb-2 aspect-[2/3] overflow-hidden rounded-lg">
                        <img 
                          src={book.coverImage || book.image || book.imagePath || 'https://placehold.co/320x480?text=No+Cover'} 
                          alt={book.title} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/320x480?text=No+Cover';
                          }}
                        />
                      </div>
                      <h3 className="font-medium text-sm line-clamp-1">{book.title}</h3>
                      <p className="text-xs text-gray-600 line-clamp-1">{book.author}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 py-4">No books available</div>
                )}
              </div>
            </div>
          </div>
          
          {/* Popular E-Books Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Popular E-Books</h2>
              <Link to="/admin/ebooks" className="text-blue-500 hover:underline">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <div className="flex gap-6 pb-4" style={{ minWidth: 'max-content' }}>
                {popularEbooks.length > 0 ? (
                  popularEbooks.map((ebook) => (
                    <div key={ebook._id} className="w-40 shrink-0">
                      <div className="mb-2 aspect-[2/3] overflow-hidden rounded-lg">
                        <img 
                          src={ebook.coverImage || ebook.image || ebook.imagePath || 'https://placehold.co/320x480?text=No+Cover'} 
                          alt={ebook.title} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/320x480?text=No+Cover';
                          }}
                        />
                      </div>
                      <h3 className="font-medium text-sm line-clamp-1">{ebook.title}</h3>
                      <p className="text-xs text-gray-600 line-clamp-1">{ebook.author}</p>
                      <p className="text-xs text-blue-500 mt-1">{ebook.fileType.toUpperCase()}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 py-4">No e-books available</div>
                )}
              </div>
            </div>
          </div>

          {/* Users List */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Users List</h2>
              <Button onClick={() => navigate('/admin/users')} className="bg-gray-200 text-gray-800 hover:bg-gray-300">Add New User</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-white border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Admission No.</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">User Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Book Issued</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? (
                    users.map(user => (
                      <tr key={user._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-700">{user.admissionNumber || 'N/A'}</td>
                        <td className="py-3 px-4 text-gray-700">{user.name}</td>
                        <td className="py-3 px-4 text-gray-700">{user.booksIssued || 0}</td>
                        <td className="py-3 px-4">
                          <div className="text-center">⋯</div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-500">No users available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-right">
              <Link to="/admin/users" className="text-blue-500 hover:underline">See All</Link>
            </div>
          </div>

          {/* Books List */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Books List</h2>
              <Button onClick={() => navigate('/admin/books/add')} className="bg-gray-200 text-gray-800 hover:bg-gray-300">Add New Book</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-white border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Book No.</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Title</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Author</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Available</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {books.length > 0 ? (
                    books.map(book => (
                      <tr key={book._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-700">{book.bookNo}</td>
                        <td className="py-3 px-4 text-gray-700">{book.title}</td>
                        <td className="py-3 px-4 text-gray-700">{book.author}</td>
                        <td className="py-3 px-4 text-gray-700">{book.status === 'Available' ? 'Yes' : 'No'}</td>
                        <td className="py-3 px-4">
                          <div className="text-center">⋯</div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-gray-500">No books available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-right">
              <Link to="/admin/books" className="text-blue-500 hover:underline">See All</Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage; 