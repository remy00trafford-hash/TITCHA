'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {createClient} from '@/lib/supabase/client';
import {GitBranch,RefreshCw,ArrowDown,ChevronRight} from 'lucide-react';

type Course={id:string;title:string;school_class_id:number|null;subject_id:number|null;school_classes?:{label:string}|null;subjects?:{name:string}|null};
type DiagramNode={id:string;label:string;detail?:string};
type DiagramEdge={from:string;to:string;label?:string};
type Diagram={title:string;description?:string;diagram_type:string;nodes:DiagramNode[];edges:DiagramEdge[];legend?:string[]};

function parseDiagram(raw:string):Diagram{
 const cleaned=raw.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
 const value=JSON.parse(cleaned);
 if(!value||!Array.isArray(value.nodes)||value.nodes.length<2||value.nodes.length>12)throw new Error('Le schéma reçu est incomplet. Relance la génération.');
 value.edges=Array.isArray(value.edges)?value.edges:[];value.legend=Array.isArray(value.legend)?value.legend:[];return value as Diagram;
}
export default function SchemasPage(){
 const [courses,setCourses]=useState<Course[]>([]);
 const [selected,setSelected]=useState('');
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [diagram,setDiagram]=useState<Diagram|null>(null);
 useEffect(()=>{let active=true;(async()=>{const sb=createClient();const {data:{user}}=await sb.auth.getUser();if(!user){if(active){setError('Reconnecte-toi pour accéder à tes cours.');setLoading(false);}return;}
 const {data,error}=await sb.from('course_documents').select('id,title,school_class_id,subject_id,school_classes(label),subjects(name)').eq('owner_id',user.id).eq('processing_status','processed').order('created_at',{ascending:false});
 if(!active)return;if(error)setError('Impossible de charger tes cours.');const rows=(data??[]) as unknown as Course[];setCourses(rows);setSelected(rows[0]?.id??'');setLoading(false);})();return()=>{active=false}},[]);
 async function generate(){if(!selected)return;setBusy(true);setError('');setDiagram(null);try{const {data,error}=await createClient().functions.invoke('titcha-ai',{body:{document_id:selected,task:'generate_diagram'}});if(error)throw error;if(data?.error)throw new Error(data.error);if(!data?.output)throw new Error('Aucun schéma n’a été retourné.');setDiagram(parseDiagram(data.output));}catch(e){setError(e instanceof Error?e.message:'La génération du schéma a échoué.');}finally{setBusy(false)}}
 const course=courses.find(item=>item.id===selected);
 return <main className="wrap schemas-page">
  <header className="schemas-heading"><div><span className="welcome-eyebrow">COMPRENDRE VISUELLEMENT</span><h1>Schémas pédagogiques</h1><p className="muted">Transforme les notions de tes cours en représentations visuelles structurées, adaptées à ta classe et à ta matière.</p></div><Link className="btn alt" href="/tableau-de-bord">Mon espace</Link></header>
  <section className="schemas-control"><div className="schemas-control-title"><span><GitBranch size={20}/></span><div><b>Créer un schéma à partir d’un cours</b><p>Le schéma s’appuie sur le document sélectionné et son contexte scolaire.</p></div></div>
   {loading?<p className="muted">Chargement des cours…</p>:courses.length===0?<div className="schemas-empty"><p>Aucun cours analysé pour le moment.</p><Link className="btn" href="/documents">Importer un cours →</Link></div>:<><label className="schemas-course-label" htmlFor="schema-course">Cours à représenter</label><select id="schema-course" className="field" value={selected} onChange={e=>setSelected(e.target.value)}>{courses.map(item=><option key={item.id} value={item.id}>{item.title} · {item.school_classes?.label??'Classe non précisée'} · {item.subjects?.name??'Matière non précisée'}</option>)}</select><div className="schemas-context"><span>{course?.school_classes?.label??'Classe'}</span><span>{course?.subjects?.name??'Matière'}</span><span>Programme béninois</span></div><button className="btn" onClick={generate} disabled={busy||!selected}>{busy?<><RefreshCw size={15} className="spin"/> Création du schéma…</>:<><GitBranch size={16}/> Générer le schéma pédagogique</>}</button></>}
   {error&&<p className="schemas-error" role="status">{error}</p>}
  </section>
  {diagram&&<section className="diagram-result"><div className="diagram-result-heading"><div><span className="welcome-eyebrow">REPRÉSENTATION PÉDAGOGIQUE</span><h2>{diagram.title}</h2><p>{diagram.description}</p></div><button className="btn alt" onClick={()=>void generate()} disabled={busy}><RefreshCw size={14}/> Refaire</button></div>
   <div className={'diagram-flow diagram-'+diagram.diagram_type}>{diagram.nodes.map((node,index)=><div className="diagram-step-wrap" key={node.id}><article className="diagram-node"><span className="diagram-node-number">{String(index+1).padStart(2,'0')}</span><h3>{node.label}</h3>{node.detail&&<p>{node.detail}</p>}</article>{index<diagram.nodes.length-1&&<div className="diagram-connector"><ArrowDown size={18}/>{diagram.edges.find(edge=>edge.from===node.id&&edge.to===diagram.nodes[index+1].id)?.label&&<small>{diagram.edges.find(edge=>edge.from===node.id&&edge.to===diagram.nodes[index+1].id)?.label}</small>}</div>}</div>)}</div>
   {diagram.legend&&diagram.legend.length>0&&<div className="diagram-legend"><b>À retenir</b><ul>{diagram.legend.map((item,index)=><li key={index}>{item}</li>)}</ul></div>}
   <p className="diagram-note">Schéma construit à partir du cours sélectionné. Vérifie les relations et les légendes avec ton support de classe.</p>
  </section>}
  <div className="schemas-back"><Link href="/prof-ia">Retour au professeur IA <ChevronRight size={14}/></Link><Link href="/documents">Ma bibliothèque <ChevronRight size={14}/></Link></div>
 </main>;
}
