#!/usr/bin/env python3
"""
Utility script to check and clear all chunks from Chroma vector store.
Run this from the backend directory: python3 clear_chroma.py
"""

import sys
from pathlib import Path

# Add the backend directory to path
sys.path.insert(0, str(Path(__file__).parent))

from langchain_chroma import Chroma
from app.core.llm import get_embedding_model

def check_and_clear_chroma():
    """Check Chroma collection and clear all chunks if they exist."""
    
    # Get the Chroma path (same as used in ingestion)
    chroma_path = Path("app/storage/chroma").resolve()
    
    print("=" * 60)
    print("Chroma Vector Store Cleanup Utility")
    print("=" * 60)
    print(f"\n📍 Chroma path: {chroma_path}")
    print(f"   Path exists: {chroma_path.exists()}")
    
    if not chroma_path.exists():
        print("\n❌ Chroma directory not found. Nothing to clear.")
        return
    
    if not (chroma_path / "chroma.sqlite3").exists():
        print("\n❌ Chroma database not found. Nothing to clear.")
        return
    
    try:
        # Load Chroma collection
        print("\n🔍 Loading Chroma collection...")
        chroma = Chroma(
            persist_directory=str(chroma_path),
            embedding_function=get_embedding_model(),
            collection_name="company_kb"
        )
        
        collection = chroma._collection
        
        # Get current count
        count = collection.count()
        print(f"\n📊 Current Status:")
        print(f"   Total chunks in collection: {count}")
        
        if count == 0:
            print("\n✅ Collection is already empty! Nothing to delete.")
            return
        
        # Get sample of doc_ids for info
        try:
            sample_docs = chroma.similarity_search("", k=min(10, count))
            unique_doc_ids = set()
            for doc in sample_docs:
                if "doc_id" in doc.metadata:
                    unique_doc_ids.add(doc.metadata["doc_id"])
            if unique_doc_ids:
                print(f"   Sample doc_ids found: {list(unique_doc_ids)[:5]}")
        except Exception as e:
            print(f"   (Could not get sample doc_ids: {e})")
        
        # Get all IDs
        print(f"\n🗑️  Preparing to delete all {count} chunks...")
        all_results = collection.get()
        all_ids = all_results.get("ids", [])
        
        if not all_ids:
            print("   ⚠️  No IDs found, but count > 0. Trying alternative method...")
            # Try to delete using where clause that matches all
            # Or delete the entire collection
            try:
                # Delete all by getting everything
                collection.delete(ids=None)  # This might not work
                print("   Attempted collection-wide deletion")
            except:
                # Last resort: delete the collection file
                print("   ⚠️  Standard deletion failed. You may need to manually delete the chroma directory.")
        else:
            # Delete all chunks by IDs
            print(f"   Found {len(all_ids)} document IDs to delete")
            
            # Use collection.delete() directly - more reliable than chroma.delete()
            try:
                collection.delete(ids=all_ids)
                print(f"   ✅ Deleted {len(all_ids)} chunks using collection.delete()")
            except Exception as e:
                print(f"   ⚠️  collection.delete() failed: {e}")
                # Fallback: try chroma.delete()
                try:
                    deleted = chroma.delete(ids=all_ids)
                    if deleted:
                        print(f"   ✅ Deleted using chroma.delete() fallback")
                    else:
                        print(f"   ⚠️  chroma.delete() returned empty")
                except Exception as e2:
                    print(f"   ❌ All deletion methods failed: {e2}")
        
        # Verify deletion
        print("\n🔍 Verifying deletion...")
        new_count = collection.count()
        if new_count == 0:
            print("✅ Verification: Collection is now empty!")
        else:
            print(f"⚠️  Warning: Collection still has {new_count} chunks remaining.")
            print("   You may need to manually delete the chroma directory:")
            print(f"   rm -rf {chroma_path}")
        
        print("\n" + "=" * 60)
        print("Cleanup complete!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        print("\n💡 If deletion failed, you can manually delete the Chroma directory:")
        print(f"   rm -rf {chroma_path}")

if __name__ == "__main__":
    check_and_clear_chroma()

