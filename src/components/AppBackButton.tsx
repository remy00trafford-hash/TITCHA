'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
const HIDE=['/','/connexion','/inscription'];
export default function AppBackButton(){
 const pathname=usePathname();const router=useRouter();
 useEffect(()=>{const key='titcha-scroll-positions';const save=()=>{try{const data=JSON.parse(sessionStorage.getItem(key)||'{}');data[location.pathname+location.search]=scrollY;sessionStorage.setItem(key,JSON.stringify(data));}catch{}};const restore=()=>{try{const data=JSON.parse(sessionStorage.getItem(key)||'{}');const top=data[location.pathname+location.search]??0;requestAnimationFrame(()=>scrollTo({top,behavior:'instant'}));}catch{}};addEventListener('scroll',save,{passive:true});addEventListener('popstate',restore);return()=>{removeEventListener('scroll',save);removeEventListener('popstate',restore)};},[]);
 if(HIDE.includes(pathname))return null;
 function goBack(){const sameOrigin=(()=>{try{return !!document.referrer&&new URL(document.referrer).origin===location.origin}catch{return false}})();if(history.length>1&&sameOrigin)router.back();else router.push('/tableau-de-bord');}
 return <button type="button" className="app-back-button" onClick={goBack} aria-label="Revenir à la page précédente"><ArrowLeft size={19}/><span>Retour</span></button>;
}