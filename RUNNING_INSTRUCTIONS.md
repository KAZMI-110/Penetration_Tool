# Running Instructions — VulneraX Deep Eye

Follow these steps to set up and run the VulneraX Deep Eye dashboard and scanning engine on your local machine.

## 1. Prerequisites
Ensure you have the following installed:
- **Git**: [Download Git](https://git-scm.com/downloads)
- **Node.js (v18+)**: [Download Node.js](https://nodejs.org/)
- **Python (3.10+)**: [Download Python](https://www.python.org/downloads/)

---

## 2. Installation

### Clone the Repository
```powershell
git clone https://github.com/Hussain-Ed/Frontend-GUI-project_parcel_2.git
cd Frontend-GUI-project_parcel_2
```

### Frontend Setup (Vite + React)
```powershell
# Install Node dependencies
npm install
```

### Backend Setup (FastAPI + Python)
```powershell
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r backend/requirements.txt
```

---

## 3. Configuration (Optional)
The project uses a configuration file for AI providers and scanner settings.

1. Locate `backend/config/config.yaml`.
2. To use real AI-driven scanning, update the `api_key` fields for your preferred provider (OpenAI, Claude, or Grok).
3. Set `enabled: true` for the provider you wish to use.

**Note:** If no API keys are provided or the engine is unavailable, the system will automatically run in **Simulation Mode**, allowing you to test the UI with mock data.

---

## 4. Running the Project

You need to run **two terminals** simultaneously:

### Terminal 1: Start the Backend
```powershell
# Ensure your virtual environment is active
python backend/main.py
```
*The API will start at `http://localhost:8000`*

### Terminal 2: Start the Frontend
```powershell
npm run dev
```
*The Dashboard will be available at `http://localhost:5173` (or the port shown in your terminal)*

---

## 5. Troubleshooting
- **Port Conflicts**: If port 8000 or 5173 is in use, the applications will try to use the next available port. Check the terminal output for the correct URL.
- **Missing Dependencies**: Ensure you ran `npm install` and `pip install -r backend/requirements.txt` successfully.
- **Python Path**: If `python` doesn't work, try `python3`.
