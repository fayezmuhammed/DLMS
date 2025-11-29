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
import { reportService, BorrowingTrendData, CategoryData, OverdueData, PopularBookData } from '@/services/reportService';
import { useToast } from '@/components/ui/use-toast';
import * as XLSX from 'xlsx';

// Initial empty data structures for reports
const initialBorrowingData: BorrowingTrendData[] = [];
const initialCategoryData: CategoryData[] = [];
const initialOverdueData: OverdueData[] = [];
const initialPopularBooksData: PopularBookData[] = [];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ReportsPage: React.FC = () => {
  const { toast } = useToast();
  const [reportType, setReportType] = useState('borrowing');
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setMonth(new Date().getMonth() - 1))
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  
  // State for each type of report data
  const [borrowingData, setBorrowingData] = useState<BorrowingTrendData[]>(initialBorrowingData);
  const [categoryData, setCategoryData] = useState<CategoryData[]>(initialCategoryData);
  const [overdueData, setOverdueData] = useState<OverdueData[]>(initialOverdueData);
  const [popularBooksData, setPopularBooksData] = useState<PopularBookData[]>(initialPopularBooksData);

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Fetch data based on report type
      switch (reportType) {
        case 'borrowing':
          const borrowingResponse = await reportService.getBorrowingTrends(startDate, endDate);
          if (borrowingResponse.success) {
            setBorrowingData(borrowingResponse.data);
          } else {
            throw new Error(borrowingResponse.message || 'Failed to fetch borrowing trends');
          }
          break;
        
        case 'category':
          const categoryResponse = await reportService.getCategoryDistribution(startDate, endDate);
          if (categoryResponse.success) {
            setCategoryData(categoryResponse.data);
          } else {
            throw new Error(categoryResponse.message || 'Failed to fetch category distribution');
          }
          break;
        
        case 'overdue':
          const overdueResponse = await reportService.getOverdueAnalysis(startDate, endDate);
          if (overdueResponse.success) {
            setOverdueData(overdueResponse.data);
          } else {
            throw new Error(overdueResponse.message || 'Failed to fetch overdue analysis');
          }
          break;
        
        case 'popular':
          const popularResponse = await reportService.getPopularBooks(startDate, endDate);
          if (popularResponse.success) {
            setPopularBooksData(popularResponse.data);
          } else {
            throw new Error(popularResponse.message || 'Failed to fetch popular books');
          }
          break;
      }
      
      setReportGenerated(true);
      toast({
        title: "Success",
        description: "Report generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = () => {
    if (!reportGenerated) {
      toast({
        title: "Error",
        description: "Please generate a report first before downloading",
        variant: "destructive",
      });
      return;
    }
    
    let dataToExport: any[] = [];
    let fileName = `${reportType}-report-${format(startDate!, 'yyyy-MM-dd')}-to-${format(endDate!, 'yyyy-MM-dd')}.xlsx`;
    
    try {
      // Prepare data based on report type
      switch (reportType) {
        case 'borrowing':
          dataToExport = borrowingData.map(item => ({
            Month: item.month,
            'Books Borrowed': item.count
          }));
          break;
        
        case 'category':
          dataToExport = categoryData.map(item => ({
            Category: item.name,
            'Number of Books': item.value
          }));
          break;
        
        case 'overdue':
          dataToExport = overdueData.map(item => ({
            'Overdue Status': item.name,
            'Number of Books': item.value
          }));
          break;
        
        case 'popular':
          dataToExport = popularBooksData.map(item => ({
            'Book Title': item.name,
            'Borrow Count': item.count
          }));
          break;
      }
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
      
      // Generate Excel file and trigger download
      XLSX.writeFile(workbook, fileName);
      
      toast({
        title: "Success",
        description: "Report downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: "Error",
        description: "Failed to download report",
        variant: "destructive",
      });
    }
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
                {borrowingData.length > 0 ? (
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
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No data available. Please generate a report.
                  </div>
                )}
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
                {categoryData.length > 0 ? (
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
                        {categoryData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} books`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No data available. Please generate a report.
                  </div>
                )}
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
                {overdueData.length > 0 ? (
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
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No data available. Please generate a report.
                  </div>
                )}
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
                {popularBooksData.length > 0 ? (
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
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No data available. Please generate a report.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage; 