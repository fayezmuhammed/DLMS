import React, { useState, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useReactToPrint } from 'react-to-print';
import { format } from 'date-fns';

interface Student {
  _id: string;
  admnNo: string;
  name: string;
  batch: string;
  email: string;
  phoneNumber: string;
}

interface Due {
  bookTitle: string;
  dueDate: string;
  fine: number;
}

const NoDuePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [dues, setDues] = useState<Due[]>([]);
  const [loading, setLoading] = useState(false);
  const [signature, setSignature] = useState('');
  const { toast } = useToast();
  const certificateRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => certificateRef.current,
    onBeforeGetContent: () => {
      if (!signature.trim()) {
        toast({
          title: "Error",
          description: "Please add a signature before printing",
          variant: "destructive",
        });
        return false;
      }
      return true;
    }
  });

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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/students/${searchQuery}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch student data');
      }

      setStudent(data.student);
      
      // Fetch dues for the student
      const duesResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/dues/${data.student._id}`);
      const duesData = await duesResponse.json();
      
      if (duesData.dues && duesData.dues.length > 0) {
        setDues(duesData.dues);
      } else {
        setDues([]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch student data",
        variant: "destructive",
      });
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
                    <p className="font-medium">{student.admnNo}</p>
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

                <div className="mt-6">
                  <label className="block text-sm font-medium mb-2">Signature</label>
                  <Input
                    placeholder="Enter your signature"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    className="max-w-md"
                  />
                </div>

                <div className="mt-6">
                  <Button onClick={handlePrint}>Print No Due Certificate</Button>
                </div>

                <div className="hidden">
                  <div ref={certificateRef} className="p-8">
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold">No Due Certificate</h2>
                      <p className="text-lg">Library Department</p>
                    </div>
                    
                    <div className="mb-8">
                      <p>This is to certify that</p>
                      <p className="font-bold text-xl my-2">{student.name}</p>
                      <p>Admission Number: {student.admnNo}</p>
                      <p>Batch: {student.batch}</p>
                      <p>has no outstanding dues in the library.</p>
                    </div>

                    <div className="mt-16">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-bold">{signature}</p>
                          <p>Librarian</p>
                        </div>
                        <div>
                          <p>Date: {format(new Date(), 'PPP')}</p>
                        </div>
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