<div align="center">
  <img src="https://img.shields.io/badge/Virtual%20Lab-NextGen%20EdTech-00F2FF?style=for-the-badge&logoColor=black" alt="Virtual Lab Badge"/>
  <h1 align="center">Hardware Virtual Lab & Simulation Engine</h1>
  <p align="center">
    <strong>A high-fidelity, 3D interactive electronics sandbox and IDE for microcontrollers.</strong>
  </p>
  <p align="center">
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" /></a>
    <a href="https://threejs.org/"><img src="https://img.shields.io/badge/3D%20Engine-Three.js%20(R3F)-000000?style=flat-square&logo=three.js&logoColor=white" alt="Three.js" /></a>
    <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" /></a>
    <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Database-Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=black" alt="Supabase" /></a>
  </p>
</div>

<hr/>

## ✨ Key Features

### 🔌 Live Interactive 3D Sandbox
Experience electronics in true 3D using `react-three-fiber`. Connect components visually on realistic breadboards. Real-time zooming, panning, and rendering power a full hardware assembly experience directly in the browser—no downloads required.


### 🖥️ Built-In Code Execution (Pyodide & AVR)
Write logic directly in the embedded code editor. The Virtual Lab supports simulated code execution for core Arduino AVR structures and tracks hardware registers, converting C++ microcontroller architectures directly into visual actions (like servo sweeps or blinking LEDs).

### 📖 Dynamic Hardware Library & Offline Datasheets
Hover over high-quality, perfectly scaled SVG components to instantly bring up comprehensive spec sheets (Manufacturer, Voltage, Usage, Pinouts). Integrated local caching means native PDF datasheets open effortlessly and reliably without relying on direct external hardware manufacturer CDNs.

### 🔐 Full Authentication & Telemetry Dashboard
Managed through Supabase, users can save their circuits ("Experiments") to the cloud, access historical code revisions, and track their personalized simulation footprints via an animated visual dashboard.

---

## 🏗️ System Architecture

* **Frontend:** React.js powered by Vite, utilizing Framer Motion for premium UI transitions, and Three.js for 3D lab rendering.
* **Backend:** Scalable FastAPI application structure managing the simulation bridge and hardware telemetry endpoints.
* **Auth & DB:** Supabase handles secure row-level-secured Postgres tables and robust User Auth.

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js**: v18+ recommended.
- **Python**: v3.10+ recommended.
- **Git**

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/virtual-lab.git
cd virtual-lab
```

### 3. Setup the Frontend (React / Vite)
```bash
cd frontend
npm install
# To run the development server:
npm run dev
```
*Frontend will typically launch on `http://localhost:5173`.*

### 4. Setup the Backend (FastAPI)
Open a new terminal session and navigate to the backend directory:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
# Launch the Uvicorn server:
uvicorn main:app --reload
```
*Backend will typically launch on `http://127.0.0.1:8000`.*

### 5. Environment Variables
To get full functionality (Authentication and Database):
1. Duplicate the `.env.example` in `/frontend/` to `.env`.
2. Add your **VITE_SUPABASE_URL** and **VITE_SUPABASE_ANON_KEY**.

---

<div align="center">
  <i>Developed with ❤️ for Next-Generation STEM Education</i>
</div>
