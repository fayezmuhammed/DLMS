import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import api from '@/utils/api';
import { useNavigate } from 'react-router-dom';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  batch: string | null;
  admissionNumber: string | null;
  joinedOn: string;
  createdAt: string;
  [key: string]: any; // Add index signature to allow dynamic property access
}

const ManageUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newUser, setNewUser] = useState<Omit<User, '_id' | 'joinedOn' | 'createdAt'>>({
    name: '',
    email: '',
    role: 'Student',
    batch: '',
    admissionNumber: '',
    password: ''
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await api.get('/users');
      if (response.data.success) {
        // Log full response and specific student data
        console.log('Full API response:', response.data);
        
        // Transform the data if needed to ensure proper property access
        const transformedUsers = response.data.data.map((user: any) => {
          // Log each user object to debug
          console.log('User data:', JSON.stringify(user, null, 2));
          
          return {
            ...user,
            // Ensure properties exist with fallbacks
            admissionNumber: user.admissionNumber === undefined ? null : user.admissionNumber,
            batch: user.batch === undefined ? null : user.batch
          };
        });
        
        // Check student data
        const students = transformedUsers.filter((user: User) => 
          user.role.toLowerCase() === 'student'
        );
        
        if (students.length > 0) {
          console.log('First student with data:', JSON.stringify(students[0], null, 2));
          console.log('Admission number exists:', students[0].hasOwnProperty('admissionNumber'));
          console.log('Admission number:', students[0].admissionNumber);
          console.log('Batch exists:', students[0].hasOwnProperty('batch'));
          console.log('Batch:', students[0].batch);
        }
        
        setUsers(transformedUsers);
      } else {
        setError('Failed to load users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async () => {
    try {
      // Validate required fields
      if (!newUser.name.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter a name',
          variant: 'destructive',
        });
        return;
      }

      if (!newUser.email.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter an email',
          variant: 'destructive',
        });
        return;
      }

      if (!newUser.password.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter a password',
          variant: 'destructive',
        });
        return;
      }

      if (newUser.password.trim().length < 6) {
        toast({
          title: 'Error',
          description: 'Password must be at least 6 characters long',
          variant: 'destructive',
        });
        return;
      }

      // Ensure we're not sending null values for admissionNumber and batch
      const userData = {
        ...newUser,
        admissionNumber: newUser.admissionNumber || '',
        batch: newUser.batch || ''
      };

      const response = await api.post('/users', userData);
      
      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'User added successfully',
        });
        
        // Refresh the users list
        fetchUsers();
        
        // Reset form and close dialog
        setNewUser({
          name: '',
          email: '',
          role: 'Student',
          batch: '',
          admissionNumber: '',
          password: ''
        });
        setIsAddDialogOpen(false);
      } else {
        toast({
          title: 'Error',
          description: response.data.message || 'Failed to add user',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      console.error('Error adding user:', err);
      const errorMessage = err.response?.data?.message || 'Failed to add user';
      
      // Highlight specific errors for better user experience
      let description = errorMessage;
      if (errorMessage.includes('admission number')) {
        description = 'This admission number is already in use. Please use a unique admission number.';
      }
      
      toast({
        title: 'Error',
        description,
        variant: 'destructive',
      });
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;
    
    try {
      // Validate password if provided
      if (editingUser.password && editingUser.password.trim().length > 0) {
        if (editingUser.password.trim().length < 6) {
          toast({
            title: 'Error',
            description: 'Password must be at least 6 characters long',
            variant: 'destructive',
          });
          return;
        }
      }
      
      const userId = editingUser._id;
      // Remove _id and joinedOn from the data being sent
      const { _id, joinedOn, createdAt, ...userData } = editingUser;
      
      // If password is empty string, remove it from the update data
      if (userData.password === '') {
        delete userData.password;
      }
      
      const response = await api.put(`/users/${userId}`, userData);
      
      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'User updated successfully',
        });
        
        // Refresh the users list
        fetchUsers();
        
        // Close dialog and reset state
        setIsEditDialogOpen(false);
        setEditingUser(null);
      } else {
        toast({
          title: 'Error',
          description: response.data.message || 'Failed to update user',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      console.error('Error updating user:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update user';
      
      // Highlight specific errors for better user experience
      let description = errorMessage;
      if (errorMessage.includes('admission number')) {
        description = 'This admission number is already in use. Please use a unique admission number.';
      }
      
      toast({
        title: 'Error',
        description,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const response = await api.delete(`/users/${id}`);
      
      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'User deleted successfully',
        });
        
        // Refresh the users list
        fetchUsers();
      } else {
        toast({
          title: 'Error',
          description: response.data.message || 'Failed to delete user',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      console.error('Error deleting user:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading users...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => fetchUsers()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manage Users</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add New User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input 
                  id="name" 
                  value={newUser.name} 
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={newUser.email} 
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">Password</Label>
                <Input 
                  id="password" 
                  type="password"
                  placeholder="Enter a password"
                  value={newUser.password} 
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="col-span-3" 
                />
                <div className="col-span-3 col-start-2 text-xs text-muted-foreground">
                  Password must be at least 6 characters long
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">Role</Label>
                <Select 
                  value={newUser.role} 
                  onValueChange={(value) => setNewUser({...newUser, role: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(newUser.role === 'Student' || newUser.role === 'student') && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="admissionNumber" className="text-right">Admission Number</Label>
                    <Input 
                      id="admissionNumber" 
                      value={newUser.admissionNumber || ''} 
                      onChange={(e) => setNewUser({...newUser, admissionNumber: e.target.value})}
                      className="col-span-3" 
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="batch" className="text-right">Batch</Label>
                    <Input 
                      id="batch" 
                      value={newUser.batch || ''} 
                      onChange={(e) => setNewUser({...newUser, batch: e.target.value})}
                      className="col-span-3" 
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddUser}>Add User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between space-x-2">
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={fetchUsers}>Refresh</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="py-3 px-4 text-left">Name</th>
                  <th className="py-3 px-4 text-left">Email</th>
                  <th className="py-3 px-4 text-left">Role</th>
                  <th className="py-3 px-4 text-left">Admission No.</th>
                  <th className="py-3 px-4 text-left">Batch</th>
                  <th className="py-3 px-4 text-left">Joined On</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr 
                      key={user._id} 
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => {
                        navigate(`/admin/users/${user._id}`);
                      }}
                    >
                      <td className="py-3 px-4">{user.name}</td>
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4">{user.role}</td>
                      <td className="py-3 px-4">
                        {user.role.toLowerCase() === 'student' ? 
                          (user.admissionNumber !== null && user.admissionNumber !== undefined ? user.admissionNumber : '(Not set)') : 
                          '-'}
                      </td>
                      <td className="py-3 px-4">
                        {user.role.toLowerCase() === 'student' ? 
                          (user.batch !== null && user.batch !== undefined ? user.batch : '(Not set)') : 
                          '-'}
                      </td>
                      <td className="py-3 px-4">{user.createdAt ? formatDate(user.createdAt) : '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent row click event
                              setEditingUser(user);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent row click event
                              if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
                                handleDeleteUser(user._id);
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-muted-foreground">
                      No users found. Try adjusting your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) setEditingUser(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">Name</Label>
                <Input 
                  id="edit-name" 
                  value={editingUser.name} 
                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">Email</Label>
                <Input 
                  id="edit-email" 
                  type="email"
                  value={editingUser.email} 
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-password" className="text-right">New Password</Label>
                <div className="col-span-3 flex gap-2">
                  <Input 
                    id="edit-password" 
                    type="password"
                    placeholder="Enter to change password"
                    value={editingUser.password || ''} 
                    onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                    className="flex-1" 
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditingUser({...editingUser, password: ''})}
                    size="sm"
                  >
                    Clear
                  </Button>
                </div>
                <div className="col-span-3 col-start-2 text-xs text-muted-foreground">
                  Leave empty to keep current password. New password must be at least 6 characters.
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role" className="text-right">Role</Label>
                <Select 
                  value={editingUser.role} 
                  onValueChange={(value) => setEditingUser({...editingUser, role: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(editingUser.role === 'Student' || editingUser.role === 'student') && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-admissionNumber" className="text-right">Admission Number</Label>
                    <Input 
                      id="edit-admissionNumber" 
                      value={editingUser.admissionNumber || ''} 
                      onChange={(e) => setEditingUser({...editingUser, admissionNumber: e.target.value})}
                      className="col-span-3" 
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-batch" className="text-right">Batch</Label>
                    <Input 
                      id="edit-batch" 
                      value={editingUser.batch || ''} 
                      onChange={(e) => setEditingUser({...editingUser, batch: e.target.value})}
                      className="col-span-3" 
                    />
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter className="flex justify-between">
            <Button 
              variant="destructive" 
              onClick={() => {
                if (editingUser && window.confirm(`Are you sure you want to delete ${editingUser.name}?`)) {
                  handleDeleteUser(editingUser._id);
                  setIsEditDialogOpen(false);
                }
              }}
            >
              Delete User
            </Button>
            <div>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="mr-2">Cancel</Button>
              <Button onClick={handleEditUser}>Save Changes</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageUsersPage; 