const handleNavigate = (path) => {
  window.location.href = path;
};

const App = () => (
  <>
    <header className="header">
      <div className="container">
        <h1 className="logo">Task Manager</h1>
        <p className="tagline">Your Personal Productivity Partner</p>
        <div className="button-group">
          <button type="button" onClick={() => handleNavigate("/frontend/login.html")}>Login</button>
          <button type="button" onClick={() => handleNavigate("/frontend/signup.html")}>Sign Up</button>
        </div>
      </div>
    </header>

    <main className="container">
      <section className="about-section">
        <h2>About This Project</h2>
        <p>
          This Task Manager is a powerful tool designed to help you organize your life, track your
          responsibilities, and boost your productivity. Whether you&apos;re managing personal errands,
          academic deadlines, or professional projects, our application provides the features you need to stay on top of
          everything.
        </p>
        <p>
          Our goal is to offer a clean, intuitive, and efficient user experience, allowing you to focus on what
          truly matters: getting things done.
        </p>
      </section>

      <section className="features-section">
        <h2>Key Features</h2>
        <div className="features-grid">
          <div className="feature-item">
            <h3>Task Creation</h3>
            <p>Easily create tasks with titles, detailed descriptions, and due dates.</p>
          </div>
          <div className="feature-item">
            <h3>Priority Levels</h3>
            <p>
              Assign priorities (
              <span className="priority-high">High</span>,
              <span className="priority-medium"> Medium</span>,
              <span className="priority-low"> Low</span>
              ) to focus on what&apos;s most important.
            </p>
          </div>
          <div className="feature-item">
            <h3>File attachments</h3>
            <p>Attach files to your tasks to keep all relevant information in one place.</p>
          </div>
          <div className="feature-item">
            <h3>Secure Authentication</h3>
            <p>Your data is protected with a secure login and registration system.</p>
          </div>
          <div className="feature-item">
            <h3>Sorting and Filtering</h3>
            <p>Quickly find tasks by sorting them by due date, priority, or creation date.</p>
          </div>
        </div>
      </section>

      <section className="call-to-action">
        <h2>Ready to Get Started?</h2>
        <p>Sign up for a free account today and take the first step towards a more organized life.</p>
        <div className="button-group">
          <button type="button" onClick={() => handleNavigate("/frontend/signup.html")}>Sign Up Now</button>
        </div>
      </section>
    </main>
  </>
);

export default App;
