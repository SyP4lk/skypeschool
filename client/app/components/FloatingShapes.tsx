'use client';
import {useMemo} from 'react';
import styles from './FloatingShapes.module.css';
export default function FloatingShapes({count=10, className=''}:{count?:number; className?:string}){
  const items = useMemo(()=>Array.from({length: count}).map((_,i)=>{
    const variant = ['dot','ring','diamond'][i%3];
    const size = 8 + Math.round(Math.random()*18);
    const top = Math.round(Math.random()*100);
    const left = Math.round(Math.random()*100);
    const dur = 8 + Math.random()*10;
    const delay = Math.random()*4;
    const drift = 4 + Math.random()*10;
    return {id:i,variant,size,top,left,dur,delay,drift};
  }),[count]);
  return <div className={`${styles.container} ${className}`} aria-hidden>
    {items.map(it=>(
      <span key={it.id} className={`${styles.shape} ${styles[it.variant]}`}
        style={{top:`${it.top}%`, left:`${it.left}%`, width:`${it.size}px`, height:`${it.size}px`,
        animationDuration: `${it.dur}s, ${it.dur*1.3}s`,
        animationDelay: `${it.delay}s, ${it.delay/2}s`,
        ['--driftX' as any]: `${it.drift}px`}}/>
    ))}
  </div>;
}
