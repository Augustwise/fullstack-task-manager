import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/style.css';

export default function NotFound() {
  return (
    <div className="home-page">
      <main className="container">
        <section>
          <h2>Page Not Found</h2>
          <p>The page you are looking for doesn’t exist.</p>
          <div className="button-group">
            <Link to="/">
              <button type="button">Return Home</button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
