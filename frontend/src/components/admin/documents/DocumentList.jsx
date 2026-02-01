import { FileText, CheckCircle, Loader2, Calendar, Trash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { useState } from 'react';

const DocumentList = ({ documents, onDelete }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const openConfirm = (doc) => {
    setSelectedDoc(doc);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setSelectedDoc(null);
    setConfirmOpen(false);
  };

  const confirmDelete = async () => {
    if (!selectedDoc) return;
    await onDelete?.(selectedDoc.id);
    closeConfirm();
  };

  const formatSize = (size) => {
    if (typeof size === 'number') return `${(size / 1024 / 1024).toFixed(2)} MB`;
    return size || '0.00 MB';
  };

  const formatDate = (dateStr) => {
    const d = dateStr ? new Date(dateStr) : null;
    if (!d || Number.isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-4">
      <h3 className="text-lg font-semibold">Uploaded Documents</h3>
      
      {documents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No documents uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={cn(
                "flex items-center gap-4 p-4 rounded-lg border border-border",
                "transition-all duration-200 hover:bg-muted/50"
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{doc.name}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(doc.uploadDate || doc.upload_date)}
                  </span>
                  <span>{formatSize(doc.size)}</span>
                </div>
              </div>
              
              <Badge
                variant="outline"
                className={cn(
                  "flex items-center gap-1",
                  doc.status === 'indexed' 
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                )}
              >
                {doc.status === 'indexed' ? (
                  <>
                    <CheckCircle className="h-3 w-3" />
                    Indexed
                  </>
                ) : (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Processing
                  </>
                )}
              </Badge>

              {doc.status === 'indexed' && (
                <button
                  onClick={() => openConfirm(doc)}
                  title="Delete document"
                  aria-label="Delete document"
                  className="p-2 rounded hover:bg-muted/50"
                >
                  <Trash className="h-4 w-4 text-red-600 dark:text-red-400" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {confirmOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeConfirm} />
          <div className="bg-card p-6 rounded-lg z-10 w-full max-w-md border border-border">
            <h4 className="text-lg font-semibold mb-2">Confirm delete</h4>
            <p className="text-sm text-muted-foreground mb-4">This will delete indexed document "{selectedDoc.name}". Confirm or cancel?</p>
            <div className="flex justify-end gap-3">
              <button onClick={closeConfirm} className="px-4 py-2 rounded border border-border">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded bg-destructive text-white">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentList;
