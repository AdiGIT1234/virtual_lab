# Virtual Lab Platform Blueprint

## 1. User Section Architecture

### Student / User
- Capabilities: login/signup, access labs, run simulations, save experiment results, track progress, view reports.

### Admin / Instructor
- Capabilities: create labs, upload experiments, view student analytics, manage users, track usage.

## 2. Application Flow
Landing Page → Login / Signup → User Dashboard → Lab Explorer → Experiment Simulator → Results & Analytics.

## 3. User Dashboard Layout
- **Top Bar:** `[Logo]  Search  Notifications  Profile`.
- **Sidebar:** Dashboard, Labs, My Experiments, Saved Simulations, Progress, Reports, Settings.
- **Main Content:** Welcome Card, Statistics (Labs Completed, Experiments Run, Time Spent), Recent Experiments, Recommended Labs.

## 4. Dashboard Components
1. **Welcome Card:** "Welcome, Aditya 👋" with encouragement to continue virtual electronics lab experiments.
2. **Statistics Widgets:** Labs Completed (8), Experiments Run (25), Simulation Time (12 hrs), Accuracy Score (86%).
3. **Recent Experiments:** ATmega328 GPIO Simulation, LED Blinking Circuit, PWM Motor Control, UART Communication. Each entry lists experiment name, last opened time, and a Resume button.
4. **Lab Explorer:** Categories such as Microcontroller Labs, Electronics Labs, Communication Labs, Embedded Systems. Labs display title, description, difficulty, and a Start Simulation action.

## 5. Experiment Page Layout
- Experiment Title banner at top.
- Instructions Panel, central Circuit Workspace, Components Panel on the left, Simulation Console at bottom.
- Components sample: Resistor, LED, ATmega328, Capacitor, Button.
- Workspace integrates Wokwi simulation, 3D models, and a code editor.

## 6. User Profile Section
- Profile details: Name, Email, Institute, Course, Year.
- Statistics: Experiments Completed, Average Score, Lab Activity.

## 7. Progress Tracking
- Learning analytics with charts, e.g., Experiment Progress bars: GPIO ████████, Timers █████, UART ███, PWM ███████.

## 8. Saved Experiments
- Saved Simulations list: LED Blink ATmega328, UART Serial Test, Motor Driver Circuit.
- Each entry offers Open, Edit, Delete actions.

## 9. Admin Dashboard
- Metrics: Users registered, Labs created, Experiments run, Server usage.
- Cards: Active Users, Total Experiments, Popular Lab, System Health.

## 10. Recommended Tech Stack
- **Frontend:** Next.js / React, Tailwind CSS, Three.js for 3D lab surfaces.
- **Simulation:** Wokwi API, custom WebGL circuits.
- **Backend:** Django with Django REST API, PostgreSQL database.
- **Authentication:** JWT-based auth.
- **Dev Environment:** React Native Expo (mobile companion), MacBook + VS Code, existing YOLO project support, Antigravity workflow.

## 11. Database Structure
- **User:** id, name, email, password, role, created_at.
- **Experiment:** id, title, description, lab_type, difficulty.
- **UserExperiment:** user_id, experiment_id, status, score, time_spent.

## 12. Build Order Checklist
- [ ] Step 1 – User authentication.
- [ ] Step 2 – Dashboard UI.
- [ ] Step 3 – Lab Explorer.
- [ ] Step 4 – Experiment workspace.
- [ ] Step 5 – Simulation engine.
- [ ] Step 6 – Progress analytics.
