import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from '@/components/ui/use-toast';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  imagePath?: string;
  phone?: string;
  address?: string;
  bio?: string;
  preferences?: {
    genres: string[];
    notificationEnabled: boolean;
  };
  registeredDate?: string;
}

const ProfilePage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  // Statistics for the user
  const stats = {
    totalBorrowed: 27,
    currentBorrowed: 3,
    overdue: 0,
    wishlistItems: 12,
  };

  // Recent activities (mock data)
  const recentActivities = [
    { 
      id: 1, 
      type: 'borrow', 
      book: 'To Kill a Mockingbird', 
      date: '2023-10-20' 
    },
    { 
      id: 2, 
      type: 'return', 
      book: '1984', 
      date: '2023-10-18' 
    },
    { 
      id: 3, 
      type: 'wishlist_add', 
      book: 'Pride and Prejudice', 
      date: '2023-10-15' 
    },
    { 
      id: 4, 
      type: 'borrow', 
      book: 'The Great Gatsby', 
      date: '2023-10-10' 
    },
  ];

  useEffect(() => {
    // Fetch user data from localStorage
    const storedUser = localStorage.getItem('user');
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    
    if (storedUser && isAuthenticated) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setFormData({
          name: parsedUser.name || '',
          email: parsedUser.email || '',
          phone: parsedUser.phone || '',
          address: parsedUser.address || '',
          bio: parsedUser.bio || '',
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: '',
        });
      } catch (err) {
        console.error('Error parsing user data:', err);
        navigate('/login', { replace: true });
      }
    } else {
      navigate('/login', { replace: true });
    }
    setLoading(false);
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset form data
      if (user) {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          address: user.address || '',
          bio: user.bio || '',
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: '',
        });
      }
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = () => {
    // In a real app, you would send this to your backend
    if (user) {
      const updatedUser = {
        ...user,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        bio: formData.bio,
      };
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsEditing(false);
      
      // Show success toast
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    }
  };

  const handlePasswordChange = () => {
    if (formData.newPassword !== formData.confirmNewPassword) {
      toast({
        title: "Passwords do not match",
        description: "New password and confirmation must match.",
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, you would validate the current password and send the new one to your backend
    
    // Reset password fields
    setFormData(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    }));
    
    // Show success toast
    toast({
      title: "Password updated",
      description: "Your password has been successfully changed.",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-medium mb-4">User Not Found</h1>
        <p className="text-gray-600 mb-6">Please log in to view your profile.</p>
        <Button onClick={() => navigate('/login')}>Go to Login</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <h1 className="text-3xl font-light mb-8 text-gray-900">My Profile</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - User Info Card */}
        <div className="lg:col-span-1">
          <Card className="shadow-sm">
            <CardHeader className="text-center border-b pb-6">
              <div className="mx-auto mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.imagePath} />
                  <AvatarFallback className="text-2xl bg-indigo-100 text-indigo-700">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-xl font-medium">{user.name}</CardTitle>
              <CardDescription className="text-gray-600 mt-1">{user.email}</CardDescription>
              {user.registeredDate && (
                <CardDescription className="text-gray-500 text-xs mt-2">
                  Member since {formatDate(user.registeredDate || new Date().toISOString())}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="py-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-medium text-indigo-600">{stats.totalBorrowed}</p>
                    <p className="text-sm text-gray-600">Books Borrowed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-medium text-indigo-600">{stats.wishlistItems}</p>
                    <p className="text-sm text-gray-600">Wishlist Items</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-medium text-indigo-600">{stats.currentBorrowed}</p>
                    <p className="text-sm text-gray-600">Current Borrows</p>
                  </div>
                  <div>
                    <p className="text-2xl font-medium text-indigo-600">{stats.overdue}</p>
                    <p className="text-sm text-gray-600">Overdue</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 rounded-b-lg flex justify-center py-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/transactions')}
                className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
              >
                View My Transactions
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Right Column - Tabs for Profile Details, Security, etc. */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="details">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="details" className="flex-1">Profile Details</TabsTrigger>
              <TabsTrigger value="security" className="flex-1">Security</TabsTrigger>
              <TabsTrigger value="activity" className="flex-1">Recent Activity</TabsTrigger>
            </TabsList>
            
            {/* Profile Details Tab */}
            <TabsContent value="details">
              <Card>
                <CardHeader className="border-b">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-medium">Personal Information</CardTitle>
                    <Button 
                      onClick={handleEditToggle}
                      variant={isEditing ? "outline" : "default"}
                    >
                      {isEditing ? 'Cancel' : 'Edit Profile'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="py-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      {isEditing ? (
                        <Input 
                          id="name" 
                          name="name" 
                          value={formData.name}
                          onChange={handleChange}
                        />
                      ) : (
                        <p className="text-gray-700 pt-1">{user.name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      {isEditing ? (
                        <Input 
                          id="email" 
                          name="email" 
                          value={formData.email}
                          onChange={handleChange}
                        />
                      ) : (
                        <p className="text-gray-700 pt-1">{user.email}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      {isEditing ? (
                        <Input 
                          id="phone" 
                          name="phone" 
                          value={formData.phone}
                          onChange={handleChange}
                        />
                      ) : (
                        <p className="text-gray-700 pt-1">{user.phone || 'Not provided'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <p className="text-gray-700 pt-1">{user.role}</p>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      {isEditing ? (
                        <Input 
                          id="address" 
                          name="address" 
                          value={formData.address}
                          onChange={handleChange}
                        />
                      ) : (
                        <p className="text-gray-700 pt-1">{user.address || 'Not provided'}</p>
                      )}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="bio">Bio</Label>
                      {isEditing ? (
                        <textarea 
                          id="bio" 
                          name="bio" 
                          value={formData.bio}
                          onChange={handleChange}
                          className="w-full min-h-[100px] px-3 py-2 text-gray-700 border rounded-md focus:outline-none focus:border-indigo-500"
                        />
                      ) : (
                        <p className="text-gray-700 pt-1">{user.bio || 'No bio provided'}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
                {isEditing && (
                  <CardFooter className="bg-gray-50 border-t">
                    <Button onClick={handleSaveProfile} className="ml-auto">
                      Save Changes
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
            
            {/* Security Tab */}
            <TabsContent value="security">
              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="text-lg font-medium">Password & Security</CardTitle>
                  <CardDescription>Update your password and manage security settings</CardDescription>
                </CardHeader>
                <CardContent className="py-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-md font-medium">Change Password</h3>
                    <div className="space-y-4 max-w-md">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input 
                          id="currentPassword" 
                          name="currentPassword" 
                          type="password" 
                          value={formData.currentPassword}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input 
                          id="newPassword" 
                          name="newPassword" 
                          type="password" 
                          value={formData.newPassword}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                        <Input 
                          id="confirmNewPassword" 
                          name="confirmNewPassword" 
                          type="password" 
                          value={formData.confirmNewPassword}
                          onChange={handleChange}
                        />
                      </div>
                      <Button 
                        onClick={handlePasswordChange}
                        disabled={!formData.currentPassword || !formData.newPassword || !formData.confirmNewPassword}
                      >
                        Update Password
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Activity Tab */}
            <TabsContent value="activity">
              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
                  <CardDescription>Your recent library activities</CardDescription>
                </CardHeader>
                <CardContent className="py-6">
                  <div className="space-y-4">
                    {recentActivities.map(activity => (
                      <div key={activity.id} className="flex items-start border-b border-gray-100 pb-4">
                        <div className={`
                          h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 mr-3
                          ${activity.type === 'borrow' ? 'bg-green-100 text-green-600' : 
                            activity.type === 'return' ? 'bg-blue-100 text-blue-600' : 
                            'bg-purple-100 text-purple-600'}
                        `}>
                          {activity.type === 'borrow' ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                          ) : activity.type === 'return' ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                            </svg>
                          )}
                        </div>
                        <div className="flex-grow">
                          <div className="flex justify-between">
                            <p className="text-sm font-medium">
                              {activity.type === 'borrow' ? 'Borrowed' : 
                               activity.type === 'return' ? 'Returned' : 
                               'Added to Wishlist'}
                            </p>
                            <p className="text-xs text-gray-500">{formatDate(activity.date)}</p>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{activity.book}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 border-t flex justify-center py-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate('/transactions')}
                    className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                  >
                    View All Activity
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 