document.addEventListener('DOMContentLoaded', function () {
    var today = new Date();
    var yyyy = today.getFullYear();
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var dd = String(today.getDate()).padStart(2, '0');
    var minDate = yyyy + '-' + mm + '-' + dd;
    var dateInput = document.getElementById('taskDate');
    if (dateInput) {
        dateInput.setAttribute('min', minDate);
        dateInput.addEventListener('input', validateDueDate);
    }

    marked.setOptions({
        breaks: true,
        gfm: true,
        sanitize: false
    });

    fetchUserInfo();

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    const addButton = document.getElementById('addButton');
    if (addButton) {
        addButton.addEventListener('click', addTask);
    }

    const sortRadios = document.querySelectorAll('input[name="sortOption"]');
    if (sortRadios.length > 0) {
        sortRadios.forEach(radio => {
            radio.addEventListener('change', sortTasks);
        });
    }

    const fileUploadBtn = document.getElementById('fileUploadBtn');
    const taskFileInput = document.getElementById('taskFile');
    const fileNameDisplay = document.getElementById('fileNameDisplay');

    if (fileUploadBtn && taskFileInput) {
        fileUploadBtn.addEventListener('click', function () {
            taskFileInput.click();
        });

        taskFileInput.addEventListener('change', function () {
            if (this.files.length > 0) {
                validateFile(this.files[0]);
                fileNameDisplay.textContent = this.files[0].name;
            } else {
                fileNameDisplay.textContent = '';
            }
        });
    }

    const editFileUploadBtn = document.getElementById('editFileUploadBtn');
    const editTaskFileInput = document.getElementById('editTaskFile');
    const editFileNameDisplay = document.getElementById('editFileNameDisplay');

    if (editFileUploadBtn && editTaskFileInput) {
        editFileUploadBtn.addEventListener('click', function () {
            editTaskFileInput.click();
        });

        editTaskFileInput.addEventListener('change', function () {
            if (this.files.length > 0) {
                validateFile(this.files[0], 'editFileError');
                editFileNameDisplay.textContent = this.files[0].name;
            } else {
                editFileNameDisplay.textContent = '';
            }
        });
    }

    const currentDateDiv = document.getElementById('currentDate');
    if (currentDateDiv) {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayOfWeek = daysEn[now.getDay()];
        const formatted = `${day}.${month}.${year}`;
        currentDateDiv.textContent = `Today is ${dayOfWeek}, ${formatted}`;
    }

    loadAndDisplayTasks();
});

function fetchUserInfo() {
    fetch('/api/user')
        .then(response => {
            if (!response.ok) {
                throw new Error('Unauthorized');
            }
            return response.json();
        })
        .then(data => {
            const userEmailElement = document.getElementById('userEmail');
            if (userEmailElement && data.email) {
                userEmailElement.textContent = `Logged in as ${data.email}`;
            }
        })
        .catch(error => {
            console.error('Error fetching user information:', error);
            window.location.href = '/frontend/login.html';
        });
}

function logout() {
    fetch('/api/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (response.ok) {
                window.location.href = '/';
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function validateDueDate() {
    const dateInput = document.getElementById('taskDate');
    const errorElement = document.getElementById('dateError');
    const selectedDate = dateInput.value;

    errorElement.textContent = '';
    errorElement.style.display = 'none';
    dateInput.classList.remove('error');

    if (!selectedDate) {
        return true;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const chosenDate = new Date(selectedDate);
    chosenDate.setHours(0, 0, 0, 0);
    const [year, month, day] = selectedDate.split('-').map(Number);
    const chosenDateLocal = new Date(year, month - 1, day);

    const maxDate = new Date('2028-12-31');
    maxDate.setHours(0, 0, 0, 0);

    if (chosenDateLocal > maxDate) {
        errorElement.textContent = 'Date cannot be later than 12/31/2028.';
        errorElement.style.display = 'block';
        dateInput.classList.add('error');
        return false;
    }

    if (chosenDateLocal < today) {
        errorElement.textContent = 'Date cannot be in the past.';
        errorElement.style.display = 'block';
        dateInput.classList.add('error');
        return false;
    }

    return true;
}

function validateFile(file, errorElementId = 'fileError') {
    const errorElement = document.getElementById(errorElementId);
    errorElement.textContent = '';
    errorElement.style.display = 'none';

    const maxSizeInBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
        errorElement.textContent = 'File size exceeds 10MB.';
        errorElement.style.display = 'block';
        return false;
    }

    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
        errorElement.textContent = 'Only PDF, DOCX, and image files are allowed.';
        errorElement.style.display = 'block';
        return false;
    }

    return true;
}

function createTaskElement(task) {
    const taskList = document.getElementById('taskList');
    const placeholder = document.getElementById('taskListPlaceholder');

    const addedDateObj = new Date(task.createdAt);
    const addedDate = `${String(addedDateObj.getDate()).padStart(2, '0')}.${String(addedDateObj.getMonth() + 1).padStart(2, '0')}.${addedDateObj.getFullYear()} ${String(addedDateObj.getHours()).padStart(2, '0')}:${String(addedDateObj.getMinutes()).padStart(2, '0')}`;

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

    const taskItem = document.createElement('div');
    taskItem.classList.add('task-item');
    taskItem.dataset.taskId = task._id;
    taskItem.dataset.completed = task.completed ? 'true' : 'false';
    taskItem.dataset.dueDate = task.dueDate ? new Date(task.dueDate).toISOString() : '';
    taskItem.dataset.createdAt = task.createdAt ? new Date(task.createdAt).toISOString() : new Date().toISOString();
    taskItem.dataset.priority = task.priority || 'medium';

    const completionCheckbox = document.createElement('input');
    completionCheckbox.type = 'checkbox';
    completionCheckbox.className = 'task-completion-checkbox';
    completionCheckbox.checked = task.completed;
    completionCheckbox.title = task.completed ? 'Task completed' : 'Task not completed';
    completionCheckbox.addEventListener('change', async function () {
        try {
            const response = await fetch(`/api/tasks/${task._id}/toggle-completed`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const updatedTask = await response.json();
                updateTaskInUI(updatedTask);
            } else {
                throw new Error('Failed to update task status');
            }
        } catch (error) {
            console.error('Error: ', error);
            alert('Error updating task status');
            completionCheckbox.checked = !completionCheckbox.checked;
        }
    });

    const taskTitle = document.createElement('h3');
    taskTitle.textContent = task.name;

    if (task.completed) {
        taskTitle.style.textDecoration = 'line-through';
        taskItem.classList.add('completed-task');
    }

    const priorityBadge = document.createElement('span');
    priorityBadge.classList.add('priority-badge', `priority-${task.priority || 'medium'}`);
    if (task.priority === 'high') {
        priorityBadge.textContent = 'High Priority';
    } else if (task.priority === 'medium') {
        priorityBadge.textContent = 'Medium Priority';
    } else {
        priorityBadge.textContent = 'Low Priority';
    }

    const taskHeader = document.createElement('div');
    taskHeader.className = 'task-header';
    taskHeader.appendChild(completionCheckbox);
    taskHeader.appendChild(taskTitle);
    taskHeader.appendChild(priorityBadge);

    taskItem.appendChild(taskHeader);

    const taskAddedDate = document.createElement('p');
    taskAddedDate.classList.add('date');
    taskAddedDate.textContent = `Added: ${addedDate}`;

    const taskDescription = document.createElement('div');
    taskDescription.classList.add('task-description');

    if (task.description) {
        const parsedMarkdown = marked.parse(task.description);
        const sanitizedHtml = DOMPurify.sanitize(parsedMarkdown);
        taskDescription.innerHTML = sanitizedHtml;
    } else {
        const noDesc = document.createElement('p');
        noDesc.textContent = 'No description.';
        taskDescription.appendChild(noDesc);
    }

    const taskDueDate = document.createElement('p');
    taskDueDate.classList.add('date');
    taskDueDate.textContent = `Due date: ${formattedDueDate}`;

    let timeLeftElement = null;
    if (dueDateObj) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const diffTime = dueDateObj.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        timeLeftElement = document.createElement('p');
        timeLeftElement.classList.add('date', 'time-left');

        if (diffDays < 0) {
            timeLeftElement.textContent = `(Overdue by ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'day' : 'days'})`;
            timeLeftElement.style.color = 'red';
        } else if (diffDays === 0) {
            timeLeftElement.textContent = '(Today)';
        } else if (diffDays === 1) {
            timeLeftElement.textContent = '1 day left';
        } else {
            timeLeftElement.textContent = `${diffDays} days left`;
        }
    }

    const editIcon = document.createElement('span');
    editIcon.classList.add('edit-icon');
    editIcon.innerHTML = '&#9998;';
    editIcon.title = 'Edit task';
    editIcon.onclick = function () {
        openEditModal(task);
    };

    const deleteIcon = document.createElement('span');
    deleteIcon.classList.add('delete-icon');
    deleteIcon.innerHTML = '&#128465;';
    deleteIcon.title = 'Delete task';
    deleteIcon.onclick = async function () {
        const taskIdToDelete = taskItem.dataset.taskId;
        if (!taskIdToDelete) {
            console.error("Task ID not found on element for deletion.");
            return;
        }

        if (!confirm(`Are you sure you want to delete the task "${task.name}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/tasks/${taskIdToDelete}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                taskItem.remove();
                const taskList = document.getElementById('taskList');
                const placeholder = document.getElementById('taskListPlaceholder');
                if (taskList.children.length === 0 && placeholder) {
                    placeholder.style.display = 'block';
                }
                sortTasks();
            } else {
                const errorData = await response.json().catch(() => ({ message: 'Failed to delete task. Please try again.' }));
                console.error('Failed to delete task:', response.status, errorData.message);
                alert(`Error: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Network error deleting task:', error);
            alert('Error deleting task. Check network connection.');
        }
    };

    taskItem.appendChild(taskTitle);
    taskItem.appendChild(taskAddedDate);
    taskItem.appendChild(taskDescription);
    taskItem.appendChild(taskDueDate);
    if (timeLeftElement) {
        taskItem.appendChild(timeLeftElement);
    }
    taskItem.appendChild(editIcon);
    taskItem.appendChild(deleteIcon);

    if (task.file && task.file.originalName) {
        const taskFile = document.createElement('div');
        taskFile.classList.add('task-file');

        const fileLink = document.createElement('a');
        fileLink.classList.add('file-link');
        fileLink.href = `/api/tasks/${task._id}/file`;
        fileLink.textContent = task.file.originalName;
        fileLink.setAttribute('download', '');

        taskFile.appendChild(fileLink);
        taskDescription.appendChild(taskFile);
    }

    return taskItem;
}

async function loadAndDisplayTasks() {
    const taskList = document.getElementById('taskList');
    const placeholder = document.getElementById('taskListPlaceholder');

    if (placeholder) placeholder.style.display = 'none';
    taskList.innerHTML = '';

    try {
        const response = await fetch('/api/tasks');
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                console.log('User not authenticated or token expired. Redirecting.');
                window.location.href = '/frontend/login.html';
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return;
        }

        const tasks = await response.json();

        if (tasks.length === 0) {
            if (placeholder) placeholder.style.display = 'block';
        } else {
            if (placeholder) placeholder.style.display = 'none';

            tasks.forEach(task => {
                const taskElement = createTaskElement(task);
                taskList.appendChild(taskElement);
            });

            sortTasks();
        }

    } catch (error) {
        console.error('Error fetching tasks:', error);
        if (placeholder) placeholder.style.display = 'none';
        taskList.innerHTML = '<p class="error-message">Failed to load tasks. Please reload the page.</p>';
    }
}

function appendTaskToList(task) {
    const taskElement = createTaskElement(task);
    const taskList = document.getElementById('taskList');

    taskList.appendChild(taskElement);

    const placeholder = document.getElementById('taskListPlaceholder');
    if (placeholder) {
        placeholder.style.display = 'none';
    }

    sortTasks();
}

async function addTask() {
    const titleInput = document.getElementById('taskTitle');
    const descriptionInput = document.getElementById('taskDescription');
    const dateInput = document.getElementById('taskDate');
    const fileInput = document.getElementById('taskFile');
    const priorityInput = document.getElementById('taskPriority');

    document.getElementById('titleError').style.display = 'none';
    document.getElementById('descriptionError').style.display = 'none';
    document.getElementById('dateError').style.display = 'none';
    document.getElementById('fileError').style.display = 'none';

    let isValid = true;

    if (!titleInput.value.trim()) {
        const titleError = document.getElementById('titleError');
        titleError.textContent = 'Title cannot be empty';
        titleError.style.display = 'block';
        titleInput.classList.add('error');
        isValid = false;
    } else {
        titleInput.classList.remove('error');
    }

    if (dateInput.value) {
        if (!validateDueDate()) {
            isValid = false;
        }
    }

    if (fileInput.files.length > 0) {
        if (!validateFile(fileInput.files[0])) {
            isValid = false;
        }
    }

    if (!isValid) {
        return;
    }

    const formData = new FormData();
    formData.append('name', titleInput.value.trim());
    formData.append('description', descriptionInput.value.trim());
    formData.append('priority', priorityInput.value);

    if (dateInput.value) {
        formData.append('dueDate', dateInput.value);
    }

    if (fileInput.files.length > 0) {
        formData.append('taskFile', fileInput.files[0]);
    }

    fetch('/api/tasks', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            // Handle HTTP errors (like 400, 413, 500)
            return response.json().then(errorData => {
                let errorMessage = errorData.message || 'Something went wrong. Try again.';
                if (response.status === 400 && !errorData.message) {
                    errorMessage = 'Fill in all required fields.';
                } else if (response.status === 413) {
                    errorMessage = 'File too large. Maximum size 10MB.';
                } else if (response.status === 415) {
                     errorMessage = 'Incorrect file type.';
                 }
                throw new Error(errorMessage); // Throw an error to be caught by .catch()
            }).catch(() => {
                 // If response.json() fails or wasn't possible
                 throw new Error(`HTTP error ${response.status}. Something went wrong.`);
            });
        }
    })
    .then(newTask => {
        appendTaskToList(newTask);
        titleInput.value = '';
        descriptionInput.value = '';
        dateInput.value = '';
        fileInput.value = '';
        fileNameDisplay.textContent = '';
        priorityInput.value = 'medium';

        // Optional: Show success message
        // const successMessage = document.createElement('div');
        // successMessage.className = 'success-message';
        // successMessage.textContent = 'Task added successfully!';
        // document.getElementById('taskForm').appendChild(successMessage);
        // setTimeout(() => successMessage.remove(), 3000);
    })
    .catch(error => {
        // Handles network errors or errors thrown from the .then() blocks
        console.error('Error adding task:', error);
        alert(error.message || 'Error adding task. Check network connection.');
    });
}

function sortTasks() {
    const taskList = document.getElementById('taskList');
    const items = Array.from(taskList.children);

    if (items.length === 0) return;

    const sortType = document.querySelector('input[name="sortOption"]:checked').value;

    items.sort((a, b) => {
        const completedA = a.dataset.completed === 'true';
        const completedB = b.dataset.completed === 'true';

        if (completedA && !completedB) return 1;
        if (!completedA && completedB) return -1;

        if (sortType === 'priority') {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            const pa = priorityOrder[a.dataset.priority] ?? 1;
            const pb = priorityOrder[b.dataset.priority] ?? 1;
            if (pa !== pb) return pa - pb;
            const createdAtA = new Date(a.dataset.createdAt);
            const createdAtB = new Date(b.dataset.createdAt);
            return createdAtB - createdAtA;
        } else if (sortType === 'dueDate') {
            const dateA = a.dataset.dueDate ? new Date(a.dataset.dueDate) : null;
            const dateB = b.dataset.dueDate ? new Date(b.dataset.dueDate) : null;

            if (dateA === null && dateB === null) return 0;
            if (dateA === null) return 1;
            if (dateB === null) return -1;

            return dateA - dateB;
        } else {
            const createdAtA = new Date(a.dataset.createdAt);
            const createdAtB = new Date(b.dataset.createdAt);

            return createdAtB - createdAtA;
        }
    });

    items.forEach(item => taskList.appendChild(item));
}

function openEditModal(task) {
    const modal = document.getElementById('editModal');
    const titleInput = document.getElementById('editTaskTitle');
    const descriptionInput = document.getElementById('editTaskDescription');
    const dateInput = document.getElementById('editTaskDate');
    const taskIdInput = document.getElementById('editTaskId');
    const currentFileDisplay = document.getElementById('currentFileDisplay');
    const editFileNameDisplay = document.getElementById('editFileNameDisplay');
    const priorityInput = document.getElementById('editTaskPriority');

    const fileInput = document.getElementById('editTaskFile');
    if (fileInput) {
        fileInput.value = '';
    }
    if (editFileNameDisplay) {
        editFileNameDisplay.textContent = '';
    }

    document.getElementById('editTitleError').style.display = 'none';
    document.getElementById('editDescriptionError').style.display = 'none';
    document.getElementById('editDateError').style.display = 'none';
    document.getElementById('editFileError').style.display = 'none';

    titleInput.value = task.name;
    descriptionInput.value = task.description || '';
    taskIdInput.value = task._id;
    priorityInput.value = task.priority || 'medium';

    if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const year = dueDate.getFullYear();
        const month = String(dueDate.getMonth() + 1).padStart(2, '0');
        const day = String(dueDate.getDate()).padStart(2, '0');
        dateInput.value = `${year}-${month}-${day}`;
    } else {
        dateInput.value = '';
    }

    if (currentFileDisplay) {
        currentFileDisplay.innerHTML = '';

        if (task.file && task.file.originalName) {
            const fileInfo = document.createElement('p');
            fileInfo.innerHTML = `Current file: <a href="/api/tasks/${task._id}/file" download>${task.file.originalName}</a>`;
            currentFileDisplay.appendChild(fileInfo);
        }
    }

    modal.style.display = 'block';

    if (!modal.dataset.eventsAdded) {
        const closeBtn = modal.querySelector('.close-modal');
        const cancelBtn = document.getElementById('cancelEditButton');

        if (closeBtn) {
            closeBtn.addEventListener('click', closeEditModal);
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeEditModal);
        }

        const saveBtn = document.getElementById('saveTaskButton');
        if (saveBtn) {
            saveBtn.addEventListener('click', saveEditedTask);
        }

        modal.dataset.eventsAdded = 'true';
    }
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    modal.style.display = 'none';
}

function validateEditForm() {
    const titleInput = document.getElementById('editTaskTitle');
    const dateInput = document.getElementById('editTaskDate');
    const fileInput = document.getElementById('editTaskFile');

    let isValid = true;

    document.getElementById('editTitleError').style.display = 'none';
    document.getElementById('editDescriptionError').style.display = 'none';
    document.getElementById('editDateError').style.display = 'none';
    document.getElementById('editFileError').style.display = 'none';

    titleInput.classList.remove('error');

    if (!titleInput.value.trim()) {
        const titleError = document.getElementById('editTitleError');
        titleError.textContent = 'Title cannot be empty';
        titleError.style.display = 'block';
        titleInput.classList.add('error');
        isValid = false;
    }

    if (dateInput.value) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const selectedDate = new Date(dateInput.value);
        selectedDate.setHours(0, 0, 0, 0);

        const maxDate = new Date('2028-12-31');
        maxDate.setHours(0, 0, 0, 0);

        if (selectedDate > maxDate) {
            const dateError = document.getElementById('editDateError');
            dateError.textContent = 'Date cannot be later than 12/31/2028.';
            dateError.style.display = 'block';
            dateInput.classList.add('error');
            isValid = false;
        } else if (selectedDate < today) {
            const dateError = document.getElementById('editDateError');
            dateError.textContent = 'Date cannot be in the past.';
            dateError.style.display = 'block';
            dateInput.classList.add('error');
            isValid = false;
        } else {
            dateInput.classList.remove('error');
        }
    }

    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            const fileError = document.getElementById('editFileError');
            fileError.textContent = 'File size exceeds 10MB.';
            fileError.style.display = 'block';
            isValid = false;
        } else {
            const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                const fileError = document.getElementById('editFileError');
                fileError.textContent = 'Only PDF, DOCX, and image files are allowed.';
                fileError.style.display = 'block';
                isValid = false;
            } else {
                fileError.textContent = '';
                fileError.style.display = 'none';
            }
        }
    }

    return isValid;
}

async function saveEditedTask() {
    if (!validateEditForm()) {
        return;
    }

    const taskId = document.getElementById('editTaskId').value;
    const formData = new FormData();
    formData.append('name', document.getElementById('editTaskTitle').value.trim());
    formData.append('description', document.getElementById('editTaskDescription').value.trim());
    formData.append('priority', document.getElementById('editTaskPriority').value);

    const dateValue = document.getElementById('editTaskDate').value;
    if (dateValue) {
        formData.append('dueDate', dateValue);
    }

    const fileInput = document.getElementById('editTaskFile');
    if (fileInput.files.length > 0) {
        formData.append('taskFile', fileInput.files[0]);
    }

    fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: formData
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            // Handle HTTP errors
            return response.json().then(errorData => {
                 let errorMessage = errorData.message || 'Something went wrong updating task.';
                 if (response.status === 413) {
                     errorMessage = 'File too large. Maximum size 10MB.';
                 }
                 throw new Error(errorMessage);
             }).catch(() => {
                 // If response.json() fails
                 throw new Error(`HTTP error ${response.status}. Failed to update task.`);
             });
        }
    })
    .then(updatedTask => {
        updateTaskInUI(updatedTask);
        closeEditModal();
    })
    .catch(error => {
        // Handles network errors or errors thrown from .then() blocks
        console.error('Error updating task:', error);
        alert(error.message || 'Error updating task. Check network connection.');
    });
}

function updateTaskInUI(updatedTask) {
    const taskItem = document.querySelector(`.task-item[data-task-id="${updatedTask._id}"]`);

    if (taskItem) {
        const newTaskElement = createTaskElement(updatedTask);
        taskItem.parentNode.replaceChild(newTaskElement, taskItem);
    } else {
        loadAndDisplayTasks();
    }
}

function deleteTask(taskId) {
    const taskItem = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
    if (taskItem) {
        taskItem.remove();
        const taskList = document.getElementById('taskList');
        const placeholder = document.getElementById('taskListPlaceholder');
        if (taskList.children.length === 0 && placeholder) {
            placeholder.style.display = 'block'; // Show placeholder if list is empty
        }
    } else {
        console.warn(`Task with ID ${taskId} not found in UI for deletion.`);
    }
    // Optional: re-sort after deletion if needed, though usually not necessary
    // sortTasks();
}

document.addEventListener('DOMContentLoaded', function () {
    const closeBtn = document.querySelector('.close-modal');
    const cancelBtn = document.getElementById('cancelEditButton');
    const saveBtn = document.getElementById('saveTaskButton');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeEditModal);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeEditModal);
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', saveEditedTask);
    }
});