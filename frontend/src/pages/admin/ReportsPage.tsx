import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Initial mock data for reports
const initialBorrowingData = [
  { month: 'Jan', count: 45 },
  { month: 'Feb', count: 52 },
  { month: 'Mar', count: 38 },
  { month: 'Apr', count: 65 },
  { month: 'May', count: 48 },
  { month: 'Jun', count: 59 },
  { month: 'Jul', count: 42 },
  { month: 'Aug', count: 37 },
  { month: 'Sep', count: 68 },
  { month: 'Oct', count: 51 },
  { month: 'Nov', count: 43 },
  { month: 'Dec', count: 39 },
];

const initialCategoryData = [
  { name: 'Fiction', value: 35 },
  { name: 'Non-Fiction', value: 25 },
  { name: 'Science', value: 15 },
  { name: 'History', value: 10 },
  { name: 'Technology', value: 15 },
];

const initialOverdueData = [
  { name: 'On Time', value: 75 },
  { name: 'Overdue', value: 25 },
];

const initialPopularBooksData = [
  { name: 'To Kill a Mockingbird', count: 32 },
  { name: '1984', count: 28 },
  { name: 'The Great Gatsby', count: 24 },
  { name: 'Pride and Prejudice', count: 21 },
  { name: 'The Hobbit', count: 19 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState('borrowing');
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setMonth(new Date().getMonth() - 1))
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  
  // State for each type of report data
  const [borrowingData, setBorrowingData] = useState(initialBorrowingData);
  const [categoryData, setCategoryData] = useState(initialCategoryData);
  const [overdueData, setOverdueData] = useState(initialOverdueData);
  const [popularBooksData, setPopularBooksData] = useState(initialPopularBooksData);

  // Helper function to generate random data based on date range
  const generateRandomData = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const handleGenerateReport = () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }
    
    setIsGenerating(true);
    
    // Simulate API call
    setTimeout(() => {
      // Generate new data based on report type and date range
      switch (reportType) {
        case 'borrowing':
          const newBorrowingData = [...initialBorrowingData].map(item => ({
            ...item,
            count: generateRandomData(30, 80)
          }));
          setBorrowingData(newBorrowingData);
          break;
        
        case 'category':
          const newCategoryData = [...initialCategoryData].map(item => ({
            ...item,
            value: generateRandomData(5, 40)
          }));
          setCategoryData(newCategoryData);
          break;
        
        case 'overdue':
          const onTimeValue = generateRandomData(50, 90);
          const newOverdueData = [
            { name: 'On Time', value: onTimeValue },
            { name: 'Overdue', value: 100 - onTimeValue }
          ];
          setOverdueData(newOverdueData);
          break;
        
        case 'popular':
          const newPopularBooksData = [...initialPopularBooksData].map(item => ({
            ...item,
            count: generateRandomData(15, 50)
          }));
          setPopularBooksData(newPopularBooksData);
          break;
      }
      
      setIsGenerating(false);
      setReportGenerated(true);
    }, 1000);
  };

  const handleDownloadReport = () => {
    if (!reportGenerated) {
      alert('Please generate a report first before downloading');
      return;
    }
    
    // In a real app, this would generate and download a CSV or PDF file
    alert(`Downloading ${reportType} report for period: ${format(startDate!, 'PP')} to ${format(endDate!, 'PP')}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reports</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Reports</CardTitle>
          <CardDescription>
            Select report type and date range to generate reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reportType">Report Type</Label>
                <Select 
                  value={reportType} 
                  onValueChange={setReportType}
                >
                  <SelectTrigger id="reportType">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="borrowing">Borrowing Trends</SelectItem>
                    <SelectItem value="category">Book Categories</SelectItem>
                    <SelectItem value="overdue">Overdue Analysis</SelectItem>
                    <SelectItem value="popular">Popular Books</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="startDate"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="endDate"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-end">
                <Button 
                  className="w-full" 
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Generating...' : 'Generate Report'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="borrowing" value={reportType} onValueChange={setReportType}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="borrowing">Borrowing Trends</TabsTrigger>
          <TabsTrigger value="category">Book Categories</TabsTrigger>
          <TabsTrigger value="overdue">Overdue Analysis</TabsTrigger>
          <TabsTrigger value="popular">Popular Books</TabsTrigger>
        </TabsList>
        
        <TabsContent value="borrowing" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Monthly Borrowing Trends</CardTitle>
                <CardDescription>
                  {reportGenerated 
                    ? `Report for ${format(startDate!, 'PP')} to ${format(endDate!, 'PP')}`
                    : 'Generate a report to see data for a specific date range'}
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadReport}
                disabled={!reportGenerated}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={borrowingData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Books Borrowed" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="category" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Book Categories Distribution</CardTitle>
                <CardDescription>
                  {reportGenerated 
                    ? `Report for ${format(startDate!, 'PP')} to ${format(endDate!, 'PP')}`
                    : 'Generate a report to see data for a specific date range'}
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadReport}
                disabled={!reportGenerated}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} books`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="overdue" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Overdue Books Analysis</CardTitle>
                <CardDescription>
                  {reportGenerated 
                    ? `Report for ${format(startDate!, 'PP')} to ${format(endDate!, 'PP')}`
                    : 'Generate a report to see data for a specific date range'}
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadReport}
                disabled={!reportGenerated}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overdueData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#4CAF50" />
                      <Cell fill="#F44336" />
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="popular" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Most Popular Books</CardTitle>
                <CardDescription>
                  {reportGenerated 
                    ? `Report for ${format(startDate!, 'PP')} to ${format(endDate!, 'PP')}`
                    : 'Generate a report to see data for a specific date range'}
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadReport}
                disabled={!reportGenerated}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={popularBooksData}
                    layout="vertical"
                    margin={{
                      top: 20,
                      right: 30,
                      left: 100,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Times Borrowed" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage; 