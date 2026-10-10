import React, { useState } from 'react';
import { SiteNav, Button, Badge, TemplateCard, ChipGroup, TextField, Toggle, Toast } from './index.js';
export default function Example() {
  const [occ, setOcc] = useState('Birthday');
  const [mail, setMail] = useState(true);
  return (
    <div>
      <SiteNav />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 28px', display: 'grid', gap: 48 }}>
        <section style={{ display: 'grid', gap: 24, maxWidth: 560 }}>
          <Badge tone="promo">Mother’s Day ships free until May 4</Badge>
          <h1 style={{ fontFamily: 'var(--gh-font-display)', fontWeight: 800, fontSize: 'clamp(44px,5.5vw,72px)', letterSpacing: '-0.045em', lineHeight: .95, margin: 0 }}>
            Cards that sound like <span style={{ color: 'var(--gh-persimmon)' }}>you.</span>
          </h1>
          <div style={{ display: 'flex', gap: 10 }}><Button size="lg">Start a card</Button><Button size="lg" variant="secondary">Make a picture book</Button></div>
        </section>
        <ChipGroup options={['Birthday', 'Thank you', 'Wedding', 'New baby', 'Just because']} value={occ} onChange={setOcc} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 20 }}>
          {['Big Birthday', 'For Nonna', 'Our Summer', 'Thanks, Coach'].map((t, i) => <TemplateCard key={t} title={t} aside="$4.99" tone={i % 2 ? 'marigold' : 'blush'} tilt={i} />)}
        </div>
        <div style={{ display: 'grid', gap: 16, maxWidth: 420 }}>
          <TextField label="Who’s it for?" placeholder="Grandma Rosa" />
          <TextField label="Your message" placeholder="Write it the way you’d say it…" multiline />
          <Toggle checked={mail} onChange={setMail}>Mail it for me</Toggle>
        </div>
        <Toast action="Track">Your card’s on its way to Sam.</Toast>
      </main>
    </div>
  );
}
