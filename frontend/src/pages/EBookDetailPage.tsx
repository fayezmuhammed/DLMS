import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from '@/components/ui/use-toast';
import { EBook, ebookService } from '@/services/ebookService';
import { Book, bookService } from '@/services/bookService';
import api from '@/utils/api';

// Interface for User type
interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

const EBookDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ebook, setEbook] = useState<EBook | null>(null);
  const [relatedEbooks, setRelatedEbooks] = useState<EBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Fetch e-book data
  useEffect(() => {
    const fetchEbook = async () => {
      try {
        setLoading(true);
        if (!id) return;
        
        const response = await ebookService.getEBook(id);
        if (response.data) {
          setEbook(response.data);
          
          // Fetch related e-books
          const ebooksResponse = await ebookService.getEBooks();
          const allEbooks = ebooksResponse.data || [];
          
          // Filter related e-books by category
          if (response.data && response.data.category) {
            const categoryId = typeof response.data.category === 'object' 
              ? response.data.category._id 
              : response.data.category;
              
            const related = allEbooks
              .filter((b: EBook) => {
                if (!b.category) return false;
                
                const ebookCategoryId = typeof b.category === 'object' 
                  ? b.category._id 
                  : b.category;
                  
                return b._id !== response.data._id && 
                       ebookCategoryId === categoryId;
              })
              .slice(0, 3);
            
            setRelatedEbooks(related);
          }
        } else {
          setError('E-book not found');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching e-book:', err);
        setError('Failed to load e-book details');
        setLoading(false);
      }
    };

    if (id) {
      fetchEbook();
    }
  }, [id]);

  // Format file size in a readable format
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    
    const KB = 1024;
    const MB = KB * 1024;
    
    if (bytes < KB) {
      return `${bytes} bytes`;
    } else if (bytes < MB) {
      return `${(bytes / KB).toFixed(1)} KB`;
    } else {
      return `${(bytes / MB).toFixed(1)} MB`;
    }
  };

  // Handle downloading e-book
  const handleDownload = async () => {
    if (!ebook) return;
    
    // Check login requirements
    if (ebook.accessRestriction !== 'Public' && !user) {
      toast({
        title: "Authentication required",
        description: "Please log in to download this e-book",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
    
    // Check premium requirements
    if (ebook.accessRestriction === 'Premium' && (!user || user.role !== 'premium')) {
      toast({
        title: "Premium access required",
        description: "You need a premium membership to download this e-book",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setDownloadLoading(true);
      
      // Get download URL
      const downloadUrl = ebookService.getDownloadUrl(ebook._id);
      
      // Create an invisible link and click it to start download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${ebook.title}.${ebook.fileType}`);
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download started",
        description: "Your e-book download has started",
      });
    } catch (err) {
      console.error('Error downloading e-book:', err);
      toast({
        title: "Download failed",
        description: "Failed to download e-book. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDownloadLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading e-book details...</div>;
  }

  if (error || !ebook) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">E-Book Not Found</h1>
        <p className="text-muted-foreground mb-6">{error || "The e-book you're looking for doesn't exist or has been removed."}</p>
        <Button asChild>
          <Link to="/ebooks">Back to E-Books</Link>
        </Button>
      </div>
    );
  }

  // Check if the e-book is viewable directly in the browser
  const canViewInBrowser = ebook.fileType === 'pdf' || ebook.fileType === 'epub';
  // Allow both PDF and EPUB files to be viewed in browser

  return (
    <div>
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link to="/ebooks">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Back to E-Books
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* E-Book Cover */}
        <div className="md:col-span-1">
          <div className="rounded-lg overflow-hidden border border-border">
            <img 
              src={ebook.coverImage || ebook.image || ebook.imagePath || 'https://placehold.co/400x600?text=No+Cover'} 
              alt={ebook.title} 
              className="w-full h-auto object-cover"
            />
          </div>
          <div className="mt-4 space-y-3">
            {/* Download button */}
            {ebook.downloadable && (
              <Button 
                className="w-full" 
                onClick={handleDownload}
                disabled={downloadLoading}
              >
                {downloadLoading ? 'Processing...' : 'Download E-Book'}
              </Button>
            )}
            
            {/* Read Online button */}
            {canViewInBrowser && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open(ebookService.getViewUrl(ebook._id), '_blank')}
              >
                Read Online
              </Button>
            )}
            
            {/* Login reminder for restricted content */}
            {ebook.accessRestriction !== 'Public' && !user && (
              <div className="text-center text-sm text-muted-foreground mt-3">
                <p>Login required to access this e-book</p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto"
                  onClick={() => navigate('/login')}
                >
                  Login now
                </Button>
              </div>
            )}
            
            {/* Premium reminder */}
            {ebook.accessRestriction === 'Premium' && user && user.role !== 'premium' && (
              <div className="text-center text-sm text-amber-600 mt-3">
                <p>Premium membership required</p>
              </div>
            )}
          </div>
        </div>

        {/* E-Book Details */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{ebook.title}</h1>
            <p className="text-xl text-muted-foreground">by {ebook.author}</p>
            <div className="flex items-center mt-4 space-x-2">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                ebook.status === 'Available' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {ebook.status}
              </span>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                ebook.accessRestriction === 'Public' 
                  ? 'bg-blue-100 text-blue-800' 
                  : ebook.accessRestriction === 'Members'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-amber-100 text-amber-800'
              }`}>
                {ebook.accessRestriction} Access
              </span>
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-slate-100 text-slate-800">
                {ebook.fileType.toUpperCase()}
              </span>
            </div>
          </div>

          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="preview" disabled={!canViewInBrowser}>
                Preview
              </TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-4">
              <div className="prose max-w-none">
                <p>{ebook.description || 'No description available for this e-book.'}</p>
              </div>
            </TabsContent>
            <TabsContent value="details" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="font-medium">Format:</div>
                    <div>{ebook.fileType.toUpperCase()}</div>
                    
                    <div className="font-medium">File Size:</div>
                    <div>{formatFileSize(ebook.fileSize)}</div>
                    
                    {ebook.pages && (
                      <>
                        <div className="font-medium">Pages:</div>
                        <div>{ebook.pages}</div>
                      </>
                    )}
                    
                    <div className="font-medium">Category:</div>
                    <div>
                      {typeof ebook.category === 'object' && ebook.category?.name 
                        ? ebook.category.name 
                        : 'Unknown'}
                    </div>
                    
                    <div className="font-medium">ISBN:</div>
                    <div>{ebook.isbn || 'N/A'}</div>
                    
                    {ebook.publisher && (
                      <>
                        <div className="font-medium">Publisher:</div>
                        <div>{ebook.publisher}</div>
                      </>
                    )}
                    
                    {ebook.edition && (
                      <>
                        <div className="font-medium">Edition:</div>
                        <div>{ebook.edition}</div>
                      </>
                    )}
                    
                    <div className="font-medium">Access Level:</div>
                    <div>{ebook.accessRestriction}</div>
                    
                    <div className="font-medium">Downloadable:</div>
                    <div>{ebook.downloadable ? 'Yes' : 'No'}</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="preview" className="mt-4">
              {canViewInBrowser ? (
                <div className="aspect-video rounded overflow-hidden border border-border">
                  {ebook.fileType === 'pdf' ? (
                    <iframe 
                      src={`${ebookService.getViewUrl(ebook._id)}#toolbar=0&navpanes=0`}
                      title={`Preview of ${ebook.title}`}
                      className="w-full h-full"
                      onError={(e) => {
                        console.error('Error loading PDF preview:', e);
                        toast({
                          title: "Preview Error",
                          description: "Failed to load PDF preview. The file may be missing or inaccessible.",
                          variant: "destructive"
                        });
                      }}
                    />
                  ) : (
                    <iframe 
                      src={`${ebookService.getViewUrl(ebook._id)}`}
                      title={`Preview of ${ebook.title}`}
                      className="w-full h-[800px]" 
                      sandbox="allow-same-origin allow-scripts"
                      onError={(e) => {
                        console.error('Error loading EPUB preview:', e);
                        toast({
                          title: "Preview Error",
                          description: "Failed to load EPUB preview. The file may be missing or inaccessible.",
                          variant: "destructive"
                        });
                      }}
                    />
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p>Preview not available for this file format.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {relatedEbooks.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Similar E-Books</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedEbooks.map(relatedEbook => (
                  <Card key={relatedEbook._id} className="overflow-hidden">
                    <div className="aspect-[3/4] relative">
                      <img 
                        src={relatedEbook.coverImage || relatedEbook.image || relatedEbook.imagePath || 'https://placehold.co/400x600?text=No+Cover'} 
                        alt={relatedEbook.title} 
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-medium line-clamp-1">{relatedEbook.title}</h4>
                      <p className="text-sm text-muted-foreground">{relatedEbook.author}</p>
                      <Button variant="ghost" size="sm" className="mt-2 w-full" asChild>
                        <Link to={`/ebooks/${relatedEbook._id}`}>View</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EBookDetailPage; 