import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { User, userService } from '@/services/userService';
import { Transaction, transactionService } from '@/services/transactionService';
import { Book } from '@/services/bookService';

const UserDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [_transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTransactions, setActiveTransactions] = useState<Transaction[]>([]);
  const [historyTransactions, setHistoryTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<User | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
      fetchUserTransactions();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await userService.getUserById(userId as string);
      
      if (response.success && response.data) {
        setUser(response.data);
        setEditedUser(response.data);
      } else {
        setError('Failed to fetch user details');
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError('Failed to fetch user details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTransactions = async () => {
    try {
      const activeResponse = await transactionService.getUserActiveTransactions(userId as string);
      const historyResponse = await transactionService.getUserTransactionHistory(userId as string);
      
      if (activeResponse.success && historyResponse.success) {
        const activeData = activeResponse.data || [];
        const historyData = historyResponse.data || [];
        
        setActiveTransactions(activeData);
        setHistoryTransactions(historyData);
        setTransactions([...activeData, ...historyData]);
      } else {
        toast({
          title: "Warning",
          description: "Could not fetch complete transaction history.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Error fetching user transactions:', err);
      toast({
        title: "Error",
        description: "Failed to fetch transaction data.",
        variant: "destructive",
      });
    }
  };

  const handleSaveChanges = async () => {
    if (!editedUser) return;
    
    try {
      const { _id, ...userData } = editedUser;
      
      const response = await userService.updateUser(_id, userData);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "User updated successfully.",
        });
        
        // Update the user data
        setUser(editedUser);
        setIsEditing(false);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update user.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error('Error updating user:', err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update user.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;
    
    if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      try {
        const response = await userService.deleteUser(user._id);
        
        if (response.success) {
          toast({
            title: "Success",
            description: "User deleted successfully.",
          });
          
          // Navigate back to users list
          navigate('/admin/users');
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to delete user.",
            variant: "destructive",
          });
        }
      } catch (err: any) {
        console.error('Error deleting user:', err);
        toast({
          title: "Error",
          description: err.response?.data?.message || "Failed to delete user.",
          variant: "destructive",
        });
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getBookDetails = (transaction: Transaction) => {
    if (!transaction || !transaction.book) {
      return {
        title: 'Unknown Book',
        author: 'Unknown Author',
        id: 'unknown'
      };
    }
    
    if (typeof transaction.book === 'object') {
      const book = transaction.book as Book;
      return {
        title: book.title || 'Untitled Book',
        author: book.author || 'Unknown Author',
        id: book._id
      };
    }
    
    return {
      title: 'Unknown Book',
      author: 'Unknown Author',
      id: transaction.book as string
    };
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'borrowed':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'returned':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading user details...</div>;
  }

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-muted-foreground mb-6">{error || 'User not found'}</p>
        <Button onClick={() => navigate('/admin/users')}>Back to Users</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/users')}
            className="mb-4"
          >
            ← Back to Users
          </Button>
          <h1 className="text-3xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <div className="space-x-2">
          {!isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit User
              </Button>
              <Button variant="destructive" onClick={handleDeleteUser}>
                Delete User
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => {
                setIsEditing(false);
                setEditedUser(user);
              }}>
                Cancel
              </Button>
              <Button onClick={handleSaveChanges}>
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Details Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>User Details</CardTitle>
          </CardHeader>
          <CardContent>
            {!isEditing ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Role</h3>
                  <p>{user.role}</p>
                </div>
                {(user.role === 'student' || user.role === 'Student') && (
                  <>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Admission Number</h3>
                      <p>{user.admissionNumber || 'Not specified'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Batch</h3>
                      <p>{user.batch || 'Not specified'}</p>
                    </div>
                  </>
                )}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Joined On</h3>
                  <p>{formatDate(user.createdAt)}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input 
                    id="edit-name" 
                    value={editedUser?.name || ''} 
                    onChange={(e) => setEditedUser(prev => prev ? {...prev, name: e.target.value} : null)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input 
                    id="edit-email" 
                    type="email"
                    value={editedUser?.email || ''} 
                    onChange={(e) => setEditedUser(prev => prev ? {...prev, email: e.target.value} : null)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Role</Label>
                  <Select 
                    value={editedUser?.role || ''} 
                    onValueChange={(value) => setEditedUser(prev => prev ? {...prev, role: value} : null)}
                  >
                    <SelectTrigger id="edit-role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(editedUser?.role === 'student' || editedUser?.role === 'Student') && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="edit-admissionNumber">Admission Number</Label>
                      <Input 
                        id="edit-admissionNumber" 
                        value={editedUser?.admissionNumber || ''} 
                        onChange={(e) => setEditedUser(prev => prev ? {...prev, admissionNumber: e.target.value} : null)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-batch">Batch</Label>
                      <Input 
                        id="edit-batch" 
                        value={editedUser?.batch || ''} 
                        onChange={(e) => setEditedUser(prev => prev ? {...prev, batch: e.target.value} : null)} 
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              {activeTransactions.length} active and {historyTransactions.length} past transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="active">Active Borrowings</TabsTrigger>
                <TabsTrigger value="history">Transaction History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="active">
                {activeTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {activeTransactions.map(transaction => {
                      const book = getBookDetails(transaction);
                      return (
                        <div key={transaction._id} className="p-4 border rounded-lg">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="font-semibold">{book.title}</h3>
                              <p className="text-sm text-muted-foreground">by {book.author}</p>
                            </div>
                            <Badge className={getStatusColor(transaction.status)}>
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Issue Date</p>
                              <p>{formatDate(transaction.issueDate)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Due Date</p>
                              <p>{formatDate(transaction.dueDate)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Status</p>
                              <p className={transaction.status === 'overdue' ? 'text-red-600 font-medium' : ''}>
                                {transaction.status === 'overdue' ? 'Overdue' : 'On time'}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={async () => {
                                try {
                                  // Use transaction ID directly for returning book
                                  const response = await transactionService.returnBook(transaction._id, true);
                                  
                                  if (response.success) {
                                    toast({
                                      title: "Success",
                                      description: "Book marked as returned successfully."
                                    });
                                    
                                    // Refresh the data
                                    fetchUserTransactions();
                                  } else {
                                    toast({
                                      title: "Error",
                                      description: response.message || "Failed to return book.",
                                      variant: "destructive"
                                    });
                                  }
                                } catch (err) {
                                  console.error("Error returning book:", err);
                                  toast({
                                    title: "Error",
                                    description: "Failed to return book.",
                                    variant: "destructive"
                                  });
                                }
                              }}
                            >
                              Mark as Returned
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No active borrowings for this user.
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="history">
                {historyTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {historyTransactions.map(transaction => {
                      const book = getBookDetails(transaction);
                      return (
                        <div key={transaction._id} className="p-4 border rounded-lg">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="font-semibold">{book.title}</h3>
                              <p className="text-sm text-muted-foreground">by {book.author}</p>
                            </div>
                            <Badge className={getStatusColor(transaction.status)}>
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Issue Date</p>
                              <p>{formatDate(transaction.issueDate)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Due Date</p>
                              <p>{formatDate(transaction.dueDate)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Return Date</p>
                              <p>{formatDate(transaction.returnDate)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No transaction history for this user.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDetailPage; 