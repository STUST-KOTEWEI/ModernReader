import React from 'react';
import ReactDOM from 'react-dom/client';

const TestApp = () => {
  return (
    <div style={{
      position: 'relative',
      zIndex: 1,
      padding: '2rem',
      color: '#fff',
      minHeight: '100vh'
    }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        ModernReader Test
      </h1>
      <p>If you can see this, React is working! ✅</p>
      <button 
        onClick={() => alert('Button clicked!')}
        style={{
          padding: '12px 24px',
          background: '#00c6ff',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: 'pointer',
          marginTop: '1rem'
        }}
      >
        Click me to test
      </button>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("❌ Root element not found!");
  throw new Error("Could not find root element to mount to");
}

console.log("✅ Root element found, mounting React...");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>
);

console.log("✅ React mounted successfully!");
