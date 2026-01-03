import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import '../styles/tasks.css';

marked.setOptions({
  breaks: true,
  gfm: true
});

const MAX_DATE = '2028-12-31';
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function Tasks() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [tasks, setTasks] = useState([]);
  const [sortOption, setSortOption] = useState('createdAt');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formState, setFormState] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    file: null,
    fileName: ''
  });
  const [formErrors, setFormErrors] = useState({
    title: '',
    date: '',
    file: ''
  });
  const [editState, setEditState] = useState({
    open: false,
    taskId: '',
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    file: null,
    fileName: '',
    currentFileName: ''
  });
  const [editErrors, setEditErrors] = useState({
    title: '',
    date: '',
    file: ''
  });

  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  const minDate = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const todayLabel = useMemo(() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `Today is ${daysEn[now.getDay()]}, ${day}.${month}.${year}`;
  }, []);

  useEffect(() => {
    fetch('/api/user')
      .then(response => {
        if (!response.ok) {
          throw new Error('Unauthorized');
        }
        return response.json();
      })
      .then(data => {
        if (data.email) {
          setUserEmail(`Logged in as ${data.email}`);
        }
      })
      .catch(() => {
        navigate('/login', { replace: true });
      });
  }, [navigate]);

  useEffect(() => {
    fetch('/api/tasks')
      .then(response => {
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            navigate('/login', { replace: true });
            return Promise.reject(new Error('Unauthorized'));
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setTasks(data);
        setError('');
      })
      .catch(err => {
        if (err.message !== 'Unauthorized') {
          setError('Failed to load tasks. Please reload the page.');
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const sortedTasks = useMemo(() => {
    const sorted = [...tasks];
    const priorityOrder = { high: 0, medium: 1, low: 2 };

    sorted.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      if (sortOption === 'priority') {
        const pa = priorityOrder[a.priority] ?? 1;
        const pb = priorityOrder[b.priority] ?? 1;
        if (pa !== pb) return pa - pb;
        return new Date(b.createdAt) - new Date(a.createdAt);
      }

      if (sortOption === 'dueDate') {
        const dateA = a.dueDate ? new Date(a.dueDate) : null;
        const dateB = b.dueDate ? new Date(b.dueDate) : null;

        if (dateA === null && dateB === null) return 0;
        if (dateA === null) return 1;
        if (dateB === null) return -1;

        return dateA - dateB;
      }

      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return sorted;
  }, [tasks, sortOption]);

  const validateDueDate = value => {
    if (!value) {
      return '';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [year, month, day] = value.split('-').map(Number);
    const chosenDateLocal = new Date(year, month - 1, day);
    chosenDateLocal.setHours(0, 0, 0, 0);

    const maxDate = new Date(MAX_DATE);
    maxDate.setHours(0, 0, 0, 0);

    if (chosenDateLocal > maxDate) {
      return 'Date cannot be later than 12/31/2028.';
    }

    if (chosenDateLocal < today) {
      return 'Date cannot be in the past.';
    }

    return '';
  };

  const validateFile = file => {
    if (!file) return '';

    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds 10MB.';
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'Only PDF, DOCX, and image files are allowed.';
    }

    return '';
  };

  const handleAddTask = () => {
    const titleError = formState.title.trim() ? '' : 'Title cannot be empty';
    const dateError = validateDueDate(formState.dueDate);
    const fileError = validateFile(formState.file);

    setFormErrors({ title: titleError, date: dateError, file: fileError });

    if (titleError || dateError || fileError) {
      return;
    }

    const payload = new FormData();
    payload.append('name', formState.title.trim());
    payload.append('description', formState.description.trim());
    payload.append('priority', formState.priority);

    if (formState.dueDate) {
      payload.append('dueDate', formState.dueDate);
    }

    if (formState.file) {
      payload.append('taskFile', formState.file);
    }

    fetch('/api/tasks', {
      method: 'POST',
      body: payload
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        return response
          .json()
          .then(errorData => {
            let errorMessage = errorData.message || 'Something went wrong. Try again.';
            if (response.status === 400 && !errorData.message) {
              errorMessage = 'Fill in all required fields.';
            } else if (response.status === 413) {
              errorMessage = 'File too large. Maximum size 10MB.';
            } else if (response.status === 415) {
              errorMessage = 'Incorrect file type.';
            }
            throw new Error(errorMessage);
          })
          .catch(() => {
            throw new Error(`HTTP error ${response.status}. Something went wrong.`);
          });
      })
      .then(newTask => {
        setTasks(prev => [...prev, newTask]);
        setFormState({
          title: '',
          description: '',
          dueDate: '',
          priority: 'medium',
          file: null,
          fileName: ''
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      })
      .catch(err => {
        window.alert(err.message || 'Error adding task. Check network connection.');
      });
  };

  const handleLogout = () => {
    fetch('/api/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        if (response.ok) {
          navigate('/');
        }
      })
      .catch(() => {
        window.alert('Error logging out.');
      });
  };

  const handleToggleCompleted = taskId => {
    fetch(`/api/tasks/${taskId}/toggle-completed`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to update task status');
        }
        return response.json();
      })
      .then(updatedTask => {
        setTasks(prev => prev.map(task => (task._id === updatedTask._id ? updatedTask : task)));
      })
      .catch(() => {
        window.alert('Error updating task status');
      });
  };

  const handleDeleteTask = task => {
    if (!window.confirm(`Are you sure you want to delete the task "${task.name}"?`)) {
      return;
    }

    fetch(`/api/tasks/${task._id}`, {
      method: 'DELETE'
    })
      .then(response => {
        if (response.ok) {
          setTasks(prev => prev.filter(item => item._id !== task._id));
          return;
        }
        return response.json().then(errorData => {
          throw new Error(errorData.message || 'Failed to delete task. Please try again.');
        });
      })
      .catch(error => {
        window.alert(error.message || 'Error deleting task. Check network connection.');
      });
  };

  const openEditModal = task => {
    setEditState({
      open: true,
      taskId: task._id,
      title: task.name,
      description: task.description || '',
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      priority: task.priority || 'medium',
      file: null,
      fileName: '',
      currentFileName: task.file?.originalName || ''
    });
    setEditErrors({ title: '', date: '', file: '' });
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
  };

  const closeEditModal = () => {
    setEditState(prev => ({ ...prev, open: false }));
  };

  const handleSaveEdit = () => {
    const titleError = editState.title.trim() ? '' : 'Title cannot be empty';
    const dateError = validateDueDate(editState.dueDate);
    const fileError = validateFile(editState.file);

    setEditErrors({ title: titleError, date: dateError, file: fileError });

    if (titleError || dateError || fileError) {
      return;
    }

    const payload = new FormData();
    payload.append('name', editState.title.trim());
    payload.append('description', editState.description.trim());
    payload.append('priority', editState.priority);

    if (editState.dueDate) {
      payload.append('dueDate', editState.dueDate);
    }

    if (editState.file) {
      payload.append('taskFile', editState.file);
    }

    fetch(`/api/tasks/${editState.taskId}`, {
      method: 'PUT',
      body: payload
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        return response
          .json()
          .then(errorData => {
            let errorMessage = errorData.message || 'Something went wrong updating task.';
            if (response.status === 413) {
              errorMessage = 'File too large. Maximum size 10MB.';
            }
            throw new Error(errorMessage);
          })
          .catch(() => {
            throw new Error(`HTTP error ${response.status}. Failed to update task.`);
          });
      })
      .then(updatedTask => {
        setTasks(prev => prev.map(task => (task._id === updatedTask._id ? updatedTask : task)));
        closeEditModal();
      })
      .catch(error => {
        window.alert(error.message || 'Error updating task. Check network connection.');
      });
  };

  const renderMarkdown = text => {
    if (!text) {
      return '<p>No description.</p>';
    }
    const parsed = marked.parse(text);
    return DOMPurify.sanitize(parsed);
  };

  if (loading) {
    return <div className="loading-state">Loading tasks...</div>;
  }

  return (
    <div className="tasks-page">
      <div className="user-info">
        <span id="userEmail">{userEmail || 'Loading user...'}</span>
        <button id="logoutBtn" type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div id="currentDate">{todayLabel}</div>

      <div className="container">
        <h1>Task Manager</h1>
        <form id="taskForm">
          <div className="form-group">
            <label htmlFor="taskTitle">Title</label>
            <input
              type="text"
              id="taskTitle"
              name="taskTitle"
              placeholder="Enter a short task title"
              value={formState.title}
              onChange={event => setFormState(prev => ({ ...prev, title: event.target.value }))}
              className={formErrors.title ? 'error' : ''}
              required
            />
            <div className="error-message" style={{ display: formErrors.title ? 'block' : 'none' }}>
              {formErrors.title}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="taskDescription">Description</label>
            <textarea
              id="taskDescription"
              name="taskDescription"
              placeholder="Enter a detailed description of the task"
              value={formState.description}
              onChange={event => setFormState(prev => ({ ...prev, description: event.target.value }))}
            />
            <div className="markdown-hint">Markdown supported: **bold**, *italic*, - list ...</div>
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
                onChange={event => {
                  const selectedFile = event.target.files?.[0] || null;
                  setFormState(prev => ({
                    ...prev,
                    file: selectedFile,
                    fileName: selectedFile ? selectedFile.name : ''
                  }));
                  setFormErrors(prev => ({
                    ...prev,
                    file: selectedFile ? validateFile(selectedFile) : ''
                  }));
                }}
              />
              <span id="fileNameDisplay">{formState.fileName}</span>
              <div className="error-message" style={{ display: formErrors.file ? 'block' : 'none' }}>
                {formErrors.file}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="taskDate">Due Date</label>
            <input
              type="date"
              id="taskDate"
              name="taskDate"
              max={MAX_DATE}
              min={minDate}
              placeholder="Select date"
              value={formState.dueDate}
              onChange={event => {
                const value = event.target.value;
                setFormState(prev => ({ ...prev, dueDate: value }));
                setFormErrors(prev => ({ ...prev, date: validateDueDate(value) }));
              }}
              className={formErrors.date ? 'error' : ''}
            />
            <div className="error-message" style={{ display: formErrors.date ? 'block' : 'none' }}>
              {formErrors.date}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="taskPriority">Priority</label>
            <select
              id="taskPriority"
              name="taskPriority"
              className="priority-select"
              value={formState.priority}
              onChange={event => setFormState(prev => ({ ...prev, priority: event.target.value }))}
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
              onChange={event => setSortOption(event.target.value)}
            />
            Date Added (newest first)
          </label>
          <label>
            <input
              type="radio"
              name="sortOption"
              value="dueDate"
              checked={sortOption === 'dueDate'}
              onChange={event => setSortOption(event.target.value)}
            />
            Due Date
          </label>
          <label>
            <input
              type="radio"
              name="sortOption"
              value="priority"
              checked={sortOption === 'priority'}
              onChange={event => setSortOption(event.target.value)}
            />
            Priority
          </label>
        </div>

        {error && <div className="error-state">{error}</div>}

        <div id="taskList">
          {sortedTasks.map(task => {
            const addedDateObj = new Date(task.createdAt);
            const addedDate = `${String(addedDateObj.getDate()).padStart(2, '0')}.${String(
              addedDateObj.getMonth() + 1
            ).padStart(2, '0')}.${addedDateObj.getFullYear()} ${String(addedDateObj.getHours()).padStart(2, '0')}:${String(
              addedDateObj.getMinutes()
            ).padStart(2, '0')}`;

            let formattedDueDate = 'Not specified';
            let dueDateObj = null;
            if (task.dueDate) {
              dueDateObj = new Date(task.dueDate);
              const day = String(dueDateObj.getDate()).padStart(2, '0');
              const month = String(dueDateObj.getMonth() + 1).padStart(2, '0');
              const year = dueDateObj.getFullYear();
              formattedDueDate = `${day}.${month}.${year}`;
              dueDateObj.setHours(0, 0, 0, 0);
            }

            let timeLeftText = '';
            let timeLeftStyle = {};
            if (dueDateObj) {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const diffTime = dueDateObj.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              if (diffDays < 0) {
                timeLeftText = `(Overdue by ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'day' : 'days'})`;
                timeLeftStyle = { color: 'red' };
              } else if (diffDays === 0) {
                timeLeftText = '(Today)';
              } else if (diffDays === 1) {
                timeLeftText = '1 day left';
              } else {
                timeLeftText = `${diffDays} days left`;
              }
            }

            return (
              <div
                className={`task-item${task.completed ? ' completed-task' : ''}`}
                key={task._id}
                data-task-id={task._id}
              >
                <div className="task-header">
                  <input
                    type="checkbox"
                    className="task-completion-checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleCompleted(task._id)}
                    title={task.completed ? 'Task completed' : 'Task not completed'}
                  />
                  <h3 style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>{task.name}</h3>
                  <span className={`priority-badge priority-${task.priority || 'medium'}`}>
                    {task.priority === 'high'
                      ? 'High Priority'
                      : task.priority === 'low'
                        ? 'Low Priority'
                        : 'Medium Priority'}
                  </span>
                </div>

                <p className="date">Added: {addedDate}</p>
                <div
                  className="task-description"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(task.description) }}
                />
                <p className="date">Due date: {formattedDueDate}</p>
                {timeLeftText && (
                  <p className="date time-left" style={timeLeftStyle}>
                    {timeLeftText}
                  </p>
                )}

                {task.file?.originalName && (
                  <div className="task-file">
                    <a className="file-link" href={`/api/tasks/${task._id}/file`} download>
                      {task.file.originalName}
                    </a>
                  </div>
                )}

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
        {!error && sortedTasks.length === 0 && <h3 id="taskListPlaceholder">Your added tasks will appear here</h3>}
      </div>

      {editState.open && (
        <div id="editModal" className="modal" style={{ display: 'block' }}>
          <div className="modal-content">
            <span className="close-modal" onClick={closeEditModal}>
              &times;
            </span>
            <h2>Edit Task</h2>
            <form id="editTaskForm">
              <div className="form-group">
                <label htmlFor="editTaskTitle">Title</label>
                <input
                  type="text"
                  id="editTaskTitle"
                  name="editTaskTitle"
                  value={editState.title}
                  onChange={event => setEditState(prev => ({ ...prev, title: event.target.value }))}
                  className={editErrors.title ? 'error' : ''}
                  required
                />
                <div className="error-message" style={{ display: editErrors.title ? 'block' : 'none' }}>
                  {editErrors.title}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="editTaskDescription">Description</label>
                <textarea
                  id="editTaskDescription"
                  name="editTaskDescription"
                  value={editState.description}
                  onChange={event => setEditState(prev => ({ ...prev, description: event.target.value }))}
                />
                <div className="markdown-hint">Supports Markdown: **bold**, *italic*, - list items...</div>
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
                    onChange={event => {
                      const selectedFile = event.target.files?.[0] || null;
                      setEditState(prev => ({
                        ...prev,
                        file: selectedFile,
                        fileName: selectedFile ? selectedFile.name : ''
                      }));
                      setEditErrors(prev => ({
                        ...prev,
                        file: selectedFile ? validateFile(selectedFile) : ''
                      }));
                    }}
                  />
                  <span id="editFileNameDisplay">{editState.fileName}</span>
                  <div className="error-message" style={{ display: editErrors.file ? 'block' : 'none' }}>
                    {editErrors.file}
                  </div>
                </div>
                <div id="currentFileDisplay" className="current-file">
                  {editState.currentFileName && (
                    <p>
                      Current file:{' '}
                      <a href={`/api/tasks/${editState.taskId}/file`} download>
                        {editState.currentFileName}
                      </a>
                    </p>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="editTaskDate">Due Date</label>
                <input
                  type="date"
                  id="editTaskDate"
                  name="editTaskDate"
                  max={MAX_DATE}
                  min={minDate}
                  value={editState.dueDate}
                  onChange={event => {
                    const value = event.target.value;
                    setEditState(prev => ({ ...prev, dueDate: value }));
                    setEditErrors(prev => ({ ...prev, date: validateDueDate(value) }));
                  }}
                  className={editErrors.date ? 'error' : ''}
                />
                <div className="error-message" style={{ display: editErrors.date ? 'block' : 'none' }}>
                  {editErrors.date}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="editTaskPriority">Priority</label>
                <select
                  id="editTaskPriority"
                  name="editTaskPriority"
                  className="priority-select"
                  value={editState.priority}
                  onChange={event => setEditState(prev => ({ ...prev, priority: event.target.value }))}
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
      )}
    </div>
  );
}
