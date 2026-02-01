import { useState, useEffect } from 'react';
import DocumentUpload from '@/components/admin/documents/DocumentUpload';
import DocumentList from '@/components/admin/documents/DocumentList';
import API from '../../services/axiosInstance'

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = async () => {
    const res = await API.get('/admin/documents');
    setDocuments(res.data);
  };

  useEffect(() => {
    fetchDocs().finally(() => setLoading(false));
  }, []);

  const handleUploadSuccess = async () => {
    await fetchDocs();
  };

  const handleDelete = async (docId) => {
    try {
      await API.delete(`/admin/delete/${docId}`);
      await fetchDocs();
    } catch (err) {
      console.error('Failed to delete document', err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold">Documents</h2>
        <p className="text-muted-foreground">
          Upload and manage knowledge base documents
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DocumentUpload onUploadSuccess={handleUploadSuccess} />

        {loading ? (
          <p className="text-muted-foreground">Loading documents...</p>
        ) : (
          <DocumentList documents={documents} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
};


export default Documents;