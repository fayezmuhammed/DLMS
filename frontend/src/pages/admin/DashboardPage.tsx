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

interface StatsData {
  totalBooks: number;
  totalEbooks: number;
  totalUsers: number;
  activeTransactions: number;
  overdueTransactions: number;
}

interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  category: string;
  status: string;
  copies: number;
  addedOn: string;
}

interface User {
  id: number;
  name: string;
  role: string;
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

  // State for quick action modals
  const [isAddBookDialogOpen, setIsAddBookDialogOpen] = useState(false);
  const [isIssueBookDialogOpen, setIsIssueBookDialogOpen] = useState(false);
  const [isReturnBookDialogOpen, setIsReturnBookDialogOpen] = useState(false);

  // State for new book
  const [newBook, setNewBook] = useState<Omit<Book, 'id' | 'addedOn'>>({
    title: '',
    author: '',
    isbn: '',
    category: '',
    status: 'Available',
    copies: 1,
  });

  // State for issue book
  const [issueBookData, setIssueBookData] = useState({
    bookId: '',
    userId: '',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 14)) // Default due date is 14 days from now
  });

  // State for return book
  const [returnBookId, setReturnBookId] = useState('');

  // Mock books and users for dropdowns
  const mockBooks = [
    { id: 1, title: 'To Kill a Mockingbird' },
    { id: 2, title: '1984' },
    { id: 3, title: 'The Great Gatsby' },
    { id: 4, title: 'Pride and Prejudice' },
    { id: 5, title: 'The Hobbit' }
  ];

  const mockUsers = [
    { id: 1, name: 'John Doe', role: 'Student' },
    { id: 2, name: 'Jane Smith', role: 'Teacher' },
    { id: 3, name: 'Robert Johnson', role: 'Student' },
    { id: 4, name: 'Emily Davis', role: 'Student' },
    { id: 5, name: 'Michael Wilson', role: 'Teacher' }
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // In a real app, this would be fetched from the backend
        // const response = await axios.get('http://localhost:5001/api/admin/dashboard', {
        //   headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        // });
        // setStats(response.data);

        // For demo purposes, we'll use mock data
        setStats({
          totalBooks: 1254,
          totalEbooks: 876,
          totalUsers: 532,
          activeTransactions: 124,
          overdueTransactions: 18
        });

        setLoading(false);
      } catch (err: any) {
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Recent activity mock data
  const recentActivity = [
    { id: 1, action: 'Book Borrowed', user: 'John Doe', book: 'To Kill a Mockingbird', time: '2 hours ago' },
    { id: 2, action: 'Book Returned', user: 'Jane Smith', book: '1984', time: '5 hours ago' },
    { id: 3, action: 'New User Registered', user: 'Mike Johnson', book: '', time: '1 day ago' },
    { id: 4, action: 'E-Book Downloaded', user: 'Sarah Williams', book: 'The Great Gatsby', time: '1 day ago' },
    { id: 5, action: 'Overdue Book Reminder Sent', user: 'Robert Brown', book: 'Pride and Prejudice', time: '2 days ago' },
  ];

  // Handle issue book
  const handleIssueBook = () => {
    // In a real app, this would make an API call to issue the book
    const selectedBook = mockBooks.find(book => book.id.toString() === issueBookData.bookId);
    const selectedUser = mockUsers.find(user => user.id.toString() === issueBookData.userId);
    
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
    setIsIssueBookDialogOpen(false);
    
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
    setIsReturnBookDialogOpen(false);
    
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Books</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBooks}</div>
                <p className="text-xs text-muted-foreground mt-1">Physical copies in library</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total E-Books</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEbooks}</div>
                <p className="text-xs text-muted-foreground mt-1">Digital resources</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground mt-1">Registered members</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Borrows</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeTransactions}</div>
                <p className="text-xs text-muted-foreground mt-1">Books currently borrowed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{stats.overdueTransactions}</div>
                <p className="text-xs text-muted-foreground mt-1">Books past due date</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>The latest events in your library</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map(activity => (
                    <div key={activity.id} className="flex items-start border-b border-border pb-4 last:border-0 last:pb-0">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 mr-3"></div>
                      <div>
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.user} {activity.book && `- "${activity.book}"`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {/* Add New Book Button */}
                  <Button 
                    variant="outline"
                    className="border rounded-md p-4 bg-gray-50 hover:bg-indigo-800 transition-colors text-center h-auto flex flex-col items-center justify-center"
                    onClick={() => navigate('/admin/add-book')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-sm font-medium">Add New Book</span>
                  </Button>

                  {/* Issue Book Dialog */}
                  <Dialog open={isIssueBookDialogOpen} onOpenChange={setIsIssueBookDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline"
                        className="border rounded-md p-4 bg-gray-50 hover:bg-indigo-800 transition-colors text-center h-auto flex flex-col items-center justify-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <span className="text-sm font-medium">Issue Book</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Issue Book</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="book" className="text-right">Book</Label>
                          <Select 
                            value={issueBookData.bookId} 
                            onValueChange={(value) => setIssueBookData({...issueBookData, bookId: value})}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select book" />
                            </SelectTrigger>
                            <SelectContent>
                              {mockBooks.map(book => (
                                <SelectItem key={book.id} value={book.id.toString()}>
                                  {book.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="user" className="text-right">User</Label>
                          <Select 
                            value={issueBookData.userId} 
                            onValueChange={(value) => setIssueBookData({...issueBookData, userId: value})}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select user" />
                            </SelectTrigger>
                            <SelectContent>
                              {mockUsers.map(user => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                  {user.name} ({user.role})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="dueDate" className="text-right">Due Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                id="dueDate"
                                variant="outline"
                                className="col-span-3 justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {issueBookData.dueDate ? format(issueBookData.dueDate, 'PPP') : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={issueBookData.dueDate}
                                onSelect={(date) => date && setIssueBookData({...issueBookData, dueDate: date})}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsIssueBookDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleIssueBook}>Issue Book</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Return Book Dialog */}
                  <Dialog open={isReturnBookDialogOpen} onOpenChange={setIsReturnBookDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline"
                        className="border rounded-md p-4 bg-gray-50 hover:bg-indigo-800 transition-colors text-center h-auto flex flex-col items-center justify-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                        </svg>
                        <span className="text-sm font-medium">Return Book</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Return Book</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="transactionId" className="text-right">Transaction ID</Label>
                          <Input 
                            id="transactionId" 
                            value={returnBookId} 
                            onChange={(e) => setReturnBookId(e.target.value)}
                            className="col-span-3" 
                            placeholder="Enter transaction ID"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsReturnBookDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleReturnBook}>Return Book</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* View Reports Button */}
                  <Button 
                    variant="outline"
                    className="border rounded-md p-4 bg-gray-50 hover:bg-indigo-800 transition-colors text-center h-auto flex flex-col items-center justify-center"
                    onClick={() => navigate('/admin/reports')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm font-medium">View Reports</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage; 