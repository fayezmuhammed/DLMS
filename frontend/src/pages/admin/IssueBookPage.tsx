import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { bookService, Book } from '@/services/bookService';
import { userService } from '@/services/userService';
import { transactionService } from '@/services/transactionService';
import settingsService, { BorrowingRules } from '@/services/settingsService';

export default function IssueBookPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [issuingBook, setIssuingBook] = useState(false);
  
  const [availableBooks, setAvailableBooks] = useState<Book[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedUserRole, setSelectedUserRole] = useState<string>('student');
  
  const [issueDate, setIssueDate] = useState<Date | undefined>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() + 14))
  );
  
  const [borrowingRules, setBorrowingRules] = useState<BorrowingRules>({
    maxBooksStudent: 3,
    maxBooksTeacher: 5,
    maxDaysStudent: 14,
    maxDaysTeacher: 30,
    finePerDay: 0.5
  });
  
  const [bookSearchTerm, setBookSearchTerm] = useState('');
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [transactionNotes, setTransactionNotes] = useState('');
  const [userBorrowedCount, setUserBorrowedCount] = useState<number>(0);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchAvailableBooks(),
          fetchUsers(),
          fetchBorrowingRules()
        ]);
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast({
          title: "Error",
          description: "Failed to load required data for issuing books.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);

  const fetchAvailableBooks = async () => {
    try {
      // Get all books, not just those with status 'Available'
      const response = await bookService.getBooks();
      
      if (response.success && response.data) {
        // Filter to find books that have available copies
        const availableBooksData = await Promise.all(
          response.data.map(async (book) => {
            // Count active transactions for each book
            const transactionsResponse = await transactionService.getBookTransactions(book._id);
            
            if (transactionsResponse.success) {
              const activeTransactions = transactionsResponse.data.filter(
                (tx) => tx.status === 'borrowed' || tx.status === 'overdue'
              ).length;
              
              // Book is available if it has more copies than active transactions
              return book.copies > activeTransactions ? book : null;
            }
            
            return null;
          })
        );
        
        // Filter out null values
        setAvailableBooks(availableBooksData.filter(book => book !== null));
      } else {
        toast({
          title: "Error",
          description: "Failed to load available books.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Error fetching available books:', err);
      toast({
        title: "Error",
        description: "Failed to load available books.",
        variant: "destructive",
      });
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userService.getUsers();
      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to load users.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive",
      });
    }
  };

  const fetchBorrowingRules = async () => {
    try {
      const response = await settingsService.getBorrowingRules();
      if (response.success && response.data) {
        setBorrowingRules(response.data);
      }
    } catch (err) {
      console.error('Error fetching borrowing rules:', err);
      toast({
        title: "Error",
        description: "Failed to load borrowing rules.",
        variant: "destructive",
      });
    }
  };

  // Function to search books
  const handleBookSearch = (searchValue: string) => {
    setBookSearchTerm(searchValue);
    if (searchValue.length >= 2) {
      const filtered = availableBooks.filter(book => 
        book.title.toLowerCase().includes(searchValue.toLowerCase()) ||
        book.author.toLowerCase().includes(searchValue.toLowerCase()) ||
        (book.bookNo && book.bookNo.toLowerCase().includes(searchValue.toLowerCase()))
      );
      setFilteredBooks(filtered);
    } else {
      setFilteredBooks([]);
    }
  };
  
  // Function to search users
  const handleUserSearch = (searchValue: string) => {
    setUserSearchTerm(searchValue);
    if (searchValue.length >= 2) {
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        user.email.toLowerCase().includes(searchValue.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers([]);
    }
  };
  
  // Function to get user borrowed books count
  const getUserBorrowedCount = async (userId: string) => {
    try {
      const response = await transactionService.getUserActiveTransactions(userId);
      if (response.success && response.data) {
        setUserBorrowedCount(response.data.length);
        return response.data.length;
      }
      return 0;
    } catch (error) {
      console.error('Error fetching user borrowed count:', error);
      return 0;
    }
  };
  
  // Update handleSelectUser to fetch borrowed count
  const handleSelectUser = (userId: string) => {
    setSelectedUser(userId);
    
    // Find the selected user to get their role
    const user = users.find(u => u._id === userId);
    if (user) {
      const userRole = user.role.toLowerCase();
      setSelectedUserRole(userRole);
      
      // Get count of books the user has borrowed
      getUserBorrowedCount(userId);
      
      // Set due date based on user role if issue date exists
      if (issueDate) {
        const daysToAdd = userRole === 'teacher' ? 
          borrowingRules.maxDaysTeacher : borrowingRules.maxDaysStudent;
        
        const newDueDate = new Date(issueDate);
        newDueDate.setDate(newDueDate.getDate() + daysToAdd);
        setDueDate(newDueDate);
      }
    }
  };
  
  const handleIssueBook = async () => {
    if (!selectedBook || !selectedUser || !issueDate || !dueDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Check borrowing limits
    const borrowLimit = selectedUserRole === 'teacher' ? 
      borrowingRules.maxBooksTeacher : borrowingRules.maxBooksStudent;
      
    if (userBorrowedCount >= borrowLimit) {
      toast({
        title: "Borrowing limit reached",
        description: `This user has already borrowed ${userBorrowedCount} books, which reaches the limit of ${borrowLimit} books.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIssuingBook(true);
      
      // Use the transactionService to issue the book to the selected user
      const response = await transactionService.issueBook({
        bookId: selectedBook,
        userId: selectedUser,
        issueDate: issueDate.toISOString(),
        dueDate: dueDate.toISOString(),
        notes: transactionNotes // Add notes to the transaction
      });
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Book issued successfully",
        });
        
        // Navigate back to transactions page
        navigate('/admin/transactions');
      } else {
        toast({
          title: "Failed to issue book",
          description: response.message || "Please try again later",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Error issuing book:', err);
      toast({
        title: "Error",
        description: "Failed to issue the book. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIssuingBook(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Issue New Book</h1>
          <p className="text-muted-foreground">
            Assign a book to a user for borrowing
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin/transactions')}>
          Back to Transactions
        </Button>
      </div>

      <div className="grid gap-6 border rounded-lg p-6 bg-card">
        {/* Book Selection Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Book Information</h3>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="book" className="text-right">Book</Label>
            <div className="col-span-3">
              <div className="relative">
                <Input 
                  placeholder="Search for a book..." 
                  value={bookSearchTerm}
                  onChange={(e) => handleBookSearch(e.target.value)}
                  className="mb-2"
                />
                <Select 
                  value={selectedBook || ''} 
                  onValueChange={(value) => setSelectedBook(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select book" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBooks.map(book => (
                      <SelectItem key={book._id} value={book._id}>
                        {book.title} by {book.author}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Book Details Preview */}
          {selectedBook && (
            <div className="ml-[calc(25%+16px)] border rounded-md p-3 bg-muted">
              <div className="flex gap-3">
                <div className="w-20 h-28 bg-gray-200 rounded flex-shrink-0">
                  {availableBooks.find(book => book._id === selectedBook)?.coverImage && (
                    <img 
                      src={availableBooks.find(book => book._id === selectedBook)?.coverImage} 
                      alt="Book cover" 
                      className="w-full h-full object-cover rounded"
                    />
                  )}
                </div>
                <div>
                  <p className="font-semibold">{availableBooks.find(book => book._id === selectedBook)?.title}</p>
                  <p className="text-sm text-muted-foreground">{availableBooks.find(book => book._id === selectedBook)?.author}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline">{availableBooks.find(book => book._id === selectedBook)?.status}</Badge>
                    <Badge variant="outline">Copies: {availableBooks.find(book => book._id === selectedBook)?.copies}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Book #: {availableBooks.find(book => book._id === selectedBook)?.bookNo || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Selection Section */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-semibold">User Information</h3>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="user" className="text-right">User</Label>
            <div className="col-span-3">
              <div className="relative">
                <Input 
                  placeholder="Search by name or email..." 
                  value={userSearchTerm}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  className="mb-2"
                />
                <Select 
                  value={selectedUser || ''} 
                  onValueChange={handleSelectUser}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name} ({user.email}) - {user.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* User Details Preview */}
          {selectedUser && (
            <div className="ml-[calc(25%+16px)] border rounded-md p-3 bg-muted">
              <p className="font-semibold">{users.find(user => user._id === selectedUser)?.name}</p>
              <p className="text-sm text-muted-foreground">{users.find(user => user._id === selectedUser)?.email}</p>
              <div className="flex gap-2 mt-1">
                <Badge>{users.find(user => user._id === selectedUser)?.role}</Badge>
                <Badge variant="outline">
                  Limit: {selectedUserRole === 'teacher' ? borrowingRules.maxBooksTeacher : borrowingRules.maxBooksStudent} books
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Currently borrowed books: {userBorrowedCount}
              </div>
              {userBorrowedCount > 0 && (
                <div className="text-xs mt-1">
                  <Button variant="link" className="p-0 h-auto text-xs" onClick={() => navigate(`/admin/transactions?user=${selectedUser}`)}>
                    View active borrows
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Date Selection Section */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-semibold">Borrowing Details</h3>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="issueDate" className="text-right">Issue Date</Label>
            <div className="col-span-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {issueDate ? format(issueDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={issueDate}
                    onSelect={(date) => {
                      setIssueDate(date);
                      
                      // Recalculate due date when issue date changes
                      if (date && selectedUser) {
                        const daysToAdd = selectedUserRole === 'teacher' ? 
                          borrowingRules.maxDaysTeacher : borrowingRules.maxDaysStudent;
                        
                        const newDueDate = new Date(date);
                        newDueDate.setDate(newDueDate.getDate() + daysToAdd);
                        setDueDate(newDueDate);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dueDate" className="text-right">Due Date</Label>
            <div className="col-span-3">
              <div className="flex gap-4 items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                        disabled={(date) => date < (issueDate || new Date())}
                    />
                  </PopoverContent>
                </Popover>
                <div className="text-xs text-muted-foreground">
                  <p>Based on {selectedUserRole === 'teacher' ? 'teacher' : 'student'} borrowing rules</p>
                  <p>Loan period: {selectedUserRole === 'teacher' ? borrowingRules.maxDaysTeacher : borrowingRules.maxDaysStudent} days</p>
                  <p>Late fee: ₹{borrowingRules.finePerDay}/day</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="notes" className="text-right">Notes</Label>
            <div className="col-span-3">
              <textarea
                id="notes"
                className="w-full p-2 border rounded-md"
                placeholder="Add any additional notes about this transaction..."
                value={transactionNotes}
                onChange={(e) => setTransactionNotes(e.target.value)}
                rows={3}
              ></textarea>
            </div>
          </div>
        </div>

        {/* Form actions */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button variant="outline" onClick={() => navigate('/admin/transactions')}>
            Cancel
          </Button>
          <Button 
            disabled={issuingBook || !selectedBook || !selectedUser || !issueDate || !dueDate}
            onClick={handleIssueBook}
          >
            {issuingBook ? 'Processing...' : 'Issue Book'}
          </Button>
        </div>
      </div>
    </div>
  );
} 