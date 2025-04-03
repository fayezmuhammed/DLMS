import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import api from '@/utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import settingsService, { Settings } from '@/services/settingsService';
import { Checkbox } from '@/components/ui/checkbox';

interface Category {
  _id: string;
  name: string;
  description: string;
}

const SettingsPage: React.FC = () => {
  const [generalSettings, setGeneralSettings] = useState({
    libraryName: 'Central Library',
    email: 'admin@library.com',
    phone: '+1 (555) 123-4567',
    address: '123 Library Street, Bookville, BK 12345',
  });

  const [borrowingSettings, setBorrowingSettings] = useState({
    maxBooksStudent: 3,
    maxBooksTeacher: 5,
    maxDaysStudent: 14,
    maxDaysTeacher: 30,
    finePerDay: 0.50,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    dueDateReminders: true,
    overdueNotifications: true,
    newBookNotifications: false,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Add email server settings state
  const [emailSettings, setEmailSettings] = useState({
    host: '',
    port: 587,
    secure: false,
    username: '',
    password: '',
    fromAddress: '',
    fromName: 'Library Management System'
  });

  useEffect(() => {
    fetchCategories();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsService.getSettings();
      if (response.success && response.data) {
        const settings = response.data;
        
        // Update general settings
        setGeneralSettings({
          libraryName: settings.libraryName,
          email: settings.email,
          phone: settings.phone,
          address: settings.address,
        });
        
        // Update borrowing settings
        setBorrowingSettings({
          maxBooksStudent: settings.maxBooksStudent,
          maxBooksTeacher: settings.maxBooksTeacher,
          maxDaysStudent: settings.maxDaysStudent,
          maxDaysTeacher: settings.maxDaysTeacher,
          finePerDay: settings.finePerDay,
        });
        
        // Update notification settings
        setNotificationSettings({
          emailNotifications: settings.emailNotifications,
          dueDateReminders: settings.dueDateReminders,
          overdueNotifications: settings.overdueNotifications,
          newBookNotifications: settings.newBookNotifications,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch settings',
        variant: 'destructive',
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch categories',
        variant: 'destructive',
      });
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post('/categories', newCategory);
      setCategories([...categories, response.data.data]);
      setNewCategory({ name: '', description: '' });
      toast({
        title: 'Success',
        description: 'Category added successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add category',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await api.delete(`/categories/${id}`);
      setCategories(categories.filter(cat => cat._id !== id));
      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete category',
        variant: 'destructive',
      });
    }
  };

  const handleGeneralSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGeneralSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBorrowingSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBorrowingSettings(prev => ({
      ...prev,
      [name]: name === 'finePerDay' ? parseFloat(value) : parseInt(value)
    }));
  };

  const handleNotificationToggle = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Combine all settings into one object
      const combinedSettings = {
        ...generalSettings,
        ...borrowingSettings,
        ...notificationSettings
      };
      
      const response = await settingsService.updateSettings(combinedSettings);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Settings saved successfully!'
        });
      } else {
        throw new Error(response.message || 'Failed to save settings');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Add email settings handlers
  const handleEmailSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setEmailSettings(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value
    }));
  };

  const handleSecureToggle = (checked: boolean) => {
    setEmailSettings(prev => ({
      ...prev,
      secure: checked
    }));
  };

  const handleTestEmail = async () => {
    const testEmail = prompt('Enter email address to send test to:');
    if (!testEmail) return;
    
    try {
      const response = await settingsService.testEmailSettings(testEmail);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Test email sent successfully!'
        });
      } else {
        throw new Error(response.message || 'Failed to send test email');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send test email',
        variant: 'destructive',
      });
    }
  };

  const handleSaveEmailSettings = async () => {
    try {
      const response = await settingsService.updateEmailServer(emailSettings);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Email settings saved successfully!'
        });
      } else {
        throw new Error(response.message || 'Failed to save email settings');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save email settings',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button onClick={handleSaveSettings} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="borrowing">Borrowing Rules</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Manage your library's general information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="libraryName">Library Name</Label>
                  <Input 
                    id="libraryName" 
                    name="libraryName"
                    value={generalSettings.libraryName} 
                    onChange={handleGeneralSettingsChange} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email"
                    type="email" 
                    value={generalSettings.email} 
                    onChange={handleGeneralSettingsChange} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    name="phone"
                    value={generalSettings.phone} 
                    onChange={handleGeneralSettingsChange} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input 
                    id="address" 
                    name="address"
                    value={generalSettings.address} 
                    onChange={handleGeneralSettingsChange} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="borrowing" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Borrowing Rules</CardTitle>
              <CardDescription>
                Configure book borrowing limits and fine rates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxBooksStudent">Max Books (Students)</Label>
                  <Input 
                    id="maxBooksStudent" 
                    name="maxBooksStudent"
                    type="number" 
                    value={borrowingSettings.maxBooksStudent} 
                    onChange={handleBorrowingSettingsChange} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxBooksTeacher">Max Books (Teachers)</Label>
                  <Input 
                    id="maxBooksTeacher" 
                    name="maxBooksTeacher"
                    type="number" 
                    value={borrowingSettings.maxBooksTeacher} 
                    onChange={handleBorrowingSettingsChange} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxDaysStudent">Max Days (Students)</Label>
                  <Input 
                    id="maxDaysStudent" 
                    name="maxDaysStudent"
                    type="number" 
                    value={borrowingSettings.maxDaysStudent} 
                    onChange={handleBorrowingSettingsChange} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxDaysTeacher">Max Days (Teachers)</Label>
                  <Input 
                    id="maxDaysTeacher" 
                    name="maxDaysTeacher"
                    type="number" 
                    value={borrowingSettings.maxDaysTeacher} 
                    onChange={handleBorrowingSettingsChange} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="finePerDay">Fine Per Day (₹)</Label>
                  <Input 
                    id="finePerDay" 
                    name="finePerDay"
                    type="number" 
                    step="0.01"
                    value={borrowingSettings.finePerDay} 
                    onChange={handleBorrowingSettingsChange} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure email notifications and alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications" className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable email notifications for system events
                    </p>
                  </div>
                  <Switch 
                    id="emailNotifications" 
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={() => handleNotificationToggle('emailNotifications')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="dueDateReminders" className="text-base">Due Date Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Send reminders before books are due
                    </p>
                  </div>
                  <Switch 
                    id="dueDateReminders" 
                    checked={notificationSettings.dueDateReminders}
                    onCheckedChange={() => handleNotificationToggle('dueDateReminders')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="overdueNotifications" className="text-base">Overdue Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications for overdue books
                    </p>
                  </div>
                  <Switch 
                    id="overdueNotifications" 
                    checked={notificationSettings.overdueNotifications}
                    onCheckedChange={() => handleNotificationToggle('overdueNotifications')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="newBookNotifications" className="text-base">New Book Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify users when new books are added
                    </p>
                  </div>
                  <Switch 
                    id="newBookNotifications" 
                    checked={notificationSettings.newBookNotifications}
                    onCheckedChange={() => handleNotificationToggle('newBookNotifications')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="email" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Configure your email server for notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emailHost">SMTP Host</Label>
                  <Input 
                    id="emailHost" 
                    name="host"
                    value={emailSettings.host}
                    onChange={handleEmailSettingsChange}
                    placeholder="smtp.example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailPort">SMTP Port</Label>
                  <Input 
                    id="emailPort" 
                    name="port"
                    type="number"
                    value={emailSettings.port}
                    onChange={handleEmailSettingsChange}
                    placeholder="587"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailUsername">Username</Label>
                  <Input 
                    id="emailUsername" 
                    name="username"
                    value={emailSettings.username}
                    onChange={handleEmailSettingsChange}
                    placeholder="your-email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailPassword">Password</Label>
                  <Input 
                    id="emailPassword" 
                    name="password"
                    type="password"
                    value={emailSettings.password}
                    onChange={handleEmailSettingsChange}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromAddress">From Email</Label>
                  <Input 
                    id="fromAddress" 
                    name="fromAddress"
                    value={emailSettings.fromAddress}
                    onChange={handleEmailSettingsChange}
                    placeholder="library@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input 
                    id="fromName" 
                    name="fromName"
                    value={emailSettings.fromName}
                    onChange={handleEmailSettingsChange}
                    placeholder="Library Management System"
                  />
                </div>
                <div className="col-span-2 flex items-center space-x-2">
                  <Checkbox 
                    id="secureConnection" 
                    checked={emailSettings.secure}
                    onCheckedChange={handleSecureToggle}
                  />
                  <Label htmlFor="secureConnection">Use secure connection (SSL/TLS)</Label>
                </div>
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handleTestEmail}>Test Email</Button>
                <Button onClick={handleSaveEmailSettings}>Save Email Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Management</CardTitle>
              <CardDescription>
                Manage your library's categories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddCategory} className="space-y-4 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Category Name</label>
                    <Input
                      type="text"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="Enter category name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Input
                      type="text"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      placeholder="Enter category description"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Category'}
                </Button>
              </form>

              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Existing Categories</h3>
                  <div className="space-y-4">
                    {categories.map((category) => (
                      <div
                        key={category._id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium">{category.name}</h4>
                          {category.description && (
                            <p className="text-sm text-gray-500">{category.description}</p>
                          )}
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCategory(category._id)}
                        >
                          Delete
                        </Button>
                      </div>
                    ))}
                    {categories.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No categories found</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage; 