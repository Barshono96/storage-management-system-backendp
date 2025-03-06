# 📦 **Storage Management System**

The **Storage Management System** is a **TypeScript-based** application designed to provide robust file storage and management capabilities. It supports user authentication, file uploads, folder management, and integrates **Google OAuth** for a seamless user experience. This application is built using **Node.js, Express,** and **MongoDB**, following the **MVC architecture**.

---

## 🚀 **Features**

### 🔒 **User Authentication**
- Register with email and password  
- Login with email and password  
- Google OAuth integration  
- Password reset flow with email verification  

### 🗂 **File Management**
- Upload files (images, PDFs, and text documents)  
- Create, retrieve, and delete folders  
- Organize files within folders  
- Track storage usage and quotas  

### 🛡 **Security**
- **JWT-based** authentication for secure access  
- Input validation and error handling  

---

## 🛠 **Technologies Used**
- **Backend:** Node.js, Express  
- **Database:** MongoDB (with Mongoose ODM)  
- **Authentication:** JWT, Google OAuth  
- **File Uploads:** Multer for handling `multipart/form-data`  
- **Validation:** `express-validator` for input validation  
- **Environment Variables:** `dotenv` for managing configuration  

---

## 📝 **Getting Started**

### ✅ **Prerequisites**
- **Node.js:** v14 or higher  
- **MongoDB:** Local or Atlas  
- **npm:** Node Package Manager  

---

### 📥 **Installation**

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/storage-management-system.git
   cd storage-management-system
Install dependencies:

bash
Copy
Edit
npm install
Create a .env file in the root directory and add the following:

env
Copy
Edit
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster1.lypr1.mongodb.net/storage_management?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
▶️ Running the Application
Start the server:

bash
Copy
Edit
npm start
The application will be running at: http://localhost:5000

📌 API Endpoints
🔑 Authentication
POST /api/auth/register — Register a new user
POST /api/auth/login — Log in an existing user
POST /api/auth/forgot-password — Request a password reset
POST /api/auth/verify-code — Verify the reset code
POST /api/auth/reset-password — Reset the password
📂 File Management
POST /api/storage/upload — Upload files
GET /api/storage/files — Retrieve all files
GET /api/storage/folders — Retrieve all folders
DELETE /api/storage/files/:fileId — Delete a specific file
POST /api/storage/folders — Create a new folder
DELETE /api/storage/folders/:folderId — Delete a specific folder
🛠 Environment Setup Tips
Replace <username> and <password> in the .env file with your MongoDB credentials.
Get your Google OAuth credentials from the Google Developer Console.
📄 License
This project is licensed under the MIT License.

📞 Contact
For issues, please create an issue on this repository.

yaml
Copy
Edit

---

You can copy and paste this directly into your `README.md` file, and it will render with proper formatting on GitHub or any other markdown viewer. Let me know if you need any further adjustments! 😎
