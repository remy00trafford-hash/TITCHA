'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type CourseDocument = { id: string; title: string; mime_type: string | null; processing_status: string; extracted_text: string | null; created_at: string; };
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
    if (authError || !user) { setMessage('Connecte-toi pour accéder à tes documents.'); setLoading(false); return; }
    const { data, error } = await supabase.from('course_documents').select('id,title,mime_type,processing_status,extracted_text,created_at').eq('owner_id', user.id).order('created_at', { ascending: false });
    if (error) setMessage('Impossible de charger tes cours. Réessaie dans un instant.');
    else setDocuments((data ?? []) as CourseDocument[]);
    setLoading(false);
  }, []);

  useEffect(() => { void loadDocuments(); }, [loadDocuments]);

  async function upload() {
    if (!file) return;
    setBusy(true); setMessage('Envoi sécurisé du document…');
    const supabase = createClient();
    let storagePath: string | null = null;
    let documentId: string | null = null;
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Ta session a expiré. Reconnecte-toi.');
      if (!ALLOWED.includes(file.type)) throw new Error('Format accepté : PDF, JPG, PNG ou WEBP.');
      if (file.size > MAX_SIZE) throw new Error('Le fichier dépasse la limite de 15 Mo pour le traitement IA.');
      const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
      storagePath = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error: storageError } = await supabase.storage.from('student-documents').upload(storagePath, file, { contentType: file.type, upsert: false });
      if (storageError) throw storageError;
      const { data: document, error: insertError } = await supabase.from('course_documents').insert({
        owner_id: user.id, title: file.name.replace(/\.[^.]+$/, ''), storage_path: storagePath, mime_type: file.type, file_size_bytes: file.size, processing_status: 'uploaded',
      }).select('id').single();
      if (insertError) throw insertError;
      documentId = document.id;
      setMessage('Document enregistré. Préparation de l’extraction…');
      const { data: ocr, error: ocrError } = await supabase.functions.invoke('process-course-document', { body: { document_id: document.id } });
      if (ocrError) {
        setMessage(`Document enregistré, mais l’extraction n’a pas abouti. Détail : ${ocrError.message}. Tu peux relancer sans importer le fichier à nouveau.`);
      } else if (ocr?.error) {
        setMessage(`Document enregistré, mais l’extraction a échoué : ${ocr.error}`);
      } else {
        setMessage(`Cours prêt ! ${ocr?.characters_extracted ?? 0} caractères extraits. Tu peux maintenant l’utiliser avec le Professeur IA et les quiz.`);
      }
      setFile(null);
      await loadDocuments();
    } catch (error) {
      if (storagePath && !documentId) await supabase.storage.from('student-documents').remove([storagePath]);
      setMessage(error instanceof Error ? error.message : 'Import impossible. Réessaie.');
    } finally { setBusy(false); }
  }

  async function retryOcr(id: string) {
    setBusy(true); setMessage('Nouvel essai d’extraction en cours…');
    try {
      const { data, error } = await createClient().functions.invoke('process-course-document', { body: { document_id: id } });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setMessage(`Extraction réussie : ${data?.characters_extracted ?? 0} caractères.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nouvel essai impossible.');
    } finally { await loadDocuments(); setBusy(false); }
  }

  return <main className="wrap documents-page">
    <div className="documents-heading"><div><span className="welcome-eyebrow">TA BIBLIOTHÈQUE PERSONNELLE</span><h1>Mes cours & documents</h1><p className="muted">Ajoute un cours pour le retrouver, lui poser des questions et créer des quiz.</p></div><Link className="btn alt" href="/prof-ia">Ouvrir le Prof IA →</Link></div>
    <section className="upload-panel">
      <div className="upload-panel-intro"><span className="upload-illustration">📄</span><div><h2>Importer un nouveau cours</h2><p>Dépose ton document ou sélectionne-le depuis ton appareil. TITCHA en extrait le texte pour préparer tes révisions.</p></div></div>
      <label className="upload-dropzone" htmlFor="course-file"><span className="upload-cloud">↑</span><b>{file ? file.name : 'Choisir un fichier à importer'}</b><span>{file ? `${(file.size / 1024 / 1024).toFixed(2)} Mo · Prêt à envoyer` : 'Clique ici pour parcourir tes fichiers ou dépose ton PDF / image'}</span><small>PDF, JPG, PNG ou WEBP · 15 Mo maximum</small><input id="course-file" type="file" accept=".pdf,image/jpeg,image/png,image/webp" onChange={event => setFile(event.target.files?.[0] ?? null)} /></label>
      <div className="upload-actions"><p>🔒 Tes documents restent privés et liés à ton compte.</p><button className="btn" disabled={!file || busy} onClick={upload}>{busy ? 'Import et analyse…' : 'Importer et analyser le cours →'}</button></div>
      {message && <p className="upload-message" role="status">{message}</p>}
    </section>
    <div className="documents-list-heading"><h2>Ma bibliothèque</h2><span>{documents.length} document(s)</span></div>
    {loading ? <p className="muted">Chargement de ta bibliothèque…</p> : documents.length === 0 ? <section className="empty-documents"><span>📚</span><h3>Ta bibliothèque est encore vide</h3><p>Importe ton premier cours pour activer les explications et les quiz personnalisés.</p></section> : documents.map(doc => <article className="document-row" key={doc.id}>
      <span className="document-file-icon">📄</span><div className="document-details"><b>{doc.title}</b><small>{new Date(doc.created_at).toLocaleDateString('fr-FR')} · {doc.mime_type ?? 'Document'}</small></div>
      <span className={`document-status status-${doc.processing_status}`}>{doc.processing_status === 'processed' ? '✓ Prêt' : doc.processing_status === 'processing' ? 'En cours' : doc.processing_status === 'failed' ? 'À relancer' : 'Importé'}</span>
      <div className="document-actions">{doc.processing_status !== 'processed' && <button className="btn alt" disabled={busy} onClick={() => retryOcr(doc.id)}>Relancer</button>}{doc.extracted_text && <button className="btn alt" onClick={() => setExpanded(expanded === doc.id ? null : doc.id)}>{expanded === doc.id ? 'Masquer' : 'Voir le texte'}</button>}<Link className="btn alt" href={`/prof-ia?document=${doc.id}`}>Utiliser le cours →</Link></div>
      {expanded === doc.id && <pre className="extracted-text document-extract">{doc.extracted_text}</pre>}
    </article>)}
  </main>;
}
