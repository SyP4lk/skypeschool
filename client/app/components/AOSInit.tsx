'use client';
import {useEffect} from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

export default function AOSInit() {
  useEffect(() => {
    AOS.init({
      once: true,
      duration: 600,
      offset: 80,
      easing: 'ease-out-cubic',
    });
  }, []);
  return null;
}
