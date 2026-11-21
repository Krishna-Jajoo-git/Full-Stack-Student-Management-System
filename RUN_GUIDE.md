# Student Management System — Complete Run & Execution Guide

This comprehensive guide walks you through starting the backend infrastructure and running the mobile client across all three supported platforms:
1. **Web Browser (React Native for Web)**
2. **Android Studio (Native Android Emulator)**
3. **Expo (Expo Go / Development Server / Physical Devices)**

---

## Architecture & Port Allocation

Before launching, review the assigned network ports to avoid conflicts:

| Service | Host Port | Internal Port | Description |
| :--- | :---: | :---: | :--- |
| **PostgreSQL Database** | `5434` | `5432` | Containerized PostgreSQL 16 via Docker |
| **Spring Boot Backend** | `8081` | `8081` | Java 21 REST API & Security Engine |
| **Expo Metro Bundler** | `8082` | `8082` | JavaScript Bundler (Port 8082 avoids conflict with Backend) |
| **Android Emulator** | `10.0.2.2` | — | Emulator virtual network mapping to host `localhost` |

---

## Step 0: Start Database & Backend (Required for All Platforms)

The frontend client communicates with the live backend for authentication, leaderboard sync, and point transactions. Start the backend services first.

### 1. Start the PostgreSQL Container
Open a terminal in the project root:
```powershell
# Start PostgreSQL container on port 5434
docker compose up -d

# Verify container is healthy
docker compose ps
```

### 2. Start the Spring Boot Backend API
In the same terminal or a new terminal window:
```powershell
cd backend

# Run the Spring Boot application (Maven)
.\mvnw.cmd spring-boot:run
```
*Alternatively, run the pre-built standalone JAR directly:*
```powershell
java -jar backend/target/student-management-system-1.0.0.jar
```

Verify backend health by visiting:
* Health / Root: `http://localhost:8081/api/v1/auth/login` (Returns HTTP 400 with validation message, confirming API is active)

---

## Part 1: How to Run on Web (Browser)

The frontend uses React Native for Web to run natively in any modern web browser (Chrome, Edge, Firefox, Brave).

### 1. Install Dependencies (First time only)
```powershell
cd frontend
npm install --legacy-peer-deps
```

### 2. Start the Web Development Server
Because the Spring Boot backend occupies port `8081`, run Expo Metro on port `8082`:
```powershell
cd frontend
npx expo start --web --port 8082
```

### 3. Open in Browser
* Open your browser and navigate to:
  ```
  http://localhost:8082
  ```
* The application will render the responsive mobile layout with full authentication, theme switching, dynamic leaderboard, and teacher point distribution features.

---

## Part 2: How to Run on Android Studio (Android Emulator)

The repository includes a pre-configured native Android project located at [`frontend/android/`](file:///c:/Users/Krishna/Desktop/Honors/Student%20Managemant%20System/frontend/android).

### 1. Launch Android Studio & Start the Emulator
1. Open **Android Studio**.
2. Open the **Virtual Device Manager** (Device Manager).
3. Start any Android Virtual Device (AVD), such as `Pixel_9a` (API Level 34 or 35).
4. Verify the emulator is connected via terminal:
   ```powershell
   adb devices
   # Expected output: emulator-5554 device
   ```

### 2. Bridge the Emulator Network to Spring Boot
Android Emulators run in an isolated virtual network where `localhost` refers to the emulator itself. To allow the app to reach `http://localhost:8081`:
```powershell
# Map host port 8081 into the emulator
adb reverse tcp:8081 tcp:8081
```

### 3. Build & Install the Native Debug APK
Run Gradle to compile and install the debug APK onto the running emulator:
```powershell
cd frontend/android

# Use temp cache directory to bypass Windows space-in-path Gradle cache bug
.\gradlew.bat :app:installDebug --project-cache-dir C:\Users\Krishna\AppData\Local\Temp\sms-gradle
```

### 4. Launch the App on the Emulator
You can click the **StudentManagement** app icon in the emulator's app drawer, or launch it via terminal:
```powershell
adb shell am start -n com.studentmanagement.app/.MainActivity
```

### Optional: Standalone Offline Bundle (No Metro Needed)
If you want the emulator to run offline without a running Metro server:
```powershell
cd frontend

# Generate minified standalone bundle inside native Android assets
npx expo export:embed --platform android --dev false --entry-file App.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/

# Reinstall the APK
cd android
.\gradlew.bat :app:installDebug --project-cache-dir C:\Users\Krishna\AppData\Local\Temp\sms-gradle
```

---

## Part 3: How to Run on Expo (Expo Go / Development Server)

To test during development using Expo's hot-reloading bundler across emulators or physical phones:

### 1. Start the Expo Development Server
Run Expo Metro on port `8082`:
```powershell
cd frontend
npx expo start -c --port 8082
```

### 2. Run on Connected Android Emulator
In the terminal where Expo is running, press **`a`**:
* Expo will connect to the active Android emulator and launch the development client.

### 3. Run on a Physical Phone via Expo Go
1. Install **Expo Go** from Google Play Store or Apple App Store.
2. Ensure your phone and development PC are connected to the **same Wi-Fi network**.
3. Determine your PC's local LAN IP:
   ```powershell
   ipconfig
   # Look for IPv4 Address, e.g. 192.168.1.50
   ```
4. Update [`frontend/src/services/api.js`](file:///c:/Users/Krishna/Desktop/Honors/Student%20Managemant%20System/frontend/src/services/api.js) base URL if testing on physical phone:
   ```javascript
   const API_BASE_URL = 'http://192.168.1.50:8081/api/v1';
   ```
5. Scan the terminal QR code using the Expo Go camera (Android) or iOS Camera app.

---

## Pre-Seeded Demo Accounts for Immediate Testing

The database automatically seeds test accounts via Flyway migrations:

| Role | Email | Password | Details & Permissions |
| :--- | :--- | :--- | :--- |
| **TEACHER** | `teacher@sms.edu` | `Password123!` | Department: CS. Full administrative access to award/adjust points and view student directory. |
| **STUDENT** | `alice@sms.edu` | `Password123!` | CS001. Current Rank: **#1 (150 Points - Gold Badge)** |
| **STUDENT** | `bob@sms.edu` | `Password123!` | CS002. Current Rank: **#2 (120 Points - Silver Badge)** |
| **STUDENT** | `charlie@sms.edu` | `Password123!` | CS003. Current Rank: **#3 (90 Points - Bronze Badge)** |

---

## Troubleshooting & FAQs

### 1. `Port 8081 is already in use`
* **Cause**: Spring Boot backend runs on `8081`, which is also Expo's default port.
* **Fix**: Always specify `--port 8082` when starting Expo:
  ```powershell
  npx expo start --port 8082
  ```

### 2. Android Emulator shows `Network Error` on Login
* **Cause**: Emulator is unable to resolve host's `localhost:8081`.
* **Fix**: Run the reverse proxy command:
  ```powershell
  adb reverse tcp:8081 tcp:8081
  ```
  Also ensure cleartext HTTP is allowed in `AndroidManifest.xml` (`android:usesCleartextTraffic="true"`).

### 3. Gradle `Could not move temporary workspace (...dependencies-accessors...)`
* **Cause**: Gradle 8.8 Windows bug when workspace path contains spaces (`Student Managemant System`).
* **Fix**: Supply the `--project-cache-dir` flag pointing to a temp directory:
  ```powershell
  .\gradlew.bat :app:installDebug --project-cache-dir C:\Users\Krishna\AppData\Local\Temp\sms-gradle
  ```

### 4. Docker port 5432 occupied by another PostgreSQL instance
* **Fix**: The project's [`docker-compose.yml`](file:///c:/Users/Krishna/Desktop/Honors/Student%20Managemant%20System/docker-compose.yml) is mapped to host port `5434:5432` and backend `application.yml` uses port `5434`. No changes needed.

---

## Running Automated Tests

### Backend Test Suite (JUnit 5 / Mockito)
```powershell
cd backend
.\mvnw.cmd test
```
*Expected Result: 18 passed, 0 failed.*

### Frontend Test Suite (Jest)
```powershell
cd frontend
npm test -- --verbose
```
*Expected Result: 12 passed across 3 test suites.*

