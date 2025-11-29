import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, BookOpenCheck, User, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { bookService, Book } from '@/services/bookService';
import { userService } from '@/services/userService';
import { transactionService } from '@/services/transactionService';
import settingsService, { BorrowingRules } from '@/services/settingsService';
import { Textarea } from '@/components/ui/textarea';

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
          response.data.map(async (book: Book) => {
            // Count active transactions for each book
            const transactionsResponse = await transactionService.getBookTransactions(book._id);
            
            if (transactionsResponse.success) {
              const activeTransactions = transactionsResponse.data.filter(
                (tx: { status: string }) => tx.status === 'borrowed' || tx.status === 'overdue'
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
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading resources...</p>
        </div>
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

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpenCheck className="h-5 w-5 text-primary" />
            <CardTitle>Book Selection</CardTitle>
          </div>
          <CardDescription>
            Choose an available book to issue to a user
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bookSearch">Search and Select Book</Label>
            <div className="relative">
              <Input 
                id="bookSearch"
                placeholder="Type to search books by title, author, or book number..." 
                value={bookSearchTerm}
                onChange={(e) => handleBookSearch(e.target.value)}
                className="w-full"
              />
              {bookSearchTerm.length >= 2 && filteredBooks.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto border border-border">
                  <div className="py-1">
                    {filteredBooks.map((book) => (
                      <div
                        key={book._id}
                        className="px-4 py-2 hover:bg-muted cursor-pointer flex items-center gap-3"
                        onClick={() => {
                          setSelectedBook(book._id);
                          setBookSearchTerm(book.title);
                          setTimeout(() => setFilteredBooks([]), 100);
                        }}
                      >
                        <div>
                          <div className="font-medium">{book.title}</div>
                          <div className="text-xs text-muted-foreground">by {book.author}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {bookSearchTerm.length >= 2 && filteredBooks.length === 0 && !selectedBook && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-border">
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    No books found with that title or author
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Book Details Preview */}
          {selectedBook && (
            <Card className="mt-4 bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{availableBooks.find(book => book._id === selectedBook)?.title}</h3>
                  <p className="text-sm text-muted-foreground">{availableBooks.find(book => book._id === selectedBook)?.author}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="bg-green-50">{availableBooks.find(book => book._id === selectedBook)?.status}</Badge>
                    <Badge variant="outline">Copies: {availableBooks.find(book => book._id === selectedBook)?.copies}</Badge>
                    {availableBooks.find(book => book._id === selectedBook)?.category && (
                      <Badge variant="secondary">{
                        (() => {
                          const book = availableBooks.find(b => b._id === selectedBook);
                          if (!book?.category) return 'Uncategorized';
                          if (typeof book.category === 'object' && book.category !== null) {
                            return (book.category as { name?: string }).name || 'Uncategorized';
                          }
                          return String(book.category);
                        })()
                      }</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    ISBN: {availableBooks.find(book => book._id === selectedBook)?.ISBN || 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Book #: {availableBooks.find(book => book._id === selectedBook)?.bookNo || 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <div className="border-t border-border my-8"></div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle>User Selection</CardTitle>
          </div>
          <CardDescription>
            Choose a user to issue the book to
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userSearch">Search and Select User</Label>
            <div className="relative">
              <Input 
                id="userSearch"
                placeholder="Type to search users by name or email..." 
                value={userSearchTerm}
                onChange={(e) => handleUserSearch(e.target.value)}
                className="w-full"
              />
              {userSearchTerm.length >= 2 && filteredUsers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto border border-border">
                  <div className="py-1">
                    {filteredUsers.map((user) => (
                      <div
                        key={user._id}
                        className="px-4 py-2 hover:bg-muted cursor-pointer"
                        onClick={() => {
                          handleSelectUser(user._id);
                          setUserSearchTerm(user.name);
                          setTimeout(() => setFilteredUsers([]), 100);
                        }}
                      >
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.email} - {user.role}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {userSearchTerm.length >= 2 && filteredUsers.length === 0 && !selectedUser && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-border">
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    No users found matching that search
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Details Preview */}
          {selectedUser && (
            <Card className="mt-4 bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex flex-col">
                  <h3 className="text-lg font-semibold">{users.find(user => user._id === selectedUser)?.name}</h3>
                  <p className="text-sm text-muted-foreground">{users.find(user => user._id === selectedUser)?.email}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className={selectedUserRole === 'teacher' ? 'bg-blue-50' : 'bg-purple-50'}>
                      {users.find(user => user._id === selectedUser)?.role}
                    </Badge>
                    <Badge variant="outline">
                      Limit: {selectedUserRole === 'teacher' ? borrowingRules.maxBooksTeacher : borrowingRules.maxBooksStudent} books
                    </Badge>
                  </div>
                  
                  <div className="mt-3 flex items-center">
                    <div className="text-sm">
                      Currently borrowed: <span className="font-medium">{userBorrowedCount}</span> of {selectedUserRole === 'teacher' ? borrowingRules.maxBooksTeacher : borrowingRules.maxBooksStudent} books
                    </div>
                    
                    {userBorrowedCount > 0 && (
                      <Button variant="link" className="p-0 h-auto text-xs ml-2" onClick={() => navigate(`/admin/transactions?user=${selectedUser}`)}>
                        View active borrows
                      </Button>
                    )}
                  </div>
                  
                  {userBorrowedCount >= (selectedUserRole === 'teacher' ? borrowingRules.maxBooksTeacher : borrowingRules.maxBooksStudent) && (
                    <div className="flex items-start gap-2 mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
                      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div className="text-sm text-red-600">
                        This user has reached their borrowing limit and cannot borrow additional books.
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <div className="border-t border-border my-8"></div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle>Borrowing Details</CardTitle>
          </div>
          <CardDescription>
            Set issue and due dates for this transaction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="issueDate">Issue Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="issueDate"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {issueDate ? format(issueDate, 'PPP') : <span>Select date</span>}
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

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="dueDate"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'PPP') : <span>Select date</span>}
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
            </div>
          </div>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <h3 className="text-sm font-medium flex items-center gap-2 text-blue-700">
                <Clock className="h-4 w-4" />
                Borrowing Rules
              </h3>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-600">
                <div>
                  <p className="font-medium">Loan Period:</p>
                  <p>{selectedUserRole === 'teacher' ? borrowingRules.maxDaysTeacher : borrowingRules.maxDaysStudent} days</p>
                </div>
                <div>
                  <p className="font-medium">Borrowing Limit:</p>
                  <p>{selectedUserRole === 'teacher' ? borrowingRules.maxBooksTeacher : borrowingRules.maxBooksStudent} books</p>
                </div>
                <div>
                  <p className="font-medium">Late Fee:</p>
                  <p>₹{borrowingRules.finePerDay}/day</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Transaction Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes about this transaction..."
              value={transactionNotes}
              onChange={(e) => setTransactionNotes(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="border-t border-border my-8"></div>

      <Card className="mt-6 bg-gray-50">
        <CardHeader className="pb-2">
          <CardTitle>Transaction Summary</CardTitle>
          <CardDescription>
            Review the details before issuing the book
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {selectedBook ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Book:</span>
                <span className="font-medium">{availableBooks.find(book => book._id === selectedBook)?.title}</span>
              </div>
            ) : (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Book:</span>
                <span className="text-red-500">Not selected</span>
              </div>
            )}
            
            {selectedUser ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">User:</span>
                <span className="font-medium">{users.find(user => user._id === selectedUser)?.name}</span>
              </div>
            ) : (
              <div className="flex justify-between">
                <span className="text-muted-foreground">User:</span>
                <span className="text-red-500">Not selected</span>
              </div>
            )}
            
            {issueDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Issue Date:</span>
                <span className="font-medium">{format(issueDate, 'PPP')}</span>
              </div>
            )}
            
            {dueDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Date:</span>
                <span className="font-medium">{format(dueDate, 'PPP')}</span>
              </div>
            )}

            {userBorrowedCount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Currently Borrowed:</span>
                <span className="font-medium">{userBorrowedCount} books</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={() => navigate('/admin/transactions')}>
            Cancel
          </Button>
          <Button 
            onClick={handleIssueBook}
            disabled={issuingBook || !selectedBook || !selectedUser || !issueDate || !dueDate || 
                      userBorrowedCount >= (selectedUserRole === 'teacher' ? borrowingRules.maxBooksTeacher : borrowingRules.maxBooksStudent)}
            className="min-w-32"
          >
            {issuingBook ? 'Processing...' : 'Issue Book'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 