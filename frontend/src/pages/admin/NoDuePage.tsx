import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Printer } from "lucide-react";
import { format } from 'date-fns';
import { studentService, Student, Due } from '@/services/studentService';
import api from '@/utils/api';

// Print styles
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    .print-container, .print-container * {
      visibility: visible !important;
    }
    .print-container {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      padding: 0 !important;
      margin: 0 !important;
      border: none !important;
    }
    .certificate-wrapper {
      height: auto !important;
      overflow: visible !important;
      display: block !important;
      border: none !important;
    }
    @page {
      size: A4;
      margin: 0;
    }
    .no-print {
      display: none !important;
    }
  }
`;

interface ActiveBorrowing {
  bookTitle: string;
  dueDate: string;
}

interface Transaction {
  status: string;
  book: {
    title: string;
    [key: string]: any;
  };
  dueDate: string;
  [key: string]: any;
}

const NoDuePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [dues, setDues] = useState<Due[]>([]);
  const [activeBorrowings, setActiveBorrowings] = useState<ActiveBorrowing[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();
  const certificateRef = useRef<HTMLDivElement>(null);

  // Inject print styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = printStyles;
    document.head.appendChild(style);
    
    return () => {
      if (style.parentNode) {
        document.head.removeChild(style);
      }
    };
  }, []);

  const printCertificate = async () => {
    if (!student) {
      toast({
        title: "Error",
        description: "No student data available",
        variant: "destructive",
      });
      return;
    }

    // Set loading state
    setLoading(true);
    toast({
      title: "Checking",
      description: "Verifying student status before printing...",
    });

    try {
      // Re-fetch dues to be absolutely sure
      const duesResponse = await studentService.getStudentDues(student._id);
      const currentDues = duesResponse.success ? duesResponse.data || [] : [];
      
      // Re-fetch active borrowings to be absolutely sure
      const currentBorrowings = await checkActiveBorrowings(student._id);
      
      // Update UI with latest data
      setDues(currentDues);
      setActiveBorrowings(currentBorrowings);
      
      // Absolute check for any issues
      if (currentDues.length > 0) {
        setShowPreview(false);
        toast({
          title: "Cannot Print",
          description: `Student has ${currentDues.length} outstanding dues. Cannot issue No Due Certificate.`,
          variant: "destructive",
        });
        return;
      }
      
      if (currentBorrowings.length > 0) {
        setShowPreview(false);
        toast({
          title: "Cannot Print",
          description: `Student has ${currentBorrowings.length} active borrowings. Cannot issue No Due Certificate.`,
          variant: "destructive",
        });
        return;
      }
      
      // If we got this far, the student is eligible for a certificate
      setShowPreview(true);
      setTimeout(() => {
        printCertificateHelper();
      }, 500);
    } catch (error) {
      console.error("Error verifying student status:", error);
      toast({
        title: "Error",
        description: "Failed to verify student status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const printCertificateHelper = () => {
    console.log("Printing certificate");
    
    if (!certificateRef.current) {
      console.error("Certificate reference is not available");
      toast({
        title: "Error",
        description: "Certificate is not ready to print",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Using direct print method");
    
    try {
      // Create a new window with just the certificate
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error("Could not open print window");
      }
      
      // Write the certificate HTML to the new window
      const certificateHTML = certificateRef.current.outerHTML;
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>No Due Certificate - ${student?.admissionNumber || 'Student'}</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
              }
              .print-container {
                width: 210mm;
                margin: 0 auto;
                padding: 20mm;
                box-sizing: border-box;
              }
              @media print {
                @page {
                  size: A4;
                  margin: 0;
                }
                body {
                  margin: 0;
                }
              }
            </style>
          </head>
          <body>
            ${certificateHTML}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
    } catch (error) {
      console.error("Print failed:", error);
      toast({
        title: "Error",
        description: "Print failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  const checkActiveBorrowings = async (userId: string) => {
    try {
      console.log(`Fetching active borrowings for user ID: ${userId}`);
      
      // Use the correct API endpoint for user active transactions
      const response = await api.get(`/transactions/user/${userId}/active`);
      
      if (!response.data || !response.data.success) {
        console.error('Failed to fetch borrowings:', response.data);
        return [];
      }
      
      console.log('All transactions returned from API:', response.data.data);
      
      if (!Array.isArray(response.data.data)) {
        console.error('API did not return array of transactions:', response.data.data);
        return [];
      }
      
      // All transactions returned from this endpoint should be active borrowings
      const activeItems = response.data.data.map((transaction: Transaction) => ({
        bookTitle: transaction.book?.title || 'Unknown Book',
        dueDate: transaction.dueDate || new Date().toISOString()
      }));
      
      console.log(`Found ${activeItems.length} active borrowings for user ${userId}:`, activeItems);
      
      // Update the state
      setActiveBorrowings(activeItems);
      
      // If active borrowings are found, ensure preview is hidden
      if (activeItems.length > 0) {
        setShowPreview(false);
      }
      
      return activeItems;
    } catch (error) {
      console.error('Error checking active borrowings:', error);
      setActiveBorrowings([]);
      return [];
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a student admission number",
        variant: "destructive",
      });
      return;
    }

    // Reset all states at the beginning
    setLoading(true);
    setDues([]);
    setActiveBorrowings([]);
    setShowPreview(false); // Always start with preview hidden
    setStudent(null);
    
    try {
      // Get student information by admission number
      console.log('Fetching student data for admission number:', searchQuery);
      const studentResponse = await studentService.getStudentByAdmissionNumber(searchQuery);
      console.log('Student response:', studentResponse);
      
      if (!studentResponse.success || !studentResponse.data) {
        throw new Error('Student not found');
      }

      const foundStudent = studentResponse.data;
      setStudent(foundStudent);
      
      // First, check for active borrowings
      console.log('Checking for active borrowings for student ID:', foundStudent._id);
      const activeBorrows = await checkActiveBorrowings(foundStudent._id);
      console.log('Active borrowings found:', activeBorrows);
      
      // Then check for dues
      console.log('Fetching dues for student ID:', foundStudent._id);
      const duesResponse = await studentService.getStudentDues(foundStudent._id);
      console.log('Dues response:', duesResponse);
      
      // Get the student dues data
      const studentDues = duesResponse.success ? duesResponse.data || [] : [];
      setDues(studentDues);
      
      // Only show certificate preview if there are NO dues AND NO active borrowings
      const hasDues = studentDues.length > 0;
      const hasBorrowings = activeBorrows.length > 0;
      
      console.log('Student eligibility check - Has dues:', hasDues, 'Has borrowings:', hasBorrowings);
      
      if (!hasDues && !hasBorrowings) {
        console.log('Student is eligible for No Due Certificate - No dues and no borrowings');
        setShowPreview(true);
      } else {
        console.log('Student is NOT eligible for No Due Certificate');
        setShowPreview(false);
        
        // Show appropriate warning message
        if (hasDues) {
          toast({
            title: "Dues Detected",
            description: `Student has ${studentDues.length} outstanding dues. Cannot issue No Due Certificate.`,
            variant: "destructive",
          });
        } else if (hasBorrowings) {
          toast({
            title: "Active Borrowings Detected",
            description: `Student has ${activeBorrows.length} active borrowings. Cannot issue No Due Certificate.`,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error in handleSearch:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch student data",
        variant: "destructive",
      });
      setStudent(null);
      setDues([]);
      setActiveBorrowings([]);
      setShowPreview(false); // Ensure preview is hidden on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">No Due Certificate</h1>
      
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Enter Student Admission Number"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            'Search'
          )}
        </Button>
      </div>

      {student && (
        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent>
            {dues.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold text-red-600 mb-4">Outstanding Dues</h3>
                <div className="space-y-2">
                  {dues.map((due, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded">
                      <div>
                        <p className="font-medium">{due.bookTitle}</p>
                        <p className="text-sm text-gray-600">Due Date: {format(new Date(due.dueDate), 'PPP')}</p>
                      </div>
                      <p className="font-semibold text-red-600">₹{due.fine}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-red-600 font-medium">
                  Please clear all dues before requesting a No Due Certificate.
                </p>
              </div>
            ) : activeBorrowings.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold text-amber-600 mb-4">Active Borrowings</h3>
                <div className="space-y-2">
                  {activeBorrowings.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-amber-50 rounded">
                      <div>
                        <p className="font-medium">{item.bookTitle}</p>
                        <p className="text-sm text-gray-600">Due Date: {format(new Date(item.dueDate), 'PPP')}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-amber-600 font-medium">
                  Please return all borrowed books before requesting a No Due Certificate.
                </p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">Admission Number</p>
                    <p className="font-medium">{student.admissionNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{student.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Batch</p>
                    <p className="font-medium">{student.batch}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{student.email}</p>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Button 
                    onClick={printCertificate} 
                    className="flex items-center gap-2"
                  >
                    <Printer size={16} />
                    Print Certificate
                  </Button>
                </div>

                {showPreview && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                    <p className="text-sm text-blue-800 mb-2">
                      <strong>Certificate Preview:</strong> Your No Due Certificate is ready
                    </p>
                    <p className="text-xs text-blue-700">
                      Click the "Print Certificate" button to open the print dialog and get a hardcopy
                    </p>
                  </div>
                )}

                <div className="certificate-wrapper mt-8 border border-gray-200 rounded-md" style={{ 
                  overflow: 'hidden', 
                  height: showPreview ? 'auto' : '0',
                  display: showPreview ? 'block' : 'none'
                }}>
                  <div 
                    ref={certificateRef} 
                    className="print-container bg-white" 
                    style={{ 
                      width: '210mm',
                      minHeight: '297mm',
                      margin: '0 auto',
                      padding: '20mm',
                      boxSizing: 'border-box',
                      border: '1px solid #ddd',
                      visibility: 'visible',
                      position: 'relative',
                    }}
                  >
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold uppercase">No Due Certificate</h2>
                      <p className="text-lg mt-2">Library Department</p>
                      <div className="border-b-2 border-gray-300 w-1/2 mx-auto mt-4"></div>
                    </div>
                    
                    <div className="mb-12 mt-12 text-center">
                      <p className="mb-4">This is to certify that</p>
                      <p className="font-bold text-xl my-2">{student.name}</p>
                      <p className="mb-2">Admission Number: <span className="font-semibold">{student.admissionNumber}</span></p>
                      <p className="mb-8">Batch: <span className="font-semibold">{student.batch}</span></p>
                      <p className="text-lg">has <span className="font-bold underline">NO OUTSTANDING DUES</span> in the library.</p>
                      <p className="mt-6">This certificate is issued upon request for official purposes.</p>
                    </div>

                    <div className="mt-24">
                      <div className="flex justify-between">
                        <div>
                          <div className="border-t-2 border-black w-32"></div>
                          <p className="font-bold mt-2">Head Librarian</p>
                          <p>Library Department</p>
                        </div>
                        <div>
                          <div className="border-t-2 border-black w-32"></div>
                          <p className="font-bold mt-2">Principal</p>
                          <p>School Seal</p>
                        </div>
                      </div>
                      <div className="text-right mt-8">
                        <p>Date: {format(new Date(), 'PPP')}</p>
                        <p className="text-sm mt-2">Certificate No: LIB-{student.admissionNumber}-{format(new Date(), 'yyyyMMdd')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NoDuePage; 