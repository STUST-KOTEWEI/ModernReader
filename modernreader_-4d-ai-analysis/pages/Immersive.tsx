import React, { useState } from 'react';
import ImmersiveReader from '../components/ImmersiveReader';

export default function Immersive() {
  const [text, setText] = useState('');
  return (
    <div className="w-full h-screen">
      <ImmersiveReader content={text} onContentChange={setText} />
    </div>
  );
}
