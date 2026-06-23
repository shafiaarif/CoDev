<<<<<<< HEAD
#  DEVROOM — Code Together, Learn Together

DEVROOM is a real-time collaborative coding platform that lets **instructors** and **students** join live coding sessions, write and run Python code together, chat in real time, and manage classroom-style sessions — all from the browser.

> Where Developers Connect, Collaborate & Create.

---

##  Features

-  **Authentication** — Register/login as a Student, Instructor, or Admin (JWT-based auth)
-  **Role-based Dashboards** — Separate dashboards for Students and Instructors
-  **Live Coding Sessions** — Shared Monaco code editor with real-time sync via Socket.IO
-  **Python Code Execution** — Run Python code directly from the editor
-  **Real-time Chat** — In-session chat between participants
-  **Participant Management** — View online participants, kick students (instructor-only)
-  **Join via Link or Code** — Students can join sessions using a link or a session code
-  **File Upload/Download** — Upload starter Python code, download your current code
-  **Save Sessions** — Persist code progress during a session
-  **Assignments** — Students can view and manage assignments from their dashboard

---

##  Tech Stack

**Backend**
- Node.js + Express
- Socket.IO (real-time communication)
- MongoDB + Mongoose (data persistence)
- JWT (`jsonwebtoken`) for authentication
- bcrypt/bcryptjs for password hashing
- Multer (file uploads)
- dotenv (environment configuration)

**Frontend**
- HTML, CSS, vanilla JavaScript
- Monaco Editor (VS Code's editor, in-browser) — Python mode
- Socket.IO Client
- Font Awesome

---

##  Project Structure

```
=======
💻 DEVROOM — Code Together, Learn Together

DEVROOM is a real-time collaborative coding platform that lets instructors and students join live coding sessions, write and run Python code together, chat in real time, and manage classroom-style sessions — all from the browser.


Where Developers Connect, Collaborate & Create.


✨ Features


Authentication — Register/login as a Student, Instructor, or Admin (JWT-based auth)
Role-based Dashboards — Separate dashboards for Students and Instructors
Live Coding Sessions — Shared Monaco code editor with real-time sync via Socket.IO
Python Code Execution — Run Python code directly from the editor
Real-time Chat — In-session chat between participants
Participant Management — View online participants, kick students (instructor-only)
Join via Link or Code — Students can join sessions using a link or a session code
File Upload/Download — Upload starter Python code, download your current code
Save Sessions — Persist code progress during a session
Assignments — Students can view and manage assignments from their dashboard



Tech Stack

Backend

Node.js + Express
Socket.IO (real-time communication)
MongoDB + Mongoose (data persistence)
JWT (jsonwebtoken) for authentication
bcrypt/bcryptjs for password hashing
Multer (file uploads)
dotenv (environment configuration)

Frontend

HTML, CSS, vanilla JavaScript
Monaco Editor (VS Code's editor, in-browser) — Python mode
Socket.IO Client
Font Awesome

Project Structure

>>>>>>> 4a899fb73cf8d0322561490a3338b2282f439084
DEVROOM/
├── config/
│   └── db.js                  # MongoDB connection setup
├── controllers/
│   ├── authController.js
│   └── userController.js
├── middleware/
│   └── authMiddleware.js       # JWT verification middleware
├── models/
│   ├── User.js
│   ├── Message.js
│   ├── Room.js
│   └── SessionCode.js
├── routes/
│   ├── authRoutes.js
│   ├── users.js
│   └── roomRoutes.js
├── public/                     # Frontend (served statically)
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── student_dashboard.html
│   ├── instructor_dashboard.html
│   └── coding_session.html
├── uploads/                    # Uploaded starter code files
├── temp/                       # Temp files (e.g. code execution scratch space)
├── .env                        # Environment variables (not committed)
├── .gitignore
├── server.js                   # App entry point
├── package.json
└── package-lock.json
<<<<<<< HEAD
```

---

##  Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Python](https://www.python.org/) installed and available on your system PATH (required for code execution)
- [MongoDB](https://www.mongodb.com/) (local or Atlas)

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/devroom.git
cd devroom
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the project root:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

### 4. Run the server
```bash
npm start
```

The app will be available at `http://localhost:5000` (or whichever `PORT` you set).

---

## 🔌 API Overview

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/register` | POST | Register a new user (student/instructor) |
| `/api/auth/login` | POST | Log in and receive a JWT |
| `/api/users` | GET | Get user(s) info |
| `/api/rooms/participants/:roomId` | GET | List participants in a session |
| `/api/rooms/kick/:roomId` | POST | Kick a student from a session (instructor only) |
| `/api/rooms/chat` | POST | Send a chat message |
| `/api/rooms/save-code/:roomId` | POST | Save current Python code for a session |
| `/api/rooms/run` | POST | Execute submitted Python code |
| `/api/rooms/download` | POST | Download code as a `.py` file |
| `/api/rooms/end/:roomId` | POST | End a coding session (instructor only) |

**Socket.IO Events:** `joinRoom`, `codeChange`/`codeUpdate`, `chatMessage`, `userJoined`, `studentKicked`, `sessionEnded`, `admitResponse`

---

##  Usage

1. Open `index.html` (or visit the deployed URL) and **Register** as a Student or Instructor.
2. **Instructors** can create a session and share the generated link/code with students.
3. **Students** join via link or session code from their dashboard.
4. Write Python code in the shared editor, run it, and see output live — all changes, chat, and participants sync in real time.

---

##  Notes

- Make sure MongoDB is running and reachable via your `MONGO_URI` before starting the server.
- Frontend currently calls the backend at `http://localhost:5000` — update this in the HTML files if you deploy to a different host/port.
- Python must be installed and accessible via the system PATH for the **Run Code** feature to work.
- `.env`, `node_modules/`, `temp/`, and `uploads/` should be excluded from version control (see `.gitignore`).

---

## 📄 License

ISC
=======

Setup & Installation

Prerequisites

Node.js (v18+ recommended)
Python installed and available on your system PATH (required for code execution)
MongoDB (local or Atlas)


1. Clone the repository

bashgit clone https://github.com/<your-username>/devroom.git
cd devroom

2. Install dependencies

bashnpm install

3. Configure environment variables

Create a .env file in the project root:

envPORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key

4. Run the server

bashnpm start

The app will be available at http://localhost:5000 (or whichever PORT you set).


API Overview

EndpointMethodDescription/api/auth/registerPOSTRegister a new user (student/instructor)/api/auth/loginPOSTLog in and receive a JWT/api/usersGETGet user(s) info/api/rooms/participants/:roomIdGETList participants in a session/api/rooms/kick/:roomIdPOSTKick a student from a session (instructor only)/api/rooms/chatPOSTSend a chat message/api/rooms/save-code/:roomIdPOSTSave current Python code for a session/api/rooms/runPOSTExecute submitted Python code/api/rooms/downloadPOSTDownload code as a .py file/api/rooms/end/:roomIdPOSTEnd a coding session (instructor only)

Socket.IO Events: joinRoom, codeChange/codeUpdate, chatMessage, userJoined, studentKicked, sessionEnded, admitResponse


Usage

Open index.html (or visit the deployed URL) and Register as a Student or Instructor.
Instructors can create a session and share the generated link/code with students.
Students join via link or session code from their dashboard.
Write Python code in the shared editor, run it, and see output live — all changes, chat, and participants sync in real time.



Notes
Make sure MongoDB is running and reachable via your MONGO_URI before starting the server.
Frontend currently calls the backend at http://localhost:5000 — update this in the HTML files if you deploy to a different host/port.
Python must be installed and accessible via the system PATH for the Run Code feature to work.
.env, node_modules/, temp/, and uploads/ should be excluded from version control (see .gitignore).
>>>>>>> 4a899fb73cf8d0322561490a3338b2282f439084
