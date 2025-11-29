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
import { authService } from '@/services/authService';
import { transactionService, UserStats } from '@/services/transactionService';

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
  const [stats, setStats] = useState<UserStats>({
    totalBorrowed: 0,
    currentBorrowed: 0,
    overdue: 0,
    wishlistItems: 0,
    recentActivities: []
  });

  useEffect(() => {
    fetchUserProfile();
    fetchUserStats();
  }, [navigate]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await authService.getProfile();
      
      if (response.success && response.data) {
        setUser(response.data);
        setFormData({
          name: response.data.name || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          address: response.data.address || '',
          bio: response.data.bio || '',
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: '',
        });
      } else {
        // If no valid user profile, redirect to login
        toast({
          title: "Authentication error",
          description: "Please login to view your profile",
          variant: "destructive",
        });
        navigate('/login', { replace: true });
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      navigate('/login', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await transactionService.getUserStatistics();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching user statistics:', err);
      // Don't redirect here, non-critical data
    }
  };

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

  const handleSaveProfile = async () => {
    if (user) {
      try {
        const profileData = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          bio: formData.bio,
        };
        
        const response = await authService.updateProfile(profileData);
        
        if (response.success) {
          // Update local user state
          setUser(response.data);
          setIsEditing(false);
          
          // Also update localStorage to keep UI consistent
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            const updatedStoredUser = { ...parsedUser, ...profileData };
            localStorage.setItem('user', JSON.stringify(updatedStoredUser));
          }
          
          toast({
            title: "Profile updated",
            description: "Your profile has been successfully updated.",
          });
        } else {
          toast({
            title: "Update failed",
            description: response.message || "Failed to update profile. Please try again.",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error('Error updating profile:', err);
        toast({
          title: "Error",
          description: "Failed to update profile. Please try again later.",
          variant: "destructive",
        });
      }
    }
  };

  const handlePasswordChange = async () => {
    if (formData.newPassword !== formData.confirmNewPassword) {
      toast({
        title: "Passwords do not match",
        description: "New password and confirmation must match.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await authService.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      if (response.success) {
        // Reset password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: '',
        }));
        
        toast({
          title: "Password updated",
          description: "Your password has been successfully changed.",
        });
      } else {
        toast({
          title: "Password change failed",
          description: response.message || "Failed to update password. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Error changing password:', err);
      toast({
        title: "Error",
        description: "Failed to change password. Please try again later.",
        variant: "destructive",
      });
    }
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'borrow':
        return '📚'; // Book emoji for borrowing
      case 'return':
        return '📋'; // Clipboard emoji for returns
      case 'wishlist_add':
        return '❤️'; // Heart emoji for wishlisting
      default:
        return '📝'; // Default activity icon
    }
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
                    {stats.recentActivities && stats.recentActivities.length > 0 ? (
                      stats.recentActivities.map((activity) => (
                        <div 
                          key={activity.id}
                          className="flex items-start p-3 border rounded-md hover:bg-gray-50"
                        >
                          <div className="text-2xl mr-4">{getActivityIcon(activity.type)}</div>
                          <div>
                            <h4 className="font-medium">
                              {activity.type === 'borrow' ? 'Borrowed' : 
                               activity.type === 'return' ? 'Returned' : 
                               'Added to wishlist'}
                            </h4>
                            <p className="text-gray-700">{activity.book}</p>
                            <p className="text-sm text-gray-500">
                              {formatDate(activity.date)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        No recent activities found
                      </div>
                    )}
                    
                    <div className="text-center pt-4">
                      <Button 
                        variant="outline"
                        onClick={() => navigate('/transactions')}
                      >
                        View All Transactions
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 