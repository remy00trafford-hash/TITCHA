'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type CourseDocument = {
  id: string;
  title: string;
  mime_type: string | null;
  processing_status: string;
  extracted_text: string | null;
  created_at: string;
};

const MAX_SIZE = 15 * 1024 * 1024;
const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

export default function DocumentsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<CourseDocument[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      setMessage('Connecte-toi pour accéder à tes documents.');
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('course_documents')
      .select('id,title,mime_type,processing_status,extracted_text,created_at')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    if (error) setMessage(error.message);
    else setDocuments((data ?? []) as CourseDocument[]);
    setLoading(false);
  }, []);

  useEffect(() => { void loadDocuments(); }, [loadDocuments]);

  async function upload() {
    if (!file) return;
    setBusy(true);
    setMessage('');
    const supabase = createClient();
    let storagePath: string | null = null;
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Ta session a expiré. Reconnecte-toi.');
      if (!ALLOWED.includes(file.type)) throw new Error('Format accepté : PDF, JPG, PNG ou WEBP.');
      if (file.size > MAX_SIZE) throw new Error('Le fichier dépasse la limite de 15 Mo pour le traitement IA.');
      const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
      storagePath = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error: storageError } = await supabase.storage
        .from('student-documents')
        .upload(storagePath, file, { contentType: file.type, upsert: false });
      if (storageError) throw storageError;

      const { data: document, error: insertError } = await supabase
        .from('course_documents')
        .insert({
          owner_id: user.id,
          title: file.name.replace(/\.[^.]+$/, ''),
          storage_path: storagePath,
          mime_type: file.type,
          file_size_bytes: file.size,
          processing_status: 'uploaded',
        })
        .select('id')
        .single();
      if (insertError) throw insertError;

      setMessage('Document enregistré. Extraction du texte par Gemini en cours…');
      const { data: ocr, error: ocrError } = await supabase.functions.invoke('process-course-document', {
        body: { document_id: document.id },
      });
      if (ocrError) {
        setMessage(`Document enregistré, mais l’OCR a échoué : ${ocrError.message}. Tu peux relancer depuis la liste.`);
      } else if (ocr?.error) {
        setMessage(`Document enregistré, mais l’OCR a échoué : ${ocr.error}`);
      } else {
        setMessage(`Document traité : ${ocr?.characters_extracted ?? 0} caractères extraits.`);
      }
      setFile(null);
      await loadDocuments();
    } catch (error) {
      if (storagePath) {
        await supabase.storage.from('student-documents').remove([storagePath]);
      }
      setMessage(error instanceof Error ? error.message : 'Import impossible.');
    } finally {
      setBusy(false);
    }
  }

  async function retryOcr(id: string) {
    setBusy(true);
    setMessage('');
    try {
      const { data, error } = await createClient().functions.invoke('process-course-document', { body: { document_id: id } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessage('Extraction terminée.');
      await loadDocuments();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nouvel essai impossible.');
      await loadDocuments();
    } finally { setBusy(false); }
  }

  return (
    <main className="wrap">
      <Link className="brand" href="/tableau-de-bord">TITCHA.</Link>
      <h1>Mes documents</h1>
      <p className="muted">Importe un cours en PDF ou en photo. Gemini extrait son contenu pour le Prof IA et les révisions.</p>
      <section className="card">
        <h2>Ajouter un cours</h2>
        <input className="field" type="file" accept=".pdf,image/jpeg,image/png,image/webp" onChange={event => setFile(event.target.files?.[0] ?? null)} />
        {file && <p className="muted">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} Mo</p>}
        <button className="btn" disabled={!file || busy} onClick={upload}>{busy ? 'Traitement…' : 'Importer et analyser'}</button>
        <p className="muted">PDF, JPG, PNG, WEBP · 15 Mo maximum. Tes documents restent dans ton espace privé.</p>
        {message && <p className="notice" role="status">{message}</p>}
      </section>
      <h2>Bibliothèque de cours</h2>
      {loading ? <p className="muted">Chargement…</p> : documents.length === 0 ? (
        <section className="card"><p className="muted">Aucun document pour le moment. Importe ton premier cours pour activer le Prof IA.</p></section>
      ) : documents.map(document => (
        <section className="card" key={document.id}>
          <div className="row-between">
            <div><h3>{document.title}</h3><p className="muted">{new Date(document.created_at).toLocaleDateString('fr-FR')} · {document.mime_type ?? 'Fichier'}</p></div>
            <strong>{document.processing_status === 'processed' ? '✅ Traité' : document.processing_status === 'processing' ? '⏳ En cours' : document.processing_status === 'failed' ? '⚠️ Échec' : '📥 Importé'}</strong>
          </div>
          <div className="nav">
            {document.processing_status !== 'processed' && <button className="btn alt" disabled={busy} onClick={() => retryOcr(document.id)}>Relancer l’extraction</button>}
            {document.extracted_text && <button className="btn alt" onClick={() => setExpanded(expanded === document.id ? null : document.id)}>{expanded === document.id ? 'Masquer le texte' : 'Voir le texte extrait'}</button>}
            <Link className="btn alt" href={`/prof-ia?document=${document.id}`}>Travailler avec le Prof IA</Link>
          </div>
          {expanded === document.id && <pre className="extracted-text">{document.extracted_text}</pre>}
        </section>
      ))}
    </main>
  );
}
