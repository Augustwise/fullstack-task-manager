import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/style.css';

export default function Forbidden() {
  return (
    <div className="home-page">
      <main className="container">
        <section>
          <h2>Access Forbidden</h2>
          <p>You don’t have permission to access this resource.</p>
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
