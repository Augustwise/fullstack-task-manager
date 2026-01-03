import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { checkAuth, fetchJson } from '../utils/api.js';
import '../styles/tasks.css';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const PRIORITY_LABELS = {
  high: 'High Priority',
  medium: 'Medium Priority',
  low: 'Low Priority'
};

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function formatDateTime(value) {
  const date = new Date(value);
  return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()} ${String(
    date.getHours()
  ).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatDate(value) {
  if (!value) {
    return 'Not specified';
  }
  const date = new Date(value);
  return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
}

function getTimeLeftLabel(value) {
  if (!value) {
    return null;
  }
  const dueDate = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDateLocal = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  const diffTime = dueDateLocal.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `(Overdue by ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'day' : 'days'})`, isOverdue: true };
  }
  if (diffDays === 0) {
    return { text: '(Today)', isOverdue: false };
  }
  if (diffDays === 1) {
    return { text: '1 day left', isOverdue: false };
  }
  return { text: `${diffDays} days left`, isOverdue: false };
}

function formatCurrentDate() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return `Today is ${daysEn[now.getDay()]}, ${day}.${month}.${year}`;
}

function validateDueDate(value) {
  if (!value) {
    return { valid: true, message: '' };
  }
  const [year, month, day] = value.split('-').map(Number);
  const selectedDate = new Date(year, month - 1, day);
  selectedDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date('2028-12-31');
  maxDate.setHours(0, 0, 0, 0);

  if (selectedDate > maxDate) {
    return { valid: false, message: 'Date cannot be later than 12/31/2028.' };
  }

  if (selectedDate < today) {
    return { valid: false, message: 'Date cannot be in the past.' };
  }

  return { valid: true, message: '' };
}

function validateFile(file) {
  if (!file) {
    return { valid: true, message: '' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, message: 'File size exceeds 10MB.' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, message: 'Only PDF, DOCX, and image files are allowed.' };
  }

  return { valid: true, message: '' };
}

export default function TasksPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  const [userEmail, setUserEmail] = useState('');
  const [tasks, setTasks] = useState([]);
  const [sortOption, setSortOption] = useState('createdAt');
  const [currentDate, setCurrentDate] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [titleError, setTitleError] = useState('');
  const [dateError, setDateError] = useState('');
  const [fileError, setFileError] = useState('');

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState('medium');
  const [editFile, setEditFile] = useState(null);
  const [editFileName, setEditFileName] = useState('');
  const [editTitleError, setEditTitleError] = useState('');
  const [editDateError, setEditDateError] = useState('');
  const [editFileError, setEditFileError] = useState('');

  useEffect(() => {
    let isActive = true;
    checkAuth()
      .then((data) => {
        if (!isActive) {
          return;
        }
        if (!data.isAuthenticated) {
          navigate('/', { replace: true });
          return;
        }
        if (data.email) {
          setUserEmail(data.email);
        }
      })
      .catch(() => {
        if (isActive) {
          navigate('/', { replace: true });
        }
      });

    return () => {
      isActive = false;
    };
  }, [navigate]);

  useEffect(() => {
    setCurrentDate(formatCurrentDate());
  }, []);

  useEffect(() => {
    fetchJson('/api/user')
      .then((data) => setUserEmail(data.email || ''))
      .catch(() => {
        navigate('/login', { replace: true });
      });
  }, [navigate]);

  useEffect(() => {
    fetchJson('/api/tasks')
      .then((data) => setTasks(data))
      .catch((error) => {
        if (error.status === 401 || error.status === 403) {
          navigate('/login', { replace: true });
        }
      });
  }, [navigate]);

  const sortedTasks = useMemo(() => {
    const items = [...tasks];
    items.sort((a, b) => {
      const completedA = Boolean(a.completed);
      const completedB = Boolean(b.completed);

      if (completedA && !completedB) return 1;
      if (!completedA && completedB) return -1;

      if (sortOption === 'priority') {
        const pa = PRIORITY_ORDER[a.priority || 'medium'] ?? 1;
        const pb = PRIORITY_ORDER[b.priority || 'medium'] ?? 1;
        if (pa !== pb) return pa - pb;
        return new Date(b.createdAt) - new Date(a.createdAt);
      }

      if (sortOption === 'dueDate') {
        const dateA = a.dueDate ? new Date(a.dueDate) : null;
        const dateB = b.dueDate ? new Date(b.dueDate) : null;
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA - dateB;
      }

      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return items;
  }, [tasks, sortOption]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    const validation = validateFile(selectedFile);
    if (!validation.valid) {
      setFileError(validation.message);
      setFile(null);
      setFileName('');
      return;
    }
    setFileError('');
    setFile(selectedFile);
    setFileName(selectedFile ? selectedFile.name : '');
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority('medium');
    setFile(null);
    setFileName('');
    setTitleError('');
    setDateError('');
    setFileError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddTask = async () => {
    let valid = true;

    if (!title.trim()) {
      setTitleError('Title cannot be empty');
      valid = false;
    } else {
      setTitleError('');
    }

    const dateValidation = validateDueDate(dueDate);
    if (!dateValidation.valid) {
      setDateError(dateValidation.message);
      valid = false;
    } else {
      setDateError('');
    }

    const fileValidation = validateFile(file);
    if (!fileValidation.valid) {
      setFileError(fileValidation.message);
      valid = false;
    } else {
      setFileError('');
    }

    if (!valid) {
      return;
    }

    const formData = new FormData();
    formData.append('name', title.trim());
    formData.append('description', description.trim());
    formData.append('priority', priority);
    if (dueDate) {
      formData.append('dueDate', dueDate);
    }
    if (file) {
      formData.append('taskFile', file);
    }

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        let message = 'Something went wrong. Try again.';
        try {
          const errorData = await response.json();
          message = errorData.message || message;
        } catch (error) {
          message = `HTTP error ${response.status}. Something went wrong.`;
        }
        throw new Error(message);
      }

      const newTask = await response.json();
      setTasks((prev) => [...prev, newTask]);
      resetForm();
    } catch (error) {
      alert(error.message || 'Error adding task. Check network connection.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetchJson('/api/logout', { method: 'POST' });
      navigate('/');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleToggleCompleted = async (task) => {
    try {
      const updatedTask = await fetchJson(`/api/tasks/${task._id}/toggle-completed`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      setTasks((prev) => prev.map((item) => (item._id === updatedTask._id ? updatedTask : item)));
    } catch (error) {
      alert('Error updating task status');
    }
  };

  const handleDeleteTask = async (task) => {
    if (!confirm(`Are you sure you want to delete the task "${task.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${task._id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        let message = 'Failed to delete task. Please try again.';
        try {
          const errorData = await response.json();
          message = errorData.message || message;
        } catch (error) {
          message = `HTTP error ${response.status}. Something went wrong.`;
        }
        throw new Error(message);
      }

      setTasks((prev) => prev.filter((item) => item._id !== task._id));
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const openEditModal = (task) => {
    setEditTask(task);
    setEditTitle(task.name);
    setEditDescription(task.description || '');
    setEditPriority(task.priority || 'medium');
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const year = dueDate.getFullYear();
      const month = String(dueDate.getMonth() + 1).padStart(2, '0');
      const day = String(dueDate.getDate()).padStart(2, '0');
      setEditDueDate(`${year}-${month}-${day}`);
    } else {
      setEditDueDate('');
    }
    setEditFile(null);
    setEditFileName('');
    setEditTitleError('');
    setEditDateError('');
    setEditFileError('');
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
  };

  const handleEditFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    const validation = validateFile(selectedFile);
    if (!validation.valid) {
      setEditFileError(validation.message);
      setEditFile(null);
      setEditFileName('');
      return;
    }
    setEditFileError('');
    setEditFile(selectedFile);
    setEditFileName(selectedFile ? selectedFile.name : '');
  };

  const handleSaveEdit = async () => {
    let valid = true;
    if (!editTitle.trim()) {
      setEditTitleError('Title cannot be empty');
      valid = false;
    } else {
      setEditTitleError('');
    }

    const dateValidation = validateDueDate(editDueDate);
    if (!dateValidation.valid) {
      setEditDateError(dateValidation.message);
      valid = false;
    } else {
      setEditDateError('');
    }

    const fileValidation = validateFile(editFile);
    if (!fileValidation.valid) {
      setEditFileError(fileValidation.message);
      valid = false;
    } else {
      setEditFileError('');
    }

    if (!valid || !editTask) {
      return;
    }

    const formData = new FormData();
    formData.append('name', editTitle.trim());
    formData.append('description', editDescription.trim());
    formData.append('priority', editPriority);
    if (editDueDate) {
      formData.append('dueDate', editDueDate);
    }
    if (editFile) {
      formData.append('taskFile', editFile);
    }

    try {
      const response = await fetch(`/api/tasks/${editTask._id}`, {
        method: 'PUT',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        let message = 'Something went wrong updating task.';
        try {
          const errorData = await response.json();
          message = errorData.message || message;
        } catch (error) {
          message = `HTTP error ${response.status}. Failed to update task.`;
        }
        throw new Error(message);
      }

      const updatedTask = await response.json();
      setTasks((prev) => prev.map((item) => (item._id === updatedTask._id ? updatedTask : item)));
      closeEditModal();
    } catch (error) {
      alert(error.message || 'Error updating task. Check network connection.');
    }
  };

  const minDate = useMemo(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    marked.setOptions({
      breaks: true,
      gfm: true,
      sanitize: false
    });
  }, []);

  return (
    <div className="page-tasks">
      <div className="user-info">
        <span id="userEmail">{userEmail ? `Logged in as ${userEmail}` : ''}</span>
        <button id="logoutBtn" type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div id="currentDate" style={{ position: 'absolute', top: '20px', left: '20px', color: '#333', fontSize: '1rem' }}>
        {currentDate}
      </div>

      <div className="container">
        <h1>Task Manager</h1>
        <form id="taskForm" onSubmit={(event) => event.preventDefault()}>
          <div className="form-group">
            <label htmlFor="taskTitle">Title</label>
            <input
              type="text"
              id="taskTitle"
              name="taskTitle"
              placeholder="Enter a short task title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={titleError ? 'error' : ''}
              required
            />
            <div className="error-message" id="titleError" style={{ display: titleError ? 'block' : 'none' }}>
              {titleError}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="taskDescription">Description</label>
            <textarea
              id="taskDescription"
              name="taskDescription"
              placeholder="Enter a detailed description of the task"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            ></textarea>
            <div className="markdown-hint">Markdown supported: **bold**, *italic*, - list ...</div>
            <div className="error-message" id="descriptionError"></div>
          </div>

          <div className="form-group">
            <label htmlFor="taskFile">File</label>
            <div className="file-upload-container">
              <button
                type="button"
                id="fileUploadBtn"
                className="file-upload-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload File
              </button>
              <input
                type="file"
                id="taskFile"
                name="taskFile"
                className="file-input"
                accept=".pdf,.docx,image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <span id="fileNameDisplay">{fileName}</span>
              <div className="error-message" id="fileError" style={{ display: fileError ? 'block' : 'none' }}>
                {fileError}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="taskDate">Due Date</label>
            <input
              type="date"
              id="taskDate"
              name="taskDate"
              max="2028-12-31"
              min={minDate}
              placeholder="Select date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className={dateError ? 'error' : ''}
            />
            <div className="error-message" id="dateError" style={{ display: dateError ? 'block' : 'none' }}>
              {dateError}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="taskPriority">Priority</label>
            <select
              id="taskPriority"
              name="taskPriority"
              className="priority-select"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="button-group">
            <button type="button" id="addButton" onClick={handleAddTask}>
              Add Task
            </button>
          </div>
        </form>

        <div className="sort-options">
          <p>Sort by:</p>
          <label>
            <input
              type="radio"
              name="sortOption"
              value="createdAt"
              checked={sortOption === 'createdAt'}
              onChange={(event) => setSortOption(event.target.value)}
            />
            Date Added (newest first)
          </label>
          <label>
            <input
              type="radio"
              name="sortOption"
              value="dueDate"
              checked={sortOption === 'dueDate'}
              onChange={(event) => setSortOption(event.target.value)}
            />
            Due Date
          </label>
          <label>
            <input
              type="radio"
              name="sortOption"
              value="priority"
              checked={sortOption === 'priority'}
              onChange={(event) => setSortOption(event.target.value)}
            />
            Priority
          </label>
        </div>

        <div id="taskList">
          {sortedTasks.map((task) => {
            const descriptionHtml = task.description
              ? DOMPurify.sanitize(marked.parse(task.description))
              : '<p>No description.</p>';
            const timeLeft = getTimeLeftLabel(task.dueDate);

            return (
              <div className={`task-item ${task.completed ? 'completed-task' : ''}`} key={task._id}>
                <div className="task-header">
                  <input
                    type="checkbox"
                    className="task-completion-checkbox"
                    checked={Boolean(task.completed)}
                    title={task.completed ? 'Task completed' : 'Task not completed'}
                    onChange={() => handleToggleCompleted(task)}
                  />
                  <h3 style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>{task.name}</h3>
                  <span className={`priority-badge priority-${task.priority || 'medium'}`}>
                    {PRIORITY_LABELS[task.priority || 'medium']}
                  </span>
                </div>

                <p className="date">Added: {formatDateTime(task.createdAt)}</p>
                <div className="task-description">
                  <div dangerouslySetInnerHTML={{ __html: descriptionHtml }}></div>
                  {task.file?.originalName ? (
                    <div className="task-file">
                      <a className="file-link" href={`/api/tasks/${task._id}/file`} download>
                        {task.file.originalName}
                      </a>
                    </div>
                  ) : null}
                </div>
                <p className="date">Due date: {formatDate(task.dueDate)}</p>
                {timeLeft ? (
                  <p className="date time-left" style={{ color: timeLeft.isOverdue ? 'red' : undefined }}>
                    {timeLeft.text}
                  </p>
                ) : null}
                <span className="edit-icon" title="Edit task" onClick={() => openEditModal(task)}>
                  &#9998;
                </span>
                <span className="delete-icon" title="Delete task" onClick={() => handleDeleteTask(task)}>
                  &#128465;
                </span>

              </div>
            );
          })}
        </div>

        {sortedTasks.length === 0 ? <h3 id="taskListPlaceholder">Your added tasks will appear here</h3> : null}
      </div>

      {isEditOpen ? (
        <div id="editModal" className="modal" style={{ display: 'block' }}>
          <div className="modal-content">
            <span className="close-modal" onClick={closeEditModal}>
              &times;
            </span>
            <h2>Edit Task</h2>
            <form id="editTaskForm" onSubmit={(event) => event.preventDefault()}>
              <input type="hidden" id="editTaskId" value={editTask?._id || ''} readOnly />
              <div className="form-group">
                <label htmlFor="editTaskTitle">Title</label>
                <input
                  type="text"
                  id="editTaskTitle"
                  name="editTaskTitle"
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                  className={editTitleError ? 'error' : ''}
                  required
                />
                <div className="error-message" id="editTitleError" style={{ display: editTitleError ? 'block' : 'none' }}>
                  {editTitleError}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="editTaskDescription">Description</label>
                <textarea
                  id="editTaskDescription"
                  name="editTaskDescription"
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                ></textarea>
                <div className="markdown-hint">Supports Markdown: **bold**, *italic*, - list items...</div>
                <div className="error-message" id="editDescriptionError"></div>
              </div>

              <div className="form-group">
                <label htmlFor="editTaskFile">File</label>
                <div className="file-upload-container">
                  <button
                    type="button"
                    id="editFileUploadBtn"
                    className="file-upload-btn"
                    onClick={() => editFileInputRef.current?.click()}
                  >
                    Upload File
                  </button>
                  <input
                    type="file"
                    id="editTaskFile"
                    name="editTaskFile"
                    className="file-input"
                    accept=".pdf,.docx,image/*"
                    ref={editFileInputRef}
                    onChange={handleEditFileChange}
                  />
                  <span id="editFileNameDisplay">{editFileName}</span>
                  <div className="error-message" id="editFileError" style={{ display: editFileError ? 'block' : 'none' }}>
                    {editFileError}
                  </div>
                </div>
                <div id="currentFileDisplay" className="current-file">
                  {editTask?.file?.originalName ? (
                    <p>
                      Current file:{' '}
                      <a href={`/api/tasks/${editTask._id}/file`} download>
                        {editTask.file.originalName}
                      </a>
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="editTaskDate">Due Date</label>
                <input
                  type="date"
                  id="editTaskDate"
                  name="editTaskDate"
                  max="2028-12-31"
                  min={minDate}
                  value={editDueDate}
                  onChange={(event) => setEditDueDate(event.target.value)}
                  className={editDateError ? 'error' : ''}
                />
                <div className="error-message" id="editDateError" style={{ display: editDateError ? 'block' : 'none' }}>
                  {editDateError}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="editTaskPriority">Priority</label>
                <select
                  id="editTaskPriority"
                  name="editTaskPriority"
                  className="priority-select"
                  value={editPriority}
                  onChange={(event) => setEditPriority(event.target.value)}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="button-group">
                <button type="button" id="saveTaskButton" onClick={handleSaveEdit}>
                  Save
                </button>
                <button type="button" id="cancelEditButton" onClick={closeEditModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
