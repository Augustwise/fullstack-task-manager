# fullstack-task-manager
Simple fullstack task manager. Made as a coursework at university

#  Summary

## Project Description

This is a full-stack web application designed for personal task management. It allows users to register, log in, and perform CRUD (Create, Read, Update, Delete) operations on their tasks. Key features include task descriptions with Markdown support, due dates, priority levels, and file attachments.

**Technology Stack:**

*   **Backend:** Node.js, Express.js
*   **Database:** MongoDB with Mongoose ODM
*   **Frontend:** HTML, CSS, Vanilla JavaScript
*   **Authentication:** JWT (JSON Web Tokens) via httpOnly Cookies
*   **File Handling:** Multer

## CRUD Operations (Tasks API)

All task-related API endpoints require user authentication (valid JWT).

| Operation         | Method   | Endpoint                             | Description                                                                 |
| :---------------- | :------- | :----------------------------------- | :-------------------------------------------------------------------------- |
| Create Task   | `POST`   | `/api/tasks`                         | Adds a new task for the logged-in user. Accepts form data including optional file. |
| Read Tasks    | `GET`    | `/api/tasks`                         | Retrieves all tasks belonging to the logged-in user.                        |
| Update Task   | `PUT`    | `/api/tasks/:taskId`                 | Updates an existing task's details. Accepts form data including optional file replacement. |
| Delete Task   | `DELETE` | `/api/tasks/:taskId`                 | Deletes a specific task and its associated file (if any).                   |
| Toggle Complete| `PATCH`  | `/api/tasks/:taskId/toggle-completed`| Flips the `completed` status of a task.                                     |
| Download File | `GET`    | `/api/tasks/:taskId/file`            | Downloads the file attached to a specific task.                             |
| Get User Info | `GET`    | `/api/user`                          | Retrieves the logged-in user's email (protected endpoint).                  |
| Login         | `POST`   | `/api/login`                         | Authenticates a user and sets the JWT cookie.                               |
| Signup        | `POST`   | `/api/signup`                        | Registers a new user and sets the JWT cookie.                               |
| Logout        | `POST`   | `/api/logout`                        | Clears the JWT cookie.                                                      |
| Auth Check    | `GET`    | `/api/auth-check`                    | Checks if the current user has a valid JWT cookie (used for frontend redirects). |

## Database Schema (Mongoose)

**`User` Collection:**

| Field      | Type     | Constraints            | Description                  |
| :--------- | :------- | :--------------------- | :--------------------------- |
| `email`    | `String` | `Required`, `Unique`   | User's login email address.  |
| `password` | `String` | `Required`             | Hashed user password (`bcrypt`). |

**`Task` Collection:**

| Field         | Type        | Constraints / Default      | Description                                      |
| :------------ | :---------- | :------------------------- | :----------------------------------------------- |
| `userId`      | `ObjectId`  | `Required`, `Ref: 'User'`  | Links task to the owner User document.           |
| `name`        | `String`    | `Required`                 | The title of the task.                           |
| `description` | `String`    | Optional                   | Detailed description, supports Markdown.         |
| `dueDate`     | `Date`      | Optional                   | Task deadline.                                   |
| `createdAt`   | `Date`      | `Default: Date.now`        | Timestamp when the task was created.             |
| `completed`   | `Boolean`   | `Default: false`           | Whether the task is marked as done.              |
| `priority`    | `String`    | `Enum: ['high', 'medium', 'low']`, `Default: 'medium'` | Task priority level. |
| `file`        | `Object`    | Optional                   | Contains details of an attached file.            |
| `file.filename`| `String`    | Optional                   | Randomized filename stored on the server.        |
| `file.originalName`| `String`| Optional                   | The original name of the uploaded file.          |
| `file.mimetype`| `String`    | Optional                   | The MIME type of the uploaded file.              |
| `file.size`   | `Number`    | Optional                   | The size of the uploaded file in bytes.          |

## Frontend Structure

**HTML Pages (`/frontend/`):**

| File             | Purpose                                       | Authentication |
| :--------------- | :-------------------------------------------- | :------------- |
| `index.html`     | Public landing page.                          | Not Required   |
| `login.html`     | User login form.                              | Not Required   |
| `signup.html`    | User registration form.                       | Not Required   |
| `tasks.html`     | Main task management interface.               | Required       |
| `403.html`       | Custom "Forbidden" error page.                | N/A            |
| `404.html`       | Custom "Not Found" error page.                | N/A            |

**JavaScript Files (`/scripts/`):**

| File             | Responsibility                                                            |
| :--------------- | :------------------------------------------------------------------------ |
| `auth-check.js`  | Checks authentication status on page load, handles redirects.             |
| `login.js`       | Handles login form submission, validation, and API interaction.           |
| `signup.js`      | Handles signup form submission, validation (incl. password complexity), API interaction. |
| `tasks.js`       | Manages the tasks page: fetches/displays tasks, handles add/edit/delete modals, API calls, sorting, Markdown rendering (`marked.js`), sanitization (`DOMPurify`), file uploads, logout. |

## Security Measures

| Area                  | Mechanism / Implementation                                                                      |
| :-------------------- | :---------------------------------------------------------------------------------------------- |
| Authentication   | JWTs stored in `httpOnly` cookies (1hr expiry). Prevents direct JS access.                       |
| Password Security | Passwords hashed using `bcrypt` (salt rounds: 10) before database storage.                       |
| Authorization     | Backend middleware (`authenticateToken`) protects task routes. DB queries enforce user ownership (`userId`). |
| Input Validation  | Both client-side (UI feedback) and server-side checks (email format, password rules, required fields). |
| XSS Prevention   | Markdown output sanitized using `DOMPurify` on the frontend before rendering task descriptions.  |
| File Uploads      | `multer` used for server-side validation of file types (`.pdf`, `.docx`, images) and size (max 10MB). Randomized filenames prevent direct access/guessing. Files served via protected route. |
| Path Restriction  | Server middleware blocks direct access to sensitive files/dirs (`.env`, `package.json`, `/backend/`). |
| Environment Vars  | Sensitive config (JWT Secret, DB URI) stored in `.env` file (should be gitignored).           |
