import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
const corsHeaders={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,"Content-Type":"application/json"}});
const MAX_BYTES=25*1024*1024;
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});if(req.method!=="POST")return json({error:"Méthode non autorisée."},405);
 const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),key=Deno.env.get("GEMINI_API_KEY"),configuredVisionModel=Deno.env.get("GEMINI_VISION_MODEL"),model=!configuredVisionModel||configuredVisionModel==="gemini-2.5-flash"?"gemini-3.8-flash":configuredVisionModel;
 if(!url||!anon||!service)return json({error:"Configuration serveur incomplète."},500);if(!key)return json({error:"Le service d’analyse IA n’est pas configuré."},503);
 const authorization=req.headers.get("Authorization");if(!authorization?.startsWith("Bearer "))return json({error:"Session requise."},401);
 const userClient=createClient(url,anon,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:userData,error:userError}=await userClient.auth.getUser();if(userError||!userData.user)return json({error:"Session invalide. Reconnecte-toi."},401);
 let id:string;try{const body=await req.json();id=body?.document_id;if(typeof id!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))return json({error:"Identifiant de document invalide."},400);}catch{return json({error:"Requête invalide."},400);}
 const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:doc,error:docError}=await admin.from("course_documents").select("id,owner_id,title,storage_path,mime_type").eq("id",id).eq("owner_id",userData.user.id).maybeSingle();
 if(docError||!doc)return json({error:"Document introuvable dans ton espace."},404);if(!doc.storage_path||!doc.storage_path.startsWith(userData.user.id+"/"))return json({error:"Accès au fichier refusé."},403);
 const allowed=["application/pdf","image/jpeg","image/png","image/webp"];if(!doc.mime_type||!allowed.includes(doc.mime_type))return json({error:"Format non pris en charge."},415);
 await admin.from("course_documents").update({processing_status:"processing"}).eq("id",id).eq("owner_id",userData.user.id);let geminiFileName:string|null=null;
 try{
  const {data:file,error:downloadError}=await admin.storage.from("student-documents").download(doc.storage_path);if(downloadError||!file)throw new Error("Impossible de récupérer le fichier privé.");if(file.size>MAX_BYTES)throw new Error("Le fichier dépasse la limite de 25 Mo.");
  const start=await fetch("https://generativelanguage.googleapis.com/upload/v1beta/files?key="+encodeURIComponent(key),{method:"POST",headers:{"X-Goog-Upload-Protocol":"resumable","X-Goog-Upload-Command":"start","X-Goog-Upload-Header-Content-Length":String(file.size),"X-Goog-Upload-Header-Content-Type":doc.mime_type,"Content-Type":"application/json"},body:JSON.stringify({file:{display_name:String(doc.title||"Cours").slice(0,120)}})});
  if(!start.ok)throw new Error("Gemini n’a pas accepté la préparation du fichier ("+start.status+") : "+(await start.text()).slice(0,250));const uploadUrl=start.headers.get("x-goog-upload-url");if(!uploadUrl)throw new Error("Gemini n’a pas fourni l’adresse de transfert.");
  const uploaded=await fetch(uploadUrl,{method:"POST",headers:{"Content-Length":String(file.size),"X-Goog-Upload-Offset":"0","X-Goog-Upload-Command":"upload, finalize"},body:new Uint8Array(await file.arrayBuffer())});if(!uploaded.ok)throw new Error("Le transfert vers Gemini a échoué ("+uploaded.status+") : "+(await uploaded.text()).slice(0,250));
  const uploadedData=await uploaded.json(),geminiFile=uploadedData.file;if(!geminiFile?.uri||!geminiFile?.name)throw new Error("Gemini n’a pas confirmé la réception du fichier.");geminiFileName=geminiFile.name;
  let state=geminiFile.state||"PROCESSING";for(let attempt=0;state==="PROCESSING"&&attempt<24;attempt++){await new Promise(resolve=>setTimeout(resolve,1000));const s=await fetch("https://generativelanguage.googleapis.com/v1beta/"+geminiFileName+"?key="+encodeURIComponent(key));if(!s.ok)throw new Error("Impossible de vérifier le traitement Gemini ("+s.status+").");const sd=await s.json();state=sd.state||sd.file?.state||state;}
  if(state!=="ACTIVE")throw new Error(state==="FAILED"?"Gemini n’a pas réussi à préparer le document.":"Le document met trop de temps à être préparé. Relance l’extraction dans quelques instants.");
  const prompt="Effectue une extraction OCR complète et fidèle de ce document scolaire. Lis visuellement chaque page, y compris les pages scannées ou photographiées. Transcris tout le texte lisible : titres, paragraphes, consignes, listes, tableaux, légendes, numéros, formules et annotations manuscrites si elles sont lisibles. Respecte l’ordre des pages et la structure du document. N’invente aucun mot. Marque les passages impossibles à lire par [illisible]. Réponds uniquement avec le texte extrait, sans résumé ni commentaire.";
  const requestBody=JSON.stringify({contents:[{role:"user",parts:[{text:prompt},{file_data:{mime_type:doc.mime_type,file_uri:geminiFile.uri}}]}],generationConfig:{maxOutputTokens:12000}});
  const retryable=(status:number)=>status===408||status===429||status===500||status===502||status===503||status===504;
  const callModel=async(modelName:string,maxAttempts:number)=>{
   let lastStatus=0,lastBody="";
   for(let attempt=0;attempt<maxAttempts;attempt++){
    const response=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(modelName)+":generateContent?key="+encodeURIComponent(key),{method:"POST",headers:{"Content-Type":"application/json"},body:requestBody});
    if(response.ok)return await response.json();
    lastStatus=response.status;lastBody=(await response.text()).slice(0,350);
    if(!retryable(response.status)||attempt===maxAttempts-1)break;
    await new Promise(resolve=>setTimeout(resolve,1200*Math.pow(2,attempt)));
   }
   throw Object.assign(new Error("Gemini "+modelName+" ("+lastStatus+") : "+lastBody),{status:lastStatus});
  };
  let result:any;
  try{result=await callModel(model,3);}
  catch(primaryError){
   const status=(primaryError as {status?:number})?.status??0;
   const fallbackModel=Deno.env.get("GEMINI_VISION_FALLBACK_MODEL")||"gemini-3.7-flash";
   if((status===404||retryable(status))&&fallbackModel!==model){
    console.warn("Primary Gemini model unavailable; trying fallback", {model,fallbackModel,status});
    result=await callModel(fallbackModel,2);
   }else throw primaryError;
  }
  const extracted=(result.candidates?.[0]?.content?.parts??[]).map((part:any)=>part.text??"").join("").trim();if(!extracted)throw new Error("Aucune information lisible n’a été extraite. Essaie avec un scan plus net ou un fichier moins volumineux.");
  const {error:updateError}=await admin.from("course_documents").update({extracted_text:extracted,processing_status:"processed"}).eq("id",id).eq("owner_id",userData.user.id);if(updateError)throw new Error("Le texte a été extrait, mais n’a pas pu être enregistré.");return json({success:true,document_id:id,processing_status:"processed",characters_extracted:extracted.length});
 }catch(error){const technicalMessage=error instanceof Error?error.message:"Erreur inattendue pendant l’analyse.";console.error("process-course-document failed",{document_id:id,message:technicalMessage});await admin.from("course_documents").update({processing_status:"failed"}).eq("id",id).eq("owner_id",userData.user.id);const publicMessage="Nous n’avons pas pu analyser ce document. Ton fichier est bien conservé. Tu peux réessayer depuis Ma bibliothèque, sans le réimporter.";return json({error:publicMessage,code:"DOCUMENT_ANALYSIS_FAILED",document_id:id,retryable:true},502);}
 finally{if(geminiFileName){try{await fetch("https://generativelanguage.googleapis.com/v1beta/"+geminiFileName+"?key="+encodeURIComponent(key),{method:"DELETE"});}catch{}}}
});