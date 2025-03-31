import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Download, Printer } from "lucide-react";
import { useReactToPrint } from 'react-to-print';
import { format } from 'date-fns';
import { studentService, Student, Due } from '@/services/studentService';

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

const NoDuePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [dues, setDues] = useState<Due[]>([]);
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

  const handlePrint = useReactToPrint({
    content: () => certificateRef.current,
    documentTitle: `No_Due_Certificate_${student?.admissionNumber || 'Student'}`,
    onBeforeGetContent: () => {
      return new Promise<void>((resolve) => {
        setShowPreview(true);
        setTimeout(() => {
          resolve();
        }, 500);
      });
    },
    onAfterPrint: () => {
      setShowPreview(false);
    },
    removeAfterPrint: false,
    suppressErrors: false,
    onPrintError: (error) => {
      console.error("Print error:", error);
      toast({
        title: "Error",
        description: "Failed to print: " + error,
        variant: "destructive",
      });
      setShowPreview(false);
    },
    copyStyles: true,
    pageStyle: "@page { size: A4; margin: 2cm; }",
  });

  const downloadCertificate = () => {
    if (student) {
      console.log("Attempting to print certificate");
      handlePrint();
    } else {
      toast({
        title: "Error",
        description: "No student data available",
        variant: "destructive",
      });
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

    setLoading(true);
    try {
      // Get student information by admission number
      const studentResponse = await studentService.getStudentByAdmissionNumber(searchQuery);
      
      if (!studentResponse.success || !studentResponse.data) {
        throw new Error('Student not found');
      }

      const foundStudent = studentResponse.data;
      setStudent(foundStudent);
      
      // Get dues for the student
      const duesResponse = await studentService.getStudentDues(foundStudent._id);
      
      if (duesResponse.success) {
        setDues(duesResponse.data || []);
      } else {
        throw new Error('Failed to fetch student dues');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch student data",
        variant: "destructive",
      });
      setStudent(null);
      setDues([]);
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
                    onClick={() => setShowPreview(!showPreview)} 
                    variant="outline" 
                    className="flex items-center gap-2"
                  >
                    <Printer size={16} />
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </Button>
                  
                  <Button onClick={downloadCertificate} className="flex items-center gap-2">
                    <Download size={16} />
                    Download Certificate
                  </Button>
                </div>

                {showPreview && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                    <p className="text-sm text-blue-800 mb-2">
                      <strong>Preview Mode:</strong> Certificate ready for download
                    </p>
                    <p className="text-xs text-blue-700">
                      Click "Download Certificate" to save as PDF
                    </p>
                  </div>
                )}

                {/* Certificate Print Wrapper */}
                <div className="certificate-wrapper" style={{ overflow: 'hidden', height: showPreview ? 'auto' : '0' }}>
                  {/* Certificate to print */}
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
                      visibility: showPreview ? 'visible' : 'hidden',
                      position: showPreview ? 'relative' : 'absolute',
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