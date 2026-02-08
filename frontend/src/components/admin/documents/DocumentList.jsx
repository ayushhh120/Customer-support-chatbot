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

  const formatSize = (size) =>
    typeof size === 'number'
      ?` ${(size / 1024 / 1024).toFixed(2)} MB`
      : '0.00 MB';

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return Number.isNaN(d.getTime())
      ? 'Invalid date'
      : d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <h3 className="text-lg font-semibold">Uploaded Documents</h3>

      {documents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>No documents uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={cn(
                "flex items-start gap-3 p-4 rounded-lg border",
                "border-border hover:bg-muted/50 transition",
                "overflow-hidden"
              )}
            >
              {/* Icon */}
              <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-medium text-sm break-words overflow-hidden text-ellipsis line-clamp-2 sm:line-clamp-1">
                  {doc.name}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="lex items-center gap-1 whitespace-nowrap">
                    <Calendar className="h-3 w-3 mb-1" />
                    {formatDate(doc.uploadDate || doc.upload_date)}
                  </span>
                  <span>{formatSize(doc.size)}</span>
                </div>
              </div>

              {/* Status + Delete */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge
                  className={cn(
                    "text-xs px-2 py-0.5",
                    doc.status === 'indexed'
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  )}
                >
                  {doc.status === 'indexed' ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Indexed
                    </>
                  ) : (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Processing
                    </>
                  )}
                </Badge>

                {doc.status === 'indexed' && (
                  <button
                    onClick={() => openConfirm(doc)}
                    className="p-1 rounded hover:bg-muted/60"
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Confirm Modal */}
      {confirmOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeConfirm} />
          <div className="bg-card p-6 rounded-lg z-10 w-full max-w-sm border">
            <h4 className="font-semibold mb-2">Confirm delete</h4>
            <p className="text-sm text-muted-foreground mb-4 break-words">
              Delete "{selectedDoc.name}"?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={closeConfirm} className="px-4 py-2 border rounded">
                Cancel
              </button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-destructive text-white rounded">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentList;